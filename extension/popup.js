/**
 * Local dev: `chrome.identity.launchWebAuthFlow` → `/extension/connect` →
 * exchange → `chrome.storage.local`. Uses `lib.js` (APP_BASE, checkExtensionSession).
 */
/* global APP_BASE, checkExtensionSession, clearExtensionSessionInStorage */

function log(msg, cls) {
  const el = document.getElementById("log");
  const line = document.createElement("div");
  if (cls) {
    line.className = cls;
  }
  line.textContent = msg;
  el.appendChild(line);
}

function clearLog() {
  document.getElementById("log").textContent = "";
}

function randomState() {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

const base = typeof APP_BASE !== "undefined" ? APP_BASE : "http://localhost:3000";
document.getElementById("base-label").textContent = base;

const pill = document.getElementById("status-pill");
const statusHint = document.getElementById("status-hint");
const notifPermissionEl = document.getElementById("notif-permission");

function refreshNotifPermissionLine() {
  if (!notifPermissionEl) {
    return;
  }
  chrome.runtime.sendMessage({ type: "GET_NOTIFICATION_PERMISSION" }, (r) => {
    const err = chrome.runtime.lastError;
    if (err || !r || typeof r.permission !== "string") {
      notifPermissionEl.textContent = "";
      return;
    }
    notifPermissionEl.textContent =
      "Chrome notification permission: " +
      r.permission +
      ". If banners still never appear, enable Google Chrome in macOS System Settings → Notifications.";
  });
}

async function refreshPill() {
  pill.className = "status-pill status-na";
  pill.textContent = "…";
  statusHint.textContent = "";
  try {
    const r = await checkExtensionSession();
    if (r.state === "ok") {
      pill.className = "status-pill status-ok";
      pill.textContent = "API OK";
      statusHint.textContent = "Bearer request succeeded.";
    } else if (r.state === "no_tokens") {
      pill.className = "status-pill status-na";
      pill.textContent = "Not linked";
    } else if (r.state === "unauth") {
      pill.className = "status-pill status-mid";
      pill.textContent = "Re-link";
    } else if (r.state === "net") {
      pill.className = "status-pill status-mid";
      pill.textContent = "Offline?";
    } else {
      pill.className = "status-pill status-bad";
      pill.textContent = "Error";
    }
    if (r.state !== "ok") {
      statusHint.textContent = r.detail.slice(0, 200);
    }
  } catch (e) {
    pill.className = "status-pill status-bad";
    pill.textContent = "Error";
    statusHint.textContent = (e && e.message) || String(e);
  }
}

document.getElementById("open-status").addEventListener("click", () => {
  const url = chrome.runtime.getURL("status.html");
  chrome.tabs.create({ url });
});

document.getElementById("sign-out").addEventListener("click", () => {
  void clearExtensionSessionInStorage().then(() => {
    clearLog();
    log("Cleared local tokens. Re-connect to sign in again.", "ok");
    return refreshPill();
  });
});

document.getElementById("connect").addEventListener("click", () => {
  clearLog();
  const redirectUri = chrome.identity.getRedirectURL();
  const state = randomState();
  const url = `${base}/extension/connect?${new URLSearchParams({ state, redirect_uri: redirectUri })}`;
  log("Opening handoff…");

  chrome.identity.launchWebAuthFlow(
    { url, interactive: true },
    (responseUrl) => {
      const err = chrome.runtime.lastError;
      if (err) {
        log(String(err.message), "err");
        return;
      }
      if (!responseUrl) {
        log("No final URL (cancelled, or the window closed before a redirect to *.chromiumapp.org with ?code=).", "err");
        return;
      }
      let out;
      try {
        out = new URL(responseUrl);
      } catch {
        log("Invalid final URL: " + responseUrl.slice(0, 200), "err");
        return;
      }
      const code = out.searchParams.get("code");
      const back = out.searchParams.get("state");
      if (back !== state) {
        log("state mismatch (check login redirect preserved callback).", "err");
        return;
      }
      if (!code) {
        log("No `code` in the final URL (expected …chromiumapp.org/…?code=…). Got host " + out.hostname, "err");
        log("URL (truncated): " + responseUrl.slice(0, 200), "err");
        return;
      }
      log("Got code, exchanging…");

      fetch(`${base}/api/extension/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
        .then(async (r) => {
          const text = await r.text();
          if (!r.ok) {
            log(`Exchange ${r.status}: ${text}`, "err");
            return;
          }
          const data = JSON.parse(text);
          return chrome.storage.local
            .set({
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              clientId: data.clientId,
              expiresAt: data.expiresAt,
            })
            .then(() => data);
        })
        .then((data) => {
          if (!data) {
            return;
          }
          log("Stored tokens. clientId: " + data.clientId, "ok");
          void refreshPill();
        })
        .catch((e) => {
          log(String(e), "err");
        });
    },
  );
});

document.getElementById("test-notification").addEventListener("click", () => {
  clearLog();
  chrome.runtime.sendMessage({ type: "TEST_NOTIFICATION" }, (r) => {
    const err = chrome.runtime.lastError;
    if (err) {
      log(String(err.message), "err");
      return;
    }
    if (r && r.ok) {
      log(
        "Test notification sent. Check the corner of the screen or Notification Center.",
        "ok",
      );
    } else {
      log(r && r.error ? r.error : "Unknown error", "err");
    }
    refreshNotifPermissionLine();
  });
});

document.getElementById("open-notify-settings").addEventListener("click", () => {
  chrome.tabs.create({ url: "chrome://settings/content/notifications" });
});

document.getElementById("push-register").addEventListener("click", async () => {
  clearLog();
  let perm;
  try {
    perm = await Notification.requestPermission();
  } catch (e) {
    log(String(e && e.message ? e.message : e), "err");
    return;
  }
  if (perm !== "granted") {
    log("Notification permission not granted (" + perm + ").", "err");
    return;
  }
  log("Registering Web Push (background)…");
  chrome.runtime.sendMessage({ type: "WEB_PUSH_REGISTER", baseUrl: base }, (response) => {
    const err = chrome.runtime.lastError;
    if (err) {
      log(String(err.message), "err");
      return;
    }
    if (response && response.ok) {
      log("Web Push registered. Server id: " + response.id, "ok");
    } else {
      log(response && response.error ? response.error : "Unknown error", "err");
    }
    void refreshPill();
    refreshNotifPermissionLine();
  });
});

void refreshPill();
refreshNotifPermissionLine();
