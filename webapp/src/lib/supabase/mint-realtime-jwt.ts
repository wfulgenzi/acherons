import { SignJWT, decodeJwt, importPKCS8 } from "jose";

const TTL = "15m" as const;

// Server-only env (Vercel / .env.local):
// — Symmetric: SUPABASE_JWT_SECRET (HS256) — a signing secret from "JWT / signing keys"
//   in the dashboard (HMAC), not the anon or service_role API keys.
// — Asymmetric (preferred): SUPABASE_JWT_PRIVATE_KEY (PKCS#8 PEM) + SUPABASE_JWT_KID
//   + optional SUPABASE_JWT_ALG=ES256|RS256 (default ES256). You generate the key
//   pair, register the *public* key in Supabase, and keep the private key here.

type AsymmetricAlg = "ES256" | "RS256";

function getIssuer() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }
  return `${base}/auth/v1`;
}

function normalizePem(raw: string): string {
  return raw.replace(/\\n/g, "\n").trim();
}

let cachedAsymmetric: {
  alg: AsymmetricAlg;
  pem: string;
  key: Awaited<ReturnType<typeof importPKCS8>>;
} | null = null;

async function getAsymmetricKey(alg: AsymmetricAlg) {
  const raw = process.env.SUPABASE_JWT_PRIVATE_KEY;
  if (!raw) {
    throw new Error("SUPABASE_JWT_PRIVATE_KEY is not set");
  }
  const pem = normalizePem(raw);
  if (cachedAsymmetric && cachedAsymmetric.alg === alg && cachedAsymmetric.pem === pem) {
    return cachedAsymmetric.key;
  }
  const key = await importPKCS8(pem, alg);
  cachedAsymmetric = { alg, pem, key };
  return key;
}

export type MintRealtimeJwtResult = {
  token: string;
  /** Unix seconds */
  exp: number;
};

/**
 * Issues a short-lived JWT Supabase accepts for Realtime/PostgREST
 * (`role` authenticated, `org_id` for RLS, `sub` = app user id).
 * Uses either HS256 (secret) or ES256/RS256 (imported private key + kid).
 */
export async function mintRealtimeAccessJwt(
  userId: string,
  orgId: string
): Promise<MintRealtimeJwtResult> {
  const iss = getIssuer();
  const body = { role: "authenticated" as const, org_id: orgId };
  const kid = process.env.SUPABASE_JWT_KID;
  const privatePem = process.env.SUPABASE_JWT_PRIVATE_KEY;
  const secret = process.env.SUPABASE_JWT_SECRET;

  let jwt: string;

  if (privatePem) {
    if (!kid) {
      throw new Error("SUPABASE_JWT_KID is required when SUPABASE_JWT_PRIVATE_KEY is set");
    }
    const alg = (process.env.SUPABASE_JWT_ALG as AsymmetricAlg) || "ES256";
    if (alg !== "ES256" && alg !== "RS256") {
      throw new Error("SUPABASE_JWT_ALG must be ES256 or RS256 when using a private key");
    }
    const key = await getAsymmetricKey(alg);
    jwt = await new SignJWT(body)
      .setProtectedHeader({ alg, typ: "JWT", kid })
      .setSubject(userId)
      .setIssuer(iss)
      .setAudience("authenticated")
      .setIssuedAt()
      .setExpirationTime(TTL)
      .sign(key);
  } else if (secret) {
    const key = new TextEncoder().encode(secret);
    jwt = await new SignJWT(body)
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setSubject(userId)
      .setIssuer(iss)
      .setAudience("authenticated")
      .setIssuedAt()
      .setExpirationTime(TTL)
      .sign(key);
  } else {
    throw new Error(
      "Set SUPABASE_JWT_SECRET, or SUPABASE_JWT_PRIVATE_KEY and SUPABASE_JWT_KID"
    );
  }

  const { exp: expSec } = decodeJwt(jwt);
  return {
    token: jwt,
    exp: typeof expSec === "number" ? expSec : Math.floor(Date.now() / 1000) + 900,
  };
}
