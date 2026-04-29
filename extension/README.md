# Acherons Chrome extension (local dev spike)

MV3 placeholder that runs `chrome.identity.launchWebAuthFlow` against the webapp’s [`/extension/connect`](http://localhost:3000/extension/connect) handoff, then `POST /api/extension/exchange` and stores tokens in `chrome.storage.local`.

**Prerequisites:** [webapp](../webapp) running on `http://localhost:3000` with env and DB set up; you must be able to sign in and complete org onboarding in the handoff window.

## Load the unpacked extension in Chrome

1. Open **Chrome** → go to `chrome://extensions/`.
2. Turn **Developer mode** on (top right).
3. Click **Load unpacked**.
4. Select this folder: `acherons/extension` (the directory that contains `manifest.json`).
5. Pin the extension if you like (puzzle icon → pin).

## Sign out (extension)

**Sign out (this extension)** in the popup or on the **connection** page clears **only** the tokens saved in this browser profile for this install (`accessToken`, `refreshToken`, `clientId`, `expiresAt` in `chrome.storage.local`).

The web app’s Better Auth session in the main browser is **unchanged**. The server may still have refresh row state until the family is revoked in the app or tokens expire. To get a “clean” server line later, add a **devices** UI that revokes `extension_client` / that install.

## Status page and popup

- The **popup** (toolbar icon) shows a small **status pill** and runs the same check when opened (and after a successful **Connect**).
- **Open connection page** opens a full `status.html` tab with a **Connected** (green) / other badges, details, and **Refresh**. No need to read logs from the handoff window.
- The check is `POST {APP_BASE}/api/notifications/read-all` with the stored `Authorization: Bearer` token; 401 is followed by a single `POST /api/extension/refresh` if a refresh token exists, then a retry.

## Try the flow

1. `yarn dev` in `webapp` (or your usual start command) so the app is on port **3000**.
2. Click the extension icon → **Connect (launchWebAuthFlow)**.
3. A window opens: sign in (or use an existing session), complete handoff. You should see “Stored tokens” in the popup.

**If the window closes with no “Stored tokens”** after you log in, the flow did not end on `https://<id>.chromiumapp.org/...?code=...` (the URL Chrome is waiting for). The popup will log a **truncated final URL** and hints. Common causes: login did not return to `/extension/connect?...` (e.g. OAuth callback: use a full URL, now fixed in the login page), or you need a **full page** navigation after email sign-in (also fixed) so the handoff 302 is reliable. Try **email + password** first if Google still misbehours.

4. To use another API base, change `APP_BASE` in `lib.js` and reload the extension on `chrome://extensions` (↻).

## Web Push (VAPID)

After **Connect** (Bearer tokens stored), use **Register Web Push** in the popup:

1. Grants **notification** permission (browser prompt).
2. The **background service worker** (`background.js`) loads `GET /api/extension/push-vapid`, runs `pushManager.subscribe` with the public key, then `POST /api/extension/push-subscription` with your extension access token.

Requires **`WEB_PUSH_*` env** on the webapp and migration `web_push_subscription` + RLS applied. If `push-vapid` returns 503, configure VAPID in `webapp/.env.local`.

The background SW handles **`push`** (shows a system notification; JSON `{ title, body }` or `{ message }` if present, else plain text / defaults) and **`notificationclick`** (focus an open tab on `APP_BASE`, else open `/dashboard`).

## Change the app URL

Edit `APP_BASE` at the top of `lib.js`. For HTTPS local, add the host to `host_permissions` in `manifest.json`.

## Production

- Restrict CORS in [webapp `middleware.ts`](../webapp/src/middleware.ts) to your real `chrome-extension://<id>`.
- Replace this spike with a proper build (bundler, versioned `host_permissions`).
