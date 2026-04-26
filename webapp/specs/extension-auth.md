# Extension auth — agreed design (spec)

> Spec for the Chrome extension and backend. Core auth, APIs, and `/extension/connect` are implemented; the MV3 client is still a separate deliverable.

## Summary

- **Web** keeps using **Better Auth** (session cookies) unchanged.
- **Extension** uses **short-lived access JWTs** + **opaque refresh tokens** (stored server-side as **SHA-256** of the raw secret, never the raw value).
- **Bootstrap** via a **one-time handoff** (short-lived code in a redirect after the user is signed in on the site); the server also returns a **server-generated `client_id`** (install line id). Persisting that id in the extension is **optional** for later; not required for listing/revoking from the **web** app.
- **No `org_id` in tokens.** Access/refresh resolve `user_id`; every API request re-runs **membership lookup** to obtain `org_id` for RLS, so org removal / membership changes are enforced on each call.
- **Refresh rotation** with a **per-family** tombstone cap (constant **`5`**, consumed older rows pruned) and **reuse = revoke family** for **recent** replays. Global cleanup of old consumed rows can use **Vercel Cron** (optional).

---

## End-to-end flow (bullets)

1. **Sign-in (browser)**  
   User signs in to the web app with Better Auth as they do today (e.g. Google, password).

2. **Handoff (browser → extension redirect)**  
   - Extension starts **OAuth-shaped** or custom flow: opens HTTPS URL (e.g. `launchWebAuthFlow` or tab to `/extension/.../connect` with a `state` nonce, optional PKCE-style `code_challenge` if we add it).  
   - **Server** validates **Better Auth session**, issues a **one-time `code`**, and redirects to the extension’s redirect origin with that code (and any required `state`). **Do not** put the session cookie or a long-lived secret in the query string.  
   - In the same first-success response, server can return the **`client_id`** (new row / `family` anchor) to the client where appropriate for that flow.  
   - **Extension** calls **`POST` exchange** with the one-time `code` over HTTPS, receives first **access JWT** + **refresh** (opaque) + `client_id` in JSON body. Extension stores access + refresh (e.g. `chrome.storage.local`); storing `client_id` locally is deferred/optional.

3. **API calls (extension → backend)**  
   - `Authorization: Bearer <access JWT>` on each request.  
   - **Middleware / helper**: verify JWT → `user_id` then **load membership** → `org_id` (and reject if no membership) → `withRLS({ userId, orgId }, …)`.

4. **Refresh (extension → backend)**  
   - On access expiry (or 401), extension sends **refresh** (e.g. body in `POST` with raw opaque secret) over HTTPS.  
   - **Rotate**: invalidate previous refresh, issue new access + new refresh; maintain **tombstone** for consumed hash; if **re-use** of an already-consumed refresh in the retained window → **revoke that family**.  
   - **Prune** in-family: keep at most **5** consumed records per `family` (tombstone cap; constant in code).  
   - **Cron** (optional): delete very old `consumed` rows globally to catch dormant lines.

5. **Revocation / “devices” (web or API)**  
   - Listing and **revoke this line** are **server-driven** (DB rows with `user_id` + `family` / `client_id`); extension does not need a locally stored `client_id` for revoke.

---

## Token / crypto choices (locked for v1)

| Item | Choice |
|------|--------|
| **Access** | **JWT**, **~15m** TTL, **standard** signing (align with project keys / `jose`, e.g. **ES256** with existing or new env keys). **Claims: `user_id` (`sub`);** **no `org_id`.** (Optional: `jti`, `iss`, `aud`.) |
| **Refresh** | Opaque high-entropy string; **store `SHA-256` hash** only. |
| **Tombstone cap** | **5** per family (constant, e.g. `EXTENSION_REFRESH_TOMBSTONE_CAP`). |
| **Handoff one-time `code`** | Short TTL, one use; treat like refresh (hash in DB) if stored. |

---

## Product / security notes

- **Two devices** = **two** independent handoffs and two **families** (two long-lived lines); no sharing one refresh across installs unless we add an explicit, rare “transfer / single device only” product later.  
- **Client version** header (from extension builds) on API calls for support and minimum-version policy — **separate** from `client_id` (install line id in DB).  
- **Same API routes** as the web app where possible: one resolver: **session cookie** *or* **valid extension access JWT** + membership, then `withRLS`.  
- This doc is intentionally **brief**; implementation can add idempotency keys, rate limits, and exact path names in code.

---

## Implementation (in repo)

- **Schema:** `webapp/src/db/schema/extension.ts` — `extensionClient`, `extensionHandoffCode`, `extensionRefresh`, enum `extension_refresh_status`.
- **Migrations:** `webapp/drizzle/0007_*.sql` (initial), `0008_*.sql` (index on `extension_client.user_id`).
- **Tombstone cap constant:** `webapp/src/lib/extension-auth/constants.ts` — `EXTENSION_REFRESH_TOMBSTONE_CAP = 5`.
- **JWT:** `webapp/src/lib/extension-auth/mint-access-jwt.ts`, `verify-access-jwt.ts`, `issuer.ts`.
- **Grants (DB):** `webapp/src/lib/extension-auth/grants.server.ts` — handoff, exchange, refresh rotation.
- **API:** `POST /api/extension/handoff` (session), `POST /api/extension/exchange`, `POST /api/extension/refresh`.
- **Shared app API auth:** `webapp/src/lib/resolve-app-api-auth.server.ts` — `requireAppApiAuth(request.headers)` = session cookie *or* `Authorization: Bearer` (extension access JWT) + `getMembershipForRequest` (then callers use `withRLS` as before). RLS-protected JSON routes (requests, proposals, notification read) use this.
- **Chrome `launchWebAuthFlow` handoff:** `GET /extension/connect?state=...&redirect_uri=...` (see `app/extension/connect/page.tsx`). The extension passes `redirect_uri` from `chrome.identity.getRedirectURL()` (only `https://*.chromiumapp.org` is accepted). Unauthenticated users redirect to `/login?callbackUrl=...` (signup preserves `callbackUrl` too). After a session + membership, the server issues a one-time `code` and redirects the browser to `redirect_uri?code=...&state=...` for the extension to read and call `POST /api/extension/exchange`.

### Environment (extension access JWT)

| Variable | Required | Notes |
|----------|----------|--------|
| `EXTENSION_JWT_PRIVATE_KEY` | Yes | PKCS#8 PEM, **ES256** (same style as Supabase minting key, but **use a different key pair**). |
| `EXTENSION_JWT_KID` | Yes | `kid` on new tokens (e.g. `ext-2025-01`). |
| `EXTENSION_JWT_ISSUER` | No | `iss` claim; defaults to same base URL logic as Better Auth. |
| `EXTENSION_JWT_PREVIOUS_KID` | No | **With** `EXTENSION_JWT_PREVIOUS_PUBLIC_KEY`, accept old `kid` during rotation. |
| `EXTENSION_JWT_PREVIOUS_PUBLIC_KEY` | No | SPKI PEM for the previous key. |

### Production checklist

Use this when calling server-side “extension auth” **done** and a **store-ready** extension client a separate goal that builds on the same list.

**Must (before / alongside a production extension build)**

- [ ] **App origin in the client** — `host_permissions` (and any hard-coded `APP_BASE` / `fetch` base URL) use the **production** `https` origin; not only `http://localhost:3000`.
- [ ] **CORS** — `webapp` middleware (or route headers) no longer allow **any** `chrome-extension://` origin in production; set **`Access-Control-Allow-Origin`** to the **published** extension’s fixed origin, `chrome-extension://<extension-id>` (or a small allowlist for beta builds).
- [ ] **Extension refresh on 401** — every extension API call that uses a Bearer must **refresh** and retry (or a single shared `fetch` wrapper) so short-lived access tokens are renewed without user friction; `expiresAt` can be used to refresh proactively.
- [ ] **Devices / revoke (server + web)** — UI or admin path to **list** `extension_client` rows and set **`revoked_at`** (or a dedicated revoke API) so a user can cut off an install. Until this exists, “Sign out” in the extension only **clears local** tokens; the server may still have active refresh material until family revoke or natural expiry.
- [ ] **Abuse** — **rate limits** (and optional IP- or key-based caps) on `POST /api/extension/exchange` and `POST /api/extension/refresh` on public production traffic.
- [ ] **Env in prod** — `EXTENSION_JWT_PRIVATE_KEY` / `EXTENSION_JWT_KID` (and `EXTENSION_JWT_ISSUER` if the default base URL is wrong) set in the hosting env; runbook for **key rotation** using the optional `EXTENSION_JWT_PREVIOUS_*` pair; confirm extension JWT is **not** the Supabase Realtime signing key.

**Strongly recommended**

- [ ] **Operational runbook** — one place (internal doc) for env names, `iss`/`aud`, handoff TTLS, and who rotates keys.
- [ ] **`Client-Version` (or `X-Extension-Version`)** on extension `fetch` to support users and a future minimum-version policy (header is product-only; not validated in v1).
- [ ] **QA / smoke** — short matrix: new handoff, re-link after sign-out, 401 + refresh, **reuse** of an old refresh (expect family revoke + `REUSE` where applicable), no org / revoked client.

**Optional (scale / policy)**

- [ ] **Cron** — global cleanup of very old `consumed` `extension_refresh` rows for idle families; tombstone cap is already in-app per rotate.
- [ ] **`jti` denylist** (or similar) if product needs **instant** access token invalidation before ~15m expiry; see [Optional (not v1)](#optional-not-v1) below.
- [ ] **Soak / load** — run refresh rotation and `for("update")` paths under production-like DB concurrency if traffic is high.

**Definition of “client ready” (extension repo)**

- [ ] Shipped (or stably unpacked) build with a **known** `extension_id` for CORS.
- [ ] Same behaviors as the local spike: connect, exchange, **refresh**, Bearer API, local sign-out; with prod URLs and tightened CORS.

## Data model (Drizzle / Postgres)

**Naming:** tables are prefixed with `extension_` to keep them distinct from Better Auth’s `user` / `session`.  
**Key material:** access JWTs are signed/verified in **app code** using **dedicated** env-based keys (not the Supabase Realtime minting key). “Light” rotation: **verify** with up to two public keys (current + previous `kid`); **sign** only with current private key. No DB table for keys in v1 (optional later).

### 1. `extension_client`

One row per **linked extension install line** (the “family” / `client_id` returned after a successful first exchange). Revoking a client invalidates the whole line.

| Column        | Type        | Notes |
|---------------|-------------|--------|
| `id`          | `uuid` PK   | `client_id` in APIs / JSON. |
| `user_id`     | `text` FK → `user.id` | `onDelete: cascade`. |
| `created_at`  | `timestamptz` | default now. |
| `revoked_at`  | `timestamptz` null | When set, the line is dead (refresh + new access should fail). Optional display: “last seen” later. |

**Index:** `user_id` (list devices in web UI).

### 2. `extension_handoff_code`

**One-time** bootstrap codes (hashed, never raw). No `client_id` until exchange succeeds—see flow below.

| Column         | Type        | Notes |
|----------------|-------------|--------|
| `id`           | `uuid` PK   | |
| `code_hash`    | `text`      | `SHA-256` (hex or base64url) of the secret segment; **unique**. |
| `user_id`      | `text` FK → `user.id` | Who completed the handoff. |
| `expires_at`   | `timestamptz` | Short TTL (e.g. 5–10 min). |
| `used_at`      | `timestamptz` null | Set when exchanged exactly once. |
| `created_at`   | `timestamptz` | |

**Index:** `code_hash` (lookup). **Optional partial unique:** `user_id` where `used_at is null` if you only allow one active handoff per user (product choice).

**Flow:** connect URL validates Better Auth session → **insert** handoff (random code to browser/extension; store **hash** only) → extension exchanges `POST` with raw code → in one transaction: assert handoff valid + not used, **create** `extension_client`, create first **active** `extension_refresh` row, **set** `used_at`, return access + refresh + `client_id`.  
If you prefer to create `extension_client` **before** the redirect, you can add nullable `client_id` FK on handoff; the agreed default is create **client** at first successful exchange to avoid orphan clients on abandoned flows.

### 3. `extension_refresh`

**All** refresh material for a family: **exactly one** `active` row at a time per `client_id` (enforced in app, or a **partial unique** index in Postgres: one row per `client_id` where `status = 'active'`), plus up to `EXTENSION_REFRESH_TOMBSTONE_CAP` (5) **`consumed`** tombstones for reuse detection, with **prune** of older consumed in-family on each rotate or via cron.

| Column         | Type        | Notes |
|----------------|-------------|--------|
| `id`           | `uuid` PK   | |
| `client_id`    | `uuid` FK → `extension_client.id` | `onDelete: cascade`. |
| `token_hash`   | `text`      | `SHA-256` of raw refresh; **globally unique** for O(1) lookup by presented secret. |
| `status`       | enum        | `active` \| `consumed`. (If you need a third “void” state, add later; family-level revoke is `extension_client.revoked_at` + optional dropping active row.) |
| `consumed_at`  | `timestamptz` null | Set when **consumed** or when superseded. |
| `created_at`   | `timestamptz` | |

**Indexes / constraints:**

- **Unique** `token_hash` (or unique on hash + status for strictness—usually just unique hash is enough: same hash can’t be two rows).
- **Lookup:** `client_id` + `status` for “count consumed and prune to 5”.

**Prune (per `client_id` + rotation):** after creating a new `consumed` row, delete the **oldest** `consumed` rows for that `client_id` until count `≤ 5` (or global cron for dormant families).

**Reuse (family revoke):** on refresh, resolve `token_hash` → if row is **`consumed`**, that’s a replay: **set** `extension_client.revoked_at` for that `client_id` (and optionally delete remaining refresh rows for that client).

### Optional (not v1)

- `extension_jwt_denylist` / `jti` + `exp` for “kill access before 15m” — add if product needs instant access revoke without waiting for expiry.
- **DB-stored** JWT keys — if you outgrow two PEMs in env; not required for “light” rotation.

### Summary: minimum tables = **3**

1. `extension_client`  
2. `extension_handoff_code`  
3. `extension_refresh`

Everything else (JWT verify with two public keys) stays **in application config**, separate from the Supabase Realtime signing key.
