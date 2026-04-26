import "server-only";

import { createHash, randomBytes } from "node:crypto";

export function hashOpaque(plain: string): string {
  return createHash("sha256").update(plain, "utf8").digest("hex");
}

/** High-entropy secret for handoff and refresh line tokens. */
export function newOpaqueSecret(): string {
  return randomBytes(32).toString("base64url");
}
