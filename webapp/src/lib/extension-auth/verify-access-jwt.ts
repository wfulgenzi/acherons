import "server-only";

import { importSPKI, jwtVerify, decodeProtectedHeader } from "jose";
import {
  EXTENSION_JWT_AUDIENCE,
} from "@/lib/extension-auth/constants";
import { getExtensionJwtIssuer } from "@/lib/extension-auth/issuer";
import { getActiveExtensionJwtKid } from "@/lib/extension-auth/mint-access-jwt";

const ALG = "ES256" as const;

function normalizePem(raw: string): string {
  return raw.replace(/\\n/g, "\n").trim();
}

type Pk = Awaited<ReturnType<typeof importSPKI>>;

type CachedResolvers = {
  currentKid: string;
  previousKid: string | null;
  byKid: Map<string, Pk>;
};

let cache: CachedResolvers | null = null;

/**
 * Resolves `kid` → public `KeyLike` for `jwtVerify`. Active key is derived from
 * `EXTENSION_JWT_PRIVATE_KEY` (SPKI) every time, plus optional
 * `EXTENSION_JWT_PREVIOUS_KID` + `EXTENSION_JWT_PREVIOUS_PUBLIC_KEY` (SPKI).
 */
export async function buildExtensionJwtPublicKeyByKid(): Promise<
  (kid: string) => Promise<Pk>
> {
  if (cache) {
    return async (kid) => {
      const k = cache!.byKid.get(kid);
      if (!k) {
        throw new Error(`Unknown extension JWT kid: ${kid}`);
      }
      return k;
    };
  }

  const { createPrivateKey, createPublicKey } = await import("node:crypto");

  const byKid = new Map<string, Pk>();
  const privatePem = process.env.EXTENSION_JWT_PRIVATE_KEY;
  if (!privatePem) {
    throw new Error("EXTENSION_JWT_PRIVATE_KEY is not set");
  }
  const currentKid = getActiveExtensionJwtKid();
  const pubFromPriv = createPublicKey(
    createPrivateKey({ key: normalizePem(privatePem), format: "pem" }),
  );
  const spkiPem = pubFromPriv.export({ type: "spki", format: "pem" }) as string;
  byKid.set(currentKid, await importSPKI(spkiPem, ALG));

  const prevKid = process.env.EXTENSION_JWT_PREVIOUS_KID?.trim() || null;
  const prevPubPem = process.env.EXTENSION_JWT_PREVIOUS_PUBLIC_KEY?.trim();
  if (prevKid && prevPubPem) {
    byKid.set(
      prevKid,
      await importSPKI(normalizePem(prevPubPem), ALG),
    );
  } else if (prevKid || prevPubPem) {
    throw new Error(
      "Set both EXTENSION_JWT_PREVIOUS_KID and EXTENSION_JWT_PREVIOUS_PUBLIC_KEY, or neither",
    );
  }

  cache = { currentKid, previousKid: prevKid, byKid };
  return async (kid) => {
    const k = byKid.get(kid);
    if (!k) {
      throw new Error(`Unknown extension JWT kid: ${kid}`);
    }
    return k;
  };
}

export type VerifiedExtensionAccess = {
  userId: string;
  clientId: string;
};

/**
 * Verifies `iss`, `aud`, `exp`, and signature (via `kid`). Call once per request.
 */
export async function verifyExtensionAccessJwt(
  token: string,
): Promise<VerifiedExtensionAccess> {
  const header = decodeProtectedHeader(token);
  const kid = header.kid;
  if (typeof kid !== "string" || !kid) {
    throw new Error("Extension access JWT: missing kid");
  }
  const resolve = await buildExtensionJwtPublicKeyByKid();
  const publicKey = await resolve(kid);
  const { payload } = await jwtVerify(token, publicKey, {
    issuer: getExtensionJwtIssuer(),
    audience: EXTENSION_JWT_AUDIENCE,
  });
  const sub = payload.sub;
  if (!sub) {
    throw new Error("Extension access JWT: missing sub");
  }
  const extCid = payload.ext_cid;
  if (typeof extCid !== "string" || !extCid) {
    throw new Error("Extension access JWT: missing ext_cid");
  }
  return { userId: sub, clientId: extCid };
}
