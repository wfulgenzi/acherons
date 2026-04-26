import "server-only";

import { createPrivateKey, type KeyObject } from "node:crypto";
import { SignJWT, decodeJwt } from "jose";
import {
  EXTENSION_ACCESS_TTL,
  EXTENSION_JWT_AUDIENCE,
} from "@/lib/extension-auth/constants";
import { getExtensionJwtIssuer } from "@/lib/extension-auth/issuer";
import { normalizeEnvPem } from "@/lib/normalize-env-pem";

const ALG = "ES256" as const;

let cached: { pem: string; privateKey: KeyObject } | null = null;

/**
 * Loads PEM the same way as the Supabase realtime minter: `node:crypto`
 * `createPrivateKey` (PKCS#8 or EC SEC1), then `jose` `SignJWT` / `decodeJwt`
 * (keep JWT logic on jose, keys on Node).
 */
function getSigningKey() {
  const raw = process.env.EXTENSION_JWT_PRIVATE_KEY;
  if (!raw) {
    throw new Error("EXTENSION_JWT_PRIVATE_KEY is not set");
  }
  if (!process.env.EXTENSION_JWT_KID) {
    throw new Error("EXTENSION_JWT_KID is not set (required for extension JWTs)");
  }
  const pem = normalizeEnvPem(raw);
  if (cached && cached.pem === pem) {
    return cached.privateKey;
  }
  let privateKey: KeyObject;
  try {
    privateKey = createPrivateKey({ key: pem, format: "pem" });
  } catch {
    throw new Error(
      "EXTENSION_JWT_PRIVATE_KEY is not a valid PEM private key (expect PKCS#8 or EC SEC1 PEM, often from openssl genpkey or openssl ec + openssl pkcs8 -topk8).",
    );
  }
  cached = { pem, privateKey };
  return privateKey;
}

export function getActiveExtensionJwtKid(): string {
  const kid = process.env.EXTENSION_JWT_KID;
  if (!kid) {
    throw new Error("EXTENSION_JWT_KID is not set");
  }
  return kid;
}

export type MintExtensionAccessJwtResult = {
  token: string;
  /** Unix seconds */
  expiresAtSec: number;
};

/**
 * Access JWT: `sub` = user id; `ext_cid` = extension client (family) id. No `org_id`.
 * Signed with ES256 + `kid` for rotation. Verification uses the matching public key(s).
 */
export async function mintExtensionAccessJwt(options: {
  userId: string;
  clientId: string;
}): Promise<MintExtensionAccessJwtResult> {
  const { userId, clientId } = options;
  const privateKey = getSigningKey();
  const iss = getExtensionJwtIssuer();
  const kid = getActiveExtensionJwtKid();
  const token = await new SignJWT({ ext_cid: clientId })
    .setProtectedHeader({ alg: ALG, typ: "JWT", kid })
    .setSubject(userId)
    .setIssuer(iss)
    .setAudience(EXTENSION_JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(EXTENSION_ACCESS_TTL)
    .sign(privateKey);
  const { exp: expSec } = decodeJwt(token);
  return {
    token,
    expiresAtSec:
      typeof expSec === "number" ? expSec : Math.floor(Date.now() / 1000) + 900,
  };
}
