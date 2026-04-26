import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";
import { adminDb } from "@/db";
import {
  extensionClient,
  extensionHandoffCode,
  extensionRefresh,
} from "@/db/schema/extension";
import { EXTENSION_REFRESH_TOMBSTONE_CAP } from "@/lib/extension-auth/constants";
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

type DbTx = Parameters<
  Parameters<(typeof adminDb)["transaction"]>[0]
>[0];

async function pruneExcessTombstones(tx: DbTx, clientId: string) {
  const rows = await tx
    .select({ id: extensionRefresh.id, consumedAt: extensionRefresh.consumedAt })
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
  await adminDb.insert(extensionHandoffCode).values({
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
    const [row] = await tx
      .select()
      .from(extensionHandoffCode)
      .where(eq(extensionHandoffCode.codeHash, codeHash))
      .for("update")
      .limit(1);
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

    const [created] = await tx
      .insert(extensionClient)
      .values({ userId: row.userId })
      .returning({ id: extensionClient.id });
    if (!created) {
      throw new Error("Failed to create extension client");
    }
    const clientId = created.id;

    const refreshPlain = newOpaqueSecret();
    const refreshHash = hashOpaque(refreshPlain);
    await tx.insert(extensionRefresh).values({
      clientId,
      tokenHash: refreshHash,
      status: ACTIVE,
    });
    await tx
      .update(extensionHandoffCode)
      .set({ usedAt: new Date() })
      .where(eq(extensionHandoffCode.id, row.id));

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
    const [row] = await tx
      .select()
      .from(extensionRefresh)
      .where(eq(extensionRefresh.tokenHash, h))
      .for("update")
      .limit(1);
    if (!row) {
      throw new ExtensionAuthError("Invalid refresh token", 401);
    }
    const [client] = await tx
      .select()
      .from(extensionClient)
      .where(eq(extensionClient.id, row.clientId))
      .for("update")
      .limit(1);
    if (!client) {
      throw new ExtensionAuthError("Invalid client", 401);
    }
    if (client.revokedAt) {
      throw new ExtensionAuthError("This extension session was revoked", 401);
    }

    if (row.status === CONSUMED) {
      await tx
        .update(extensionClient)
        .set({ revokedAt: new Date() })
        .where(eq(extensionClient.id, client.id));
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
    await tx
      .update(extensionRefresh)
      .set({ status: CONSUMED, consumedAt: now })
      .where(eq(extensionRefresh.id, row.id));
    await tx.insert(extensionRefresh).values({
      clientId: client.id,
      tokenHash: newHash,
      status: ACTIVE,
    });
    await pruneExcessTombstones(tx, client.id);

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
