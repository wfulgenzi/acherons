/**
 * MV3 service worker: Web Push subscribe + POST subscription to the webapp;
 * `push` / `notificationclick` for incoming pushes (E4).
 */
/* global APP_BASE, getBearerAccessToken */

importScripts("lib.js");

async function ensureOffscreenAudioDoc() {
  const url = chrome.runtime.getURL("offscreen.html");
  if (chrome.offscreen.hasDocument) {
    if (await chrome.offscreen.hasDocument()) {
      return;
    }
  }
  try {
    await chrome.offscreen.createDocument({
      url,
      reasons: ["AUDIO_PLAYBACK"],
      justification:
        "Brief tone when a Web Push arrives so alerts are noticeable if OS banners are off.",
    });
  } catch (e) {
    const msg = String(e && e.message ? e.message : e);
    if (!/already|single|exist/i.test(msg)) {
      throw e;
    }
  }
}

/** Plays a short beep via offscreen AudioContext (works without OS notification banners). */
async function playPushBeep() {
  try {
    if (!chrome.offscreen?.createDocument) {
      return;
    }
    await ensureOffscreenAudioDoc();
    await new Promise((r) => setTimeout(r, 80));
    chrome.runtime.sendMessage({ type: "OFFSCREEN_BEEP" }, () => {
      void chrome.runtime.lastError;
    });
  } catch (e) {
    console.warn("[Acherons ext] playPushBeep", e);
  }
}

function appOriginForNotifications() {
  return typeof APP_BASE !== "undefined" ? APP_BASE : "http://localhost:3000";
}

/**
 * If no tab is already open on the webapp origin, open `/dashboard` in the background
 * (`active: false`) so the user can switch to it later without stealing focus.
 */
async function ensureBackgroundTabForWebapp() {
  try {
    const base = appOriginForNotifications();
    const origin = base.replace(/\/$/, "");
    const tabs = await chrome.tabs.query({ url: `${origin}/*` });
    if (tabs.length > 0) {
      return;
    }
    await chrome.tabs.create({
      url: `${origin}/dashboard`,
      active: false,
    });
  } catch (e) {
    console.warn("[Acherons ext] ensureBackgroundTabForWebapp", e);
  }
}

/**
 * Parse Push payload (browser decrypts). Prefer JSON `{ title?, body? | message? }`;
 * otherwise show raw text. Uses `.text()` once — PushMessageData may not allow double reads.
 */
async function parsePushPayload(event) {
  const fallbackTitle = "Acherons";
  const fallbackBody = "You have a new notification.";
  if (!event.data) {
    return { title: fallbackTitle, body: fallbackBody };
  }
  try {
    const raw = await event.data.text();
    if (!raw || typeof raw !== "string") {
      return { title: fallbackTitle, body: fallbackBody };
    }
    try {
      const j = JSON.parse(raw);
      if (j && typeof j === "object") {
        let title = fallbackTitle;
        let body = fallbackBody;
        if (typeof j.title === "string" && j.title) title = j.title;
        if (typeof j.body === "string" && j.body) body = j.body;
        else if (typeof j.message === "string" && j.message) body = j.message;
        return { title, body };
      }
    } catch {
      /* not JSON */
    }
    return { title: fallbackTitle, body: raw.slice(0, 240) };
  } catch {
    return { title: fallbackTitle, body: fallbackBody };
  }
}

self.addEventListener("push", (event) => {
  // Open the service worker devtools (chrome://extensions → service worker → Inspect) to see this.
  console.log(
    "[Acherons ext] push: event received",
    event.data ? "(has payload bytes)" : "(no payload / check-up only)",
  );
  event.waitUntil(
    parsePushPayload(event)
      .then(({ title, body }) =>
        Promise.all([
          (async () => {
            console.log("[Acherons ext] push: showing notification", {
              title,
              bodyPreview: body.length > 80 ? body.slice(0, 80) + "…" : body,
            });
            await self.registration.showNotification(title, {
              body,
              tag: "acherons-notification",
              renotify: true,
            });
          })(),
          playPushBeep(),
          ensureBackgroundTabForWebapp(),
        ]),
      )
      .catch((err) => {
        console.error("[Acherons ext] push: showNotification or parse failed", err);
      }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const base = appOriginForNotifications();
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        const prefix = base.replace(/\/$/, "");
        for (const client of windowClients) {
          const url = typeof client.url === "string" ? client.url : "";
          if (url.startsWith(prefix) && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(`${prefix}/dashboard`);
        }
      }),
  );
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "WEB_PUSH_REGISTER") {
    void handleWebPushRegister(msg.baseUrl)
      .then(sendResponse)
      .catch((e) => {
        sendResponse({
          ok: false,
          error: e && e.message ? String(e.message) : String(e),
        });
      });
    return true;
  }
  if (msg.type === "GET_NOTIFICATION_PERMISSION") {
    sendResponse({ permission: Notification.permission });
    return false;
  }
  if (msg.type === "TEST_NOTIFICATION") {
    void self.registration
      .showNotification("Acherons (test)", {
        body: "If you see this banner, Chrome can show extension notifications.",
        tag: "acherons-test",
      })
      .then(() => sendResponse({ ok: true }))
      .catch((e) =>
        sendResponse({
          ok: false,
          error: e && e.message ? String(e.message) : String(e),
        }),
      );
    return true;
  }
  return false;
});

/**
 * @param {string} baseUrl Must match `APP_BASE` in lib.js (session checks use it).
 */
async function handleWebPushRegister(baseUrl) {
  const auth = await getBearerAccessToken();
  if (!auth.ok) {
    return { ok: false, error: auth.detail };
  }

  const vapidRes = await fetch(`${baseUrl}/api/extension/push-vapid`);
  if (!vapidRes.ok) {
    const t = await vapidRes.text();
    return {
      ok: false,
      error: `push-vapid ${vapidRes.status}: ${t.slice(0, 240)}`,
    };
  }
  const vapid = await vapidRes.json();
  const applicationServerKey = urlBase64ToUint8Array(vapid.publicKey);

  const reg = self.registration;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });

  const j = sub.toJSON();
  const body = JSON.stringify({
    endpoint: j.endpoint,
    keys: j.keys,
  });

  const post = await fetch(`${baseUrl}/api/extension/push-subscription`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body,
  });
  const text = await post.text();
  if (!post.ok) {
    return {
      ok: false,
      error: `push-subscription ${post.status}: ${text.slice(0, 320)}`,
    };
  }
  const data = JSON.parse(text);
  return { ok: true, id: data.id };
}

/** web-push / PushManager URL-safe base64 → Uint8Array */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
