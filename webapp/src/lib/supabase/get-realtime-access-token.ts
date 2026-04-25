/**
 * Browser-only: fetches a short-lived JWT from /api/realtime-token
 * (Better Auth session cookie) and memoizes it until just before expiry.
 */
const SKEW_SEC = 60;

let cache: { token: string; exp: number } | null = null;
let inFlight: Promise<string> | null = null;

function clearCache() {
  cache = null;
}

/**
 * @throws if the user is not allowed a token (401/403) or the request fails
 */
export async function getRealtimeAccessToken(): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("getRealtimeAccessToken() is browser-only");
  }
  const now = Math.floor(Date.now() / 1000);
  if (cache && cache.exp - SKEW_SEC > now) {
    return cache.token;
  }
  if (inFlight) {
    return inFlight;
  }
  inFlight = (async () => {
    const res = await fetch("/api/realtime-token", { credentials: "include" });
    if (res.status === 401) {
      clearCache();
      throw new Error("Session required for Supabase Realtime");
    }
    if (res.status === 403) {
      clearCache();
      throw new Error("Organisation membership required for Supabase Realtime");
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`realtime token failed: ${res.status} ${text}`);
    }
    const data = (await res.json()) as { token: string; expiresAt: number };
    cache = { token: data.token, exp: data.expiresAt };
    return data.token;
  })();
  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

