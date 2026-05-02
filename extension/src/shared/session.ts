import { ExtensionTokenResponseSchema } from "@acherons/contracts";
import * as v from "valibot";
import { clearExtensionMeCache } from "./auth/cacheUserInfo";
import { APP_BASE } from "./config";
import { PUSH_STATE_KEYS_CLEARED_ON_SIGN_OUT } from "./push-local-state";

export const SESSION_KEYS = [
  "accessToken",
  "refreshToken",
  "clientId",
  "expiresAt",
] as const;

export type SessionKey = (typeof SESSION_KEYS)[number];

export type ExtensionSessionState =
  | "ok"
  | "no_tokens"
  | "unauth"
  | "error"
  | "net";

export type ExtensionSessionResult = {
  state: ExtensionSessionState;
  detail: string;
  expiresAt?: number;
};

export function getStorageTokens(): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    chrome.storage.local.get([...SESSION_KEYS], resolve);
  });
}

/** Clear stored tokens (local “log out” for this install) and membership cache (API2). */
export async function clearExtensionSessionInStorage(): Promise<void> {
  await clearExtensionMeCache();
  await new Promise<void>((resolve) => {
    chrome.storage.local.remove(
      [...SESSION_KEYS, ...PUSH_STATE_KEYS_CLEARED_ON_SIGN_OUT],
      () => {
        void chrome.runtime.lastError;
        resolve();
      },
    );
  });
}

export async function checkExtensionSession(): Promise<ExtensionSessionResult> {
  const st = await getStorageTokens();
  const access0 = st.accessToken;
  const refreshToken = st.refreshToken;
  const expiresAt = st.expiresAt;

  if (typeof access0 !== "string" || !access0) {
    return {
      state: "no_tokens",
      detail: "No tokens. Use Connect in the popup first.",
    };
  }

  const ping = (token: string) =>
    fetch(`${APP_BASE}/api/notifications/read-all`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

  let res: Response;
  try {
    res = await ping(access0);
  } catch {
    return {
      state: "net",
      detail:
        "Network error. Is the webapp running at " + APP_BASE + "?",
    };
  }

  if (res.status === 401 && typeof refreshToken === "string" && refreshToken) {
    let r2: Response;
    try {
      r2 = await fetch(`${APP_BASE}/api/extension/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      return {
        state: "net",
        detail:
          "Network error (refresh). Is the webapp up at " + APP_BASE + "?",
      };
    }
    if (r2.ok) {
      const raw: unknown = await r2.json();
      const parsed = v.safeParse(ExtensionTokenResponseSchema, raw);
      if (!parsed.success) {
        return {
          state: "error",
          detail: "Refresh response did not match contract.",
        };
      }
      const d = parsed.output;
      await chrome.storage.local.set({
        accessToken: d.accessToken,
        refreshToken: d.refreshToken,
        clientId: d.clientId,
        expiresAt: d.expiresAt,
      });
      try {
        res = await ping(d.accessToken);
      } catch {
        return { state: "net", detail: "Network error after refresh." };
      }
    }
  }

  if (res.ok) {
    return {
      state: "ok",
      detail: "Authenticated (POST /api/notifications/read-all).",
      expiresAt:
        typeof expiresAt === "number"
          ? expiresAt
          : typeof expiresAt === "string"
            ? Number(expiresAt)
            : undefined,
    };
  }

  const text = await res.text().catch(() => "");
  if (res.status === 401) {
    return {
      state: "unauth",
      detail: text || "Session expired. Connect again from the popup.",
    };
  }
  return {
    state: "error",
    detail: `${res.status} ${(text || "").slice(0, 160)}`,
  };
}

export async function getBearerAccessToken(): Promise<
  { ok: true; token: string } | { ok: false; detail: string }
> {
  const session = await checkExtensionSession();
  if (session.state !== "ok") {
    return { ok: false, detail: session.detail };
  }
  const st = await getStorageTokens();
  const token = st.accessToken;
  if (typeof token !== "string" || !token) {
    return { ok: false, detail: "No access token." };
  }
  return { ok: true, token };
}
