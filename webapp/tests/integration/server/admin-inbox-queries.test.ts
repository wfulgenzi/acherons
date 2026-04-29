import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { adminDb } from "@/db";
import { notifications, organisations } from "@/db/schema";
import { insertInboxNotificationRowAdmin } from "@/server/notifications/admin-inbox-queries";
import { resetIntegrationDatabase } from "../helpers/test-db";

const ORG_ID = "dddddddd-dddd-dddd-dddd-dddddddddddd";
const REQUEST_ID = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";

describe("admin inbox queries (integration)", () => {
  beforeEach(async () => {
    await resetIntegrationDatabase();
    const now = new Date();
    await adminDb.insert(organisations).values({
      id: ORG_ID,
      name: "Inbox Org",
      type: "dispatch",
      createdAt: now,
      updatedAt: now,
    });
  });

  it("insertInboxNotificationRowAdmin persists a validated notification row", async () => {
    await insertInboxNotificationRowAdmin(
      adminDb,
      ORG_ID,
      "request.created",
      { requestId: REQUEST_ID },
    );

    const rows = await adminDb
      .select()
      .from(notifications)
      .where(eq(notifications.orgId, ORG_ID));

    expect(rows).toHaveLength(1);
    expect(rows[0].type).toBe("request.created");
    expect(rows[0].context).toEqual({ requestId: REQUEST_ID });
  });
});
