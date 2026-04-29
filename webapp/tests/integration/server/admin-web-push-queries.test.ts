import { describe, it, expect, vi, beforeEach } from "vitest";

const sendNotificationMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue(undefined),
);

vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: sendNotificationMock,
  },
}));

vi.mock("@/lib/web-push/vapid-send-config.server", () => ({
  ensureWebPushVapidConfigured: () => true,
}));

import { eq } from "drizzle-orm";
import { adminDb } from "@/db";
import { memberships, organisations, user } from "@/db/schema";
import { extensionClient, webPushSubscription } from "@/db/schema/extension";
import { fanOutWebPushForOrg } from "@/server/web-push/admin-web-push-queries";
import { resetIntegrationDatabase } from "../helpers/test-db";

const ORG_ID = "f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0";
const USER_ID = "integration_webpush_user";
const ENDPOINT = "https://push.example.test/web-push/001";

describe("admin web push queries (integration)", () => {
  beforeEach(async () => {
    await resetIntegrationDatabase();
    sendNotificationMock.mockClear();
    const now = new Date();
    await adminDb.insert(organisations).values({
      id: ORG_ID,
      name: "Web Push Org",
      type: "dispatch",
      createdAt: now,
      updatedAt: now,
    });
    await adminDb.insert(user).values({
      id: USER_ID,
      name: "Web Push User",
      email: "web-push-integration@example.test",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });
    await adminDb.insert(memberships).values({
      userId: USER_ID,
      orgId: ORG_ID,
      role: "admin",
    });
    const [client] = await adminDb
      .insert(extensionClient)
      .values({ userId: USER_ID })
      .returning({ id: extensionClient.id });

    await adminDb.insert(webPushSubscription).values({
      userId: USER_ID,
      clientId: client.id,
      endpoint: ENDPOINT,
      keys: { p256dh: "dGVzdA", auth: "dGVzdGI" },
    });
  });

  it("fanOutWebPushForOrg loads subscriptions for the org and invokes web-push send", async () => {
    await fanOutWebPushForOrg(ORG_ID, {
      title: "Test",
      body: "Hello from integration",
    });

    expect(sendNotificationMock).toHaveBeenCalledTimes(1);
    const call = sendNotificationMock.mock.calls[0];
    expect(call?.[0]).toMatchObject({
      endpoint: ENDPOINT,
      keys: { p256dh: "dGVzdA", auth: "dGVzdGI" },
    });
    expect(call?.[1]).toContain("Hello from integration");

    const rows = await adminDb
      .select()
      .from(webPushSubscription)
      .where(eq(webPushSubscription.endpoint, ENDPOINT));
    expect(rows).toHaveLength(1);
    expect(rows[0].failureCount).toBe(0);
    expect(rows[0].lastSuccessAt).not.toBeNull();
  });
});
