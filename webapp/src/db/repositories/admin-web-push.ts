import "server-only";

import webpush from "web-push";
import { eq, sql } from "drizzle-orm";
import type { AdminDb } from "../index";
import { memberships } from "../schema/memberships";
import { webPushSubscription } from "../schema/extension";
import { ensureWebPushVapidConfigured } from "@/lib/web-push/vapid-send-config.server";
import type { WebPushFanOutPayload } from "@/lib/web-push/types";

const LOG = "[web-push]";

function shortEndpoint(url: string, max = 72): string {
  if (url.length <= max) return url;
  return `${url.slice(0, max)}…`;
}

/**
 * Sends one encrypted Web Push per subscription for users whose membership matches `orgId`.
 * Updates `last_success_at` / `failure_count`, deletes rows on 410 Gone.
 */
export async function fanOutWebPushForOrg(
  adb: AdminDb,
  orgId: string,
  payload: WebPushFanOutPayload,
): Promise<void> {
  if (!ensureWebPushVapidConfigured()) {
    console.warn(
      `${LOG} VAPID not configured (check WEB_PUSH_VAPID_* env); skipping fan-out for org`,
      orgId,
    );
    return;
  }

  const rows = await adb
    .select({
      id: webPushSubscription.id,
      userId: webPushSubscription.userId,
      endpoint: webPushSubscription.endpoint,
      keys: webPushSubscription.keys,
    })
    .from(webPushSubscription)
    .innerJoin(
      memberships,
      eq(memberships.userId, webPushSubscription.userId),
    )
    .where(eq(memberships.orgId, orgId));

  if (rows.length === 0) {
    console.log(
      `${LOG} no web_push_subscription rows for org (with membership join)`,
      orgId,
    );
    return;
  }

  console.log(
    `${LOG} fan-out start`,
    { orgId, subscriptionCount: rows.length, type: payload.body.slice(0, 60) },
  );

  const bodyStr = JSON.stringify({
    title: payload.title,
    body: payload.body,
  });

  for (const row of rows) {
    console.log(`${LOG} sending`, {
      userId: row.userId,
      subscriptionId: row.id,
      endpoint: shortEndpoint(row.endpoint),
    });
    try {
      await webpush.sendNotification(
        {
          endpoint: row.endpoint,
          keys: row.keys,
        },
        bodyStr,
        { TTL: 3600 },
      );
      console.log(`${LOG} send ok`, {
        userId: row.userId,
        subscriptionId: row.id,
      });
      await adb
        .update(webPushSubscription)
        .set({
          lastSuccessAt: new Date(),
          failureCount: 0,
          updatedAt: new Date(),
        })
        .where(eq(webPushSubscription.id, row.id));
    } catch (err: unknown) {
      const status =
        typeof err === "object" &&
        err !== null &&
        "statusCode" in err &&
        typeof (err as { statusCode: unknown }).statusCode === "number"
          ? (err as { statusCode: number }).statusCode
          : undefined;

      if (status === 410 || status === 404) {
        console.warn(`${LOG} send ${status}, removing subscription`, {
          userId: row.userId,
          subscriptionId: row.id,
        });
        await adb
          .delete(webPushSubscription)
          .where(eq(webPushSubscription.id, row.id));
        continue;
      }

      console.warn(`${LOG} send failed`, {
        userId: row.userId,
        subscriptionId: row.id,
        status,
        message: err instanceof Error ? err.message : String(err),
      });
      await adb
        .update(webPushSubscription)
        .set({
          failureCount: sql`${webPushSubscription.failureCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(webPushSubscription.id, row.id));
    }
  }
}
