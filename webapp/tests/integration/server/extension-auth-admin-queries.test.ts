import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { adminDb } from "@/db";
import { user } from "@/db/schema";
import { extensionHandoffCode, extensionRefresh } from "@/db/schema/extension";
import {
  adminInsertActiveRefreshToken,
  adminInsertExtensionClient,
  adminInsertExtensionHandoffCode,
  adminMarkHandoffUsed,
  adminMarkRefreshRowConsumed,
  adminSelectExtensionClientForUpdate,
  adminSelectHandoffByHashForUpdate,
  adminSelectRefreshByHashForUpdate,
} from "@/server/extension/extension-auth-admin-queries";
import { resetIntegrationDatabase } from "../helpers/test-db";

const SEED_USER_ID = "integration_ext_auth_user";

describe("extension auth admin queries (integration)", () => {
  beforeEach(async () => {
    await resetIntegrationDatabase();
    const now = new Date();
    await adminDb.insert(user).values({
      id: SEED_USER_ID,
      name: "Extension Auth Seed",
      email: "extension-auth-seed@example.test",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });
  });

  it("runs handoff → client → refresh flow via server wrappers", async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    await adminInsertExtensionHandoffCode(adminDb, {
      codeHash: "hash_handoff_integration",
      userId: SEED_USER_ID,
      expiresAt,
    });

    await adminDb.transaction(async (tx) => {
      const handoffRows = await adminSelectHandoffByHashForUpdate(
        tx,
        "hash_handoff_integration",
      );
      expect(handoffRows).toHaveLength(1);
      expect(handoffRows[0].usedAt).toBeNull();

      const clientRow = await adminInsertExtensionClient(tx, SEED_USER_ID);
      expect(clientRow).not.toBeNull();

      await adminInsertActiveRefreshToken(
        tx,
        clientRow!.id,
        "hash_refresh_integration",
      );

      await adminMarkHandoffUsed(tx, handoffRows[0].id);

      const refreshRows = await adminSelectRefreshByHashForUpdate(
        tx,
        "hash_refresh_integration",
      );
      expect(refreshRows).toHaveLength(1);
      expect(refreshRows[0].status).toBe("active");

      await adminMarkRefreshRowConsumed(
        tx,
        refreshRows[0].id,
        new Date(),
      );

      const clientLocked = await adminSelectExtensionClientForUpdate(
        tx,
        clientRow!.id,
      );
      expect(clientLocked).toHaveLength(1);
    });

    const [handoffAfter] = await adminDb
      .select()
      .from(extensionHandoffCode)
      .where(eq(extensionHandoffCode.codeHash, "hash_handoff_integration"));
    expect(handoffAfter?.usedAt).not.toBeNull();

    const consumed = await adminDb
      .select()
      .from(extensionRefresh)
      .where(eq(extensionRefresh.tokenHash, "hash_refresh_integration"));
    expect(consumed).toHaveLength(1);
    expect(consumed[0].status).toBe("consumed");
  });
});
