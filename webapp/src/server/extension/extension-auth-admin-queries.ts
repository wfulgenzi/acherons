/**
 * Extension auth: admin-pool writes/reads for handoff + refresh flows.
 */
import type { AdminDb } from "@/db";
import { adminExtensionAuthRepo } from "@/db/repositories";
import type { AdminExtensionTx } from "@/db/repositories/admin-extension-auth";

export type { AdminExtensionTx } from "@/db/repositories/admin-extension-auth";

export async function adminInsertExtensionHandoffCode(
  pool: AdminDb,
  values: {
    codeHash: string;
    userId: string;
    expiresAt: Date;
  },
) {
  return adminExtensionAuthRepo.insertHandoffCode(pool, values);
}

export async function adminSelectHandoffByHashForUpdate(
  tx: AdminExtensionTx,
  codeHash: string,
) {
  return adminExtensionAuthRepo.selectHandoffByHashForUpdate(tx, codeHash);
}

export async function adminInsertExtensionClient(
  tx: AdminExtensionTx,
  userId: string,
) {
  return adminExtensionAuthRepo.insertExtensionClient(tx, userId);
}

export async function adminInsertActiveRefreshToken(
  tx: AdminExtensionTx,
  clientId: string,
  tokenHash: string,
) {
  return adminExtensionAuthRepo.insertActiveRefreshToken(
    tx,
    clientId,
    tokenHash,
  );
}

export async function adminMarkHandoffUsed(
  tx: AdminExtensionTx,
  handoffId: string,
) {
  return adminExtensionAuthRepo.markHandoffUsed(tx, handoffId);
}

export async function adminSelectRefreshByHashForUpdate(
  tx: AdminExtensionTx,
  tokenHash: string,
) {
  return adminExtensionAuthRepo.selectRefreshByHashForUpdate(tx, tokenHash);
}

export async function adminSelectExtensionClientForUpdate(
  tx: AdminExtensionTx,
  clientId: string,
) {
  return adminExtensionAuthRepo.selectExtensionClientForUpdate(tx, clientId);
}

export async function adminRevokeExtensionClient(
  tx: AdminExtensionTx,
  clientId: string,
) {
  return adminExtensionAuthRepo.revokeExtensionClient(tx, clientId);
}

export async function adminMarkRefreshRowConsumed(
  tx: AdminExtensionTx,
  refreshId: string,
  consumedAt: Date,
) {
  return adminExtensionAuthRepo.markRefreshRowConsumed(
    tx,
    refreshId,
    consumedAt,
  );
}

export async function adminPruneExcessRefreshTombstones(
  tx: AdminExtensionTx,
  clientId: string,
) {
  return adminExtensionAuthRepo.pruneExcessRefreshTombstones(tx, clientId);
}
