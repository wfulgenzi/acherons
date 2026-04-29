import "server-only";

import { adminDb, asAdminDb } from "@/db";
import { adminExtensionAuthRepo } from "@/db/repositories";
import { ExtensionAuthError } from "@/lib/extension-auth/errors";
import { hashOpaque, newOpaqueSecret } from "@/lib/extension-auth/hashing";
import { mintExtensionAccessJwt } from "@/lib/extension-auth/mint-access-jwt";
import { getMembership, type MembershipContext } from "@/lib/membership";
import { EXTENSION_HANDOFF_TTL_MIN } from "@/lib/extension-auth/constants";

const ACTIVE = "active" as const;
const CONSUMED = "consumed" as const;

export type ExchangeOrRefreshResult = {
  accessToken: string;
  accessExpiresAtSec: number;
  /** Plaintext; show once to the client. */
  refreshToken: string;
  clientId: string;
};

async function requireMembership(
  userId: string,
): Promise<MembershipContext> {
  const m = await getMembership(userId);
  if (!m) {
    throw new ExtensionAuthError("No active organisation membership", 403);
  }
  return m;
}

/**
 * One-time handoff: signed-in user gets a code to pass to the extension.
 */
export async function createHandoff(
  userId: string,
): Promise<{ code: string; expiresInSec: number }> {
  await requireMembership(userId);
  const code = newOpaqueSecret();
  const codeHash = hashOpaque(code);
  const expires = new Date(
    Date.now() + EXTENSION_HANDOFF_TTL_MIN * 60_000,
  );
  await adminExtensionAuthRepo.insertHandoffCode(asAdminDb(adminDb), {
    codeHash,
    userId,
    expiresAt: expires,
  });
  return {
    code,
    expiresInSec: EXTENSION_HANDOFF_TTL_MIN * 60,
  };
}

/**
 * Exchanges a one-time code for first access + refresh + new extension client.
 */
export async function exchangeHandoffCode(
  code: string,
): Promise<ExchangeOrRefreshResult> {
  const codeHash = hashOpaque(code);
  return adminDb.transaction(async (tx) => {
    const [row] =
      await adminExtensionAuthRepo.selectHandoffByHashForUpdate(tx, codeHash);
    if (!row) {
      throw new ExtensionAuthError("Invalid or unknown handoff code", 400);
    }
    if (row.usedAt) {
      throw new ExtensionAuthError("Handoff code already used", 400);
    }
    if (row.expiresAt.getTime() < Date.now()) {
      throw new ExtensionAuthError("Handoff code expired", 400);
    }
    const membership = await getMembership(row.userId);
    if (!membership) {
      throw new ExtensionAuthError("No active organisation membership", 403);
    }

    const created = await adminExtensionAuthRepo.insertExtensionClient(
      tx,
      row.userId,
    );
    if (!created) {
      throw new Error("Failed to create extension client");
    }
    const clientId = created.id;

    const refreshPlain = newOpaqueSecret();
    const refreshHash = hashOpaque(refreshPlain);
    await adminExtensionAuthRepo.insertActiveRefreshToken(
      tx,
      clientId,
      refreshHash,
    );
    await adminExtensionAuthRepo.markHandoffUsed(tx, row.id);

    const { token: accessToken, expiresAtSec: accessExpiresAtSec } =
      await mintExtensionAccessJwt({
        userId: row.userId,
        clientId,
      });
    return {
      accessToken,
      accessExpiresAtSec,
      refreshToken: refreshPlain,
      clientId,
    };
  });
}

/**
 * Refreshes access; rotates the refresh token and prunes old tombstones.
 * On reuse of a **consumed** token (replay in retention window), revokes the full client line.
 */
export async function rotateRefreshToken(
  refreshPlain: string,
): Promise<ExchangeOrRefreshResult> {
  const h = hashOpaque(refreshPlain);
  return adminDb.transaction(async (tx) => {
    const [row] = await adminExtensionAuthRepo.selectRefreshByHashForUpdate(
      tx,
      h,
    );
    if (!row) {
      throw new ExtensionAuthError("Invalid refresh token", 401);
    }
    const [client] =
      await adminExtensionAuthRepo.selectExtensionClientForUpdate(
        tx,
        row.clientId,
      );
    if (!client) {
      throw new ExtensionAuthError("Invalid client", 401);
    }
    if (client.revokedAt) {
      throw new ExtensionAuthError("This extension session was revoked", 401);
    }

    if (row.status === CONSUMED) {
      await adminExtensionAuthRepo.revokeExtensionClient(tx, client.id);
      throw new ExtensionAuthError(
        "Refresh token reuse detected; sessions revoked",
        401,
        "REUSE",
      );
    }
    if (row.status !== ACTIVE) {
      throw new ExtensionAuthError("Invalid refresh token", 401);
    }

    await requireMembership(client.userId);

    const newPlain = newOpaqueSecret();
    const newHash = hashOpaque(newPlain);
    const now = new Date();
    await adminExtensionAuthRepo.markRefreshRowConsumed(tx, row.id, now);
    await adminExtensionAuthRepo.insertActiveRefreshToken(tx, client.id, newHash);
    await adminExtensionAuthRepo.pruneExcessRefreshTombstones(tx, client.id);

    const { token: accessToken, expiresAtSec: accessExpiresAtSec } =
      await mintExtensionAccessJwt({
        userId: client.userId,
        clientId: client.id,
      });
    return {
      accessToken,
      accessExpiresAtSec,
      refreshToken: newPlain,
      clientId: client.id,
    };
  });
}
