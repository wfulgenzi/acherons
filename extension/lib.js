// Shared by popup + status. Basic Bearer check: POST /api/notifications/read-all
var APP_BASE = "http://localhost:3000";

const SESSION_KEYS = ["accessToken", "refreshToken", "clientId", "expiresAt"];

function getStorageTokens() {
  return new Promise((resolve) => {
    chrome.storage.local.get(SESSION_KEYS, resolve);
  });
}

/**
 * Clear stored extension tokens (local “log out” for the extension). Server-side
 * refresh rows remain until they expire; use a future web “devices” page to
 * revoke the install line.
 */
function clearExtensionSessionInStorage() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(SESSION_KEYS, () => {
      void chrome.runtime.lastError;
      resolve();
    });
  });
}

/**
 * @returns {Promise<{
 *   state: "ok" | "no_tokens" | "unauth" | "error" | "net";
 *   detail: string;
 *   expiresAt?: number;
 * }>}
 */
async function checkExtensionSession() {
  const st = await getStorageTokens();
  const access0 = st.accessToken;
  const refreshToken = st.refreshToken;
  const expiresAt = st.expiresAt;

  if (typeof access0 !== "string" || !access0) {
    return { state: "no_tokens", detail: "No tokens. Use Connect in the popup first." };
  }

  const ping = (token) =>
    fetch(`${APP_BASE}/api/notifications/read-all`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

  let res;
  try {
    res = await ping(access0);
  } catch {
    return { state: "net", detail: "Network error. Is the webapp running at " + APP_BASE + "?" };
  }

  if (res.status === 401 && refreshToken) {
    let r2;
    try {
      r2 = await fetch(`${APP_BASE}/api/extension/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      return { state: "net", detail: "Network error (refresh). Is the webapp up at " + APP_BASE + "?" };
    }
    if (r2.ok) {
      const d = await r2.json();
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
    return { state: "ok", detail: "Authenticated (POST /api/notifications/read-all).", expiresAt };
  }

  const text = await res.text().catch(() => "");
  if (res.status === 401) {
    return { state: "unauth", detail: text || "Session expired. Connect again from the popup." };
  }
  return { state: "error", detail: `${res.status} ${(text || "").slice(0, 160)}` };
}
