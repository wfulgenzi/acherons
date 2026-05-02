# Acherons Chrome extension (local dev spike)

MV3 build (Vite + TypeScript + React popup) that runs `chrome.identity.launchWebAuthFlow` against the webapp’s [`/extension/connect`](http://localhost:3000/extension/connect) handoff, then `POST /api/extension/exchange` and stores tokens in `chrome.storage.local`.

**Prerequisites:** [webapp](../webapp) running on `http://localhost:3000` with env and DB set up; you must be able to sign in and complete org onboarding in the handoff window.

## Node / Yarn

After `cd` into **`extension/`**, run **`nvm use`** (see [`.nvmrc`](.nvmrc)) **before** installing dependencies or running the build—same requirement as [`webapp`](../webapp).

From repo root (with workspaces): `yarn workspace @acherons/extension build` still expects a compatible Node on your PATH; prefer opening a shell with `nvm use` in `extension/` or matching `.nvmrc` globally.

## Build

1. `cd extension` → **`nvm use`**
2. Install and build: from repo root, `yarn workspace @acherons/extension build`, or from **`extension/`**, `yarn install` then a script below.  
   Each script runs **`tsc --noEmit`**, then **Vite**. Output is **`extension/dist/`** (`manifest.json`, `pages/*.html`, `background.js`, assets).

| Script | Mode | `VITE_APP_BASE` (default) | `host_permissions` in `dist/manifest.json` |
|--------|------|---------------------------|---------------------------------------------|
| **`yarn dev`** | `development` + watch | `.env.development` → `http://localhost:3000` | that origin + `/*` |
| **`yarn build:dev`** | `development` (one shot) | same | same |
| **`yarn build`** | `production` | `.env.production` | that origin + `/*` |

The repo **`manifest.json`** is a template; every Vite build writes **`dist/manifest.json`** with **`host_permissions`** set to a **single** entry from **`VITE_APP_BASE`**. Override the base with **`.env.*.local`**.

## Load the unpacked extension in Chrome

1. Open **Chrome** → `chrome://extensions/` → enable **Developer mode**.
2. **Load unpacked** → select **`extension/dist/`** (not the bare `extension/` folder unless you only keep legacy JS builds there).
3. Pin the extension if you like (puzzle icon → pin).

## Sign out (extension)

**Sign out (this extension)** in the popup or on the **connection** page clears **only** the tokens saved in this browser profile for this install (`accessToken`, `refreshToken`, `clientId`, `expiresAt` in `chrome.storage.local`).

The web app’s Better Auth session in the main browser is **unchanged**. The server may still have refresh row state until the family is revoked in the app or tokens expire. To get a “clean” server line later, add a **devices** UI that revokes `extension_client` / that install.

## Session check (popup)

- The **popup** runs session checks when opened and after connect.
- The check is `POST {APP_BASE}/api/notifications/read-all` with the stored `Authorization: Bearer` token; 401 is followed by a single `POST /api/extension/refresh` if a refresh token exists, then a retry.

## Try the flow

1. `yarn dev` in `webapp` (or your usual start command) so the app is on port **3000**.
2. Click the extension icon → **Log in** (`launchWebAuthFlow`).
3. A window opens: sign in (or use an existing session), complete handoff. You should see “Stored tokens” in the popup.

**If the window closes with no “Stored tokens”** after you log in, the flow did not end on `https://<id>.chromiumapp.org/...?code=...` (the URL Chrome is waiting for). The popup will log a **truncated final URL** and hints. Common causes: login did not return to `/extension/connect?...` (e.g. OAuth callback: use a full URL, now fixed in the login page), or you need a **full page** navigation after email sign-in (also fixed) so the handoff 302 is reliable. Try **email + password** first if Google still misbehours.

4. To use another API base, build with `VITE_APP_BASE=https://your-host` (or set in a `.env` file next to `vite.config.ts` using `VITE_*`), then reload the extension on `chrome://extensions` (↻).

## Web Push (VAPID)

After **Log in** (Bearer tokens stored), the clinic shell shows **Turn on alerts** until push is registered successfully (or **Maybe later**, which snoozes for 7 days).

Flow:

1. From the popup, **`Notification.requestPermission()`** runs on your button tap (required **user gesture**). That may show Chrome’s **Allow / Block** prompt the first time (`Notification.permission` was `default`).
2. The **`notifications`** entry in **`manifest.json`** declares that this extension may use notification APIs; it does **not** replace step (1). Users can still **block** notifications or mute Chrome at the OS level (e.g. macOS **System Settings → Notifications → Chrome**).

Then the **background service worker** loads `GET /api/extension/push-vapid`, runs `pushManager.subscribe`, then `POST /api/extension/push-subscription` with your Bearer token.

Requires **`WEB_PUSH_*` env** on the webapp and migration `web_push_subscription` + RLS applied. If `push-vapid` returns 503, configure VAPID in `webapp/.env.local`.

The background SW handles **`push`** (shows a system notification; JSON `{ title, body }` or `{ message }` if present, else plain text / defaults), **`notificationclick`** (focus an open tab on `APP_BASE`, else open `/dashboard`), and a **short synthesized bell** via the **offscreen** document.

Signing out clears the local **“push registered”** flag so the next account sees the onboarding banner again.

## Change the app URL

Set **`VITE_APP_BASE`** for the build mode (`.env.development`, `.env.production`, or `*.local`). The built **`dist/manifest.json`** **`host_permissions`** are **generated** from that URL’s origin (see **Build** table). You do not need to hand-edit host patterns for each environment.

## Production

- Run **`yarn build`** (production mode) before shipping; load **`extension/dist/`** in Chrome.
- Restrict CORS in [webapp `middleware.ts`](../webapp/src/middleware.ts) to your real `chrome-extension://<id>`.
- Production builds only include the **`host_permissions`** host that matches **`VITE_APP_BASE`** in production (not localhost).
