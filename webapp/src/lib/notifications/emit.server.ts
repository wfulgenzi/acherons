import "server-only";

import { after } from "next/server";
import { adminDb, asAdminDb } from "@/db";
import type { AdminDbOrTx } from "@/db/repositories/admin-notifications";
import { adminNotificationsRepo } from "@/db/repositories";
import { fanOutWebPushForOrg } from "@/lib/web-push/fanout-org.server";
import {
  type NotificationType,
} from "./contract";
import { labelForNotificationType } from "./labels";

const adb = asAdminDb(adminDb);

function scheduleWebPushFanOut(recipientOrgId: string, type: NotificationType) {
  const title = "Acherons";
  const body = labelForNotificationType(type);
  try {
    after(async () => {
      await fanOutWebPushForOrg(recipientOrgId, { title, body });
    });
  } catch {
    void fanOutWebPushForOrg(recipientOrgId, { title, body }).catch((e) => {
      console.error("[web-push] fan-out failed:", e);
    });
  }
}

async function insertInboxRowWithFanOut(
  client: AdminDbOrTx,
  recipientOrgId: string,
  type: NotificationType,
  context: unknown,
) {
  await adminNotificationsRepo.insertInboxNotificationRow(
    client,
    recipientOrgId,
    type,
    context,
  );
  scheduleWebPushFanOut(recipientOrgId, type);
}

/**
 * Inserts a single `notifications` row for the **recipient** org inbox.
 * Uses the admin connection (bypasses RLS); authorization must be done by the
 * caller before calling. All app code that creates notifications should use
 * this module so `adminDb` is not imported from individual routes.
 */
export async function createInboxNotification(
  recipientOrgId: string,
  type: NotificationType,
  context: unknown,
): Promise<void> {
  await insertInboxRowWithFanOut(adb, recipientOrgId, type, context);
}

/**
 * Same as {@link createInboxNotification}, but uses a client from
 * `adminDb.transaction(async (tx) => { ... })` so the insert is atomic with
 * other work on that admin transaction.
 */
export async function createInboxNotificationWithClient(
  client: AdminDbOrTx,
  recipientOrgId: string,
  type: NotificationType,
  context: unknown,
): Promise<void> {
  await insertInboxRowWithFanOut(client, recipientOrgId, type, context);
}

/**
 * One `request.created` inbox row per invited clinic (single admin transaction).
 */
export async function notifyClinicsRequestCreated(
  requestId: string,
  clinicOrgIds: readonly string[],
): Promise<void> {
  if (clinicOrgIds.length === 0) {
    return;
  }
  await adminDb.transaction(async (tx) => {
    for (const clinicOrgId of clinicOrgIds) {
      await insertInboxRowWithFanOut(tx, clinicOrgId, "request.created", {
        requestId,
      });
    }
  });
}
