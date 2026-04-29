import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";
import type { AdminDb } from "../index";
import { adminDb } from "../index";
import {
  extensionClient,
  extensionHandoffCode,
  extensionRefresh,
} from "../schema/extension";
import { EXTENSION_REFRESH_TOMBSTONE_CAP } from "@/lib/extension-auth/constants";

const ACTIVE = "active" as const;
const CONSUMED = "consumed" as const;

/** Admin pool or `adminDb.transaction` callback — extension schema writes. */
export type AdminExtensionTx = Parameters<
  Parameters<(typeof adminDb)["transaction"]>[0]
>[0];

export async function insertHandoffCode(
  pool: AdminDb,
  values: {
    codeHash: string;
    userId: string;
    expiresAt: Date;
  },
) {
  await pool.insert(extensionHandoffCode).values(values);
}

export async function selectHandoffByHashForUpdate(
  tx: AdminExtensionTx,
  codeHash: string,
) {
  return tx
    .select()
    .from(extensionHandoffCode)
    .where(eq(extensionHandoffCode.codeHash, codeHash))
    .for("update")
    .limit(1);
}

export async function insertExtensionClient(
  tx: AdminExtensionTx,
  userId: string,
) {
  const [created] = await tx
    .insert(extensionClient)
    .values({ userId })
    .returning({ id: extensionClient.id });
  return created ?? null;
}

export async function insertActiveRefreshToken(
  tx: AdminExtensionTx,
  clientId: string,
  tokenHash: string,
) {
  await tx.insert(extensionRefresh).values({
    clientId,
    tokenHash,
    status: ACTIVE,
  });
}

export async function markHandoffUsed(tx: AdminExtensionTx, handoffId: string) {
  await tx
    .update(extensionHandoffCode)
    .set({ usedAt: new Date() })
    .where(eq(extensionHandoffCode.id, handoffId));
}

export async function selectRefreshByHashForUpdate(
  tx: AdminExtensionTx,
  tokenHash: string,
) {
  return tx
    .select()
    .from(extensionRefresh)
    .where(eq(extensionRefresh.tokenHash, tokenHash))
    .for("update")
    .limit(1);
}

export async function selectExtensionClientForUpdate(
  tx: AdminExtensionTx,
  clientId: string,
) {
  return tx
    .select()
    .from(extensionClient)
    .where(eq(extensionClient.id, clientId))
    .for("update")
    .limit(1);
}

export async function revokeExtensionClient(
  tx: AdminExtensionTx,
  clientId: string,
) {
  await tx
    .update(extensionClient)
    .set({ revokedAt: new Date() })
    .where(eq(extensionClient.id, clientId));
}

export async function markRefreshRowConsumed(
  tx: AdminExtensionTx,
  refreshId: string,
  consumedAt: Date,
) {
  await tx
    .update(extensionRefresh)
    .set({ status: CONSUMED, consumedAt })
    .where(eq(extensionRefresh.id, refreshId));
}

export async function pruneExcessRefreshTombstones(
  tx: AdminExtensionTx,
  clientId: string,
) {
  const rows = await tx
    .select({
      id: extensionRefresh.id,
      consumedAt: extensionRefresh.consumedAt,
    })
    .from(extensionRefresh)
    .where(
      and(
        eq(extensionRefresh.clientId, clientId),
        eq(extensionRefresh.status, CONSUMED),
      ),
    )
    .orderBy(asc(extensionRefresh.consumedAt));
  if (rows.length <= EXTENSION_REFRESH_TOMBSTONE_CAP) {
    return;
  }
  const overflow = rows.length - EXTENSION_REFRESH_TOMBSTONE_CAP;
  const toDelete = rows.slice(0, overflow).map((r) => r.id);
  if (toDelete.length > 0) {
    await tx
      .delete(extensionRefresh)
      .where(inArray(extensionRefresh.id, toDelete));
  }
}
