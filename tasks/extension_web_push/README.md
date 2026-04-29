# Extension Web Push — status & feature matrix

Track progress by updating **Status** (`todo` | `in_progress` | `done` | `blocked` | `n/a`). Add notes inline or under **Notes**.

---

## Where we are now (snapshot)

| Area | State |
|------|--------|
| **Database** | `web_push_subscription` exists; migration applied. |
| **RLS** | `extension_client` (select own rows) + `web_push_subscription` (owner policies + active client check). `withRLS({ userId })` supports user-only context (no `org_id`). |
| **Register API** | `POST /api/extension/push-subscription` — extension Bearer JWT only; upsert by `endpoint`. |
| **VAPID** | Keys in `.env.local`; public via **`GET /api/extension/push-vapid`**; send uses same env in `vapid-send-config.server.ts`. |
| **Send path** | **`emit.server`** schedules **`fanOutWebPushForOrg`** after each inbox insert via Next **`after()`** (fallback: fire-and-forget if `after` unavailable). |
| **Vercel** | Fan-out runs in **`after()`** so the request can finish before Web Push I/O. |
| **Mock extension** | Popup **Register Web Push** + SW **`push`** / **`notificationclick`** (E4). |

---

## Feature matrix (step-through)

Use this as a checklist; reorder sections if your priorities change.

### 1. Server — configuration & keys

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S1 | Generate VAPID key pair; document env vars (`WEB_PUSH_VAPID_PUBLIC_KEY`, private key, `mailto:` contact). | done | Stored in `webapp/.env.local` (not committed). |
| S2 | Add env validation where server sends pushes (optional tiny helper module). | todo | |

### 2. Server — discovery & registration

| ID | Task | Status | Notes |
|----|------|--------|-------|
| D1 | `GET` route returning **public** VAPID key + subject for clients (no secret in response). | done | `GET /api/extension/push-vapid` — unauthenticated; 503 if env missing. |
| R1 | `POST /api/extension/push-subscription` — **done** (extension Bearer, RLS, upsert). | done | |
| R2 | Optional: `DELETE` or POST body flag to **unregister** a subscription (cleanup). | todo | |

### 3. Server — send pipeline

| ID | Task | Status | Notes |
|----|------|--------|-------|
| F1 | Resolve recipients for an org notification (e.g. join `memberships` + `web_push_subscription`). | done | `fanout-org.server.ts` — `memberships.org_id` = recipient org. |
| F2 | Install `web-push` (or equivalent) on server; send with VAPID private key + stored subscription keys. | done | `web-push` + `vapid-send-config.server.ts`. |
| F3 | Hook **after** `notifications` insert (`emit.server` or caller): trigger fan-out (e.g. `after()` on Vercel). | done | `scheduleWebPushFanOut` in `emit.server.ts`. |
| F4 | Handle **410 Gone** / failures: bump `failure_count`, delete or disable stale endpoints. | done | 410/404 → delete row; else `failure_count + 1`. |
| F5 | **Bounded parallel fan-out** (batch sends with a small concurrency limit). | todo | **Later improvement** — today sends are **serial** (simple). Add when many subscriptions/org risks **`after()`** timeouts or slow wall time. |

### 4. App product — payloads & UX

| ID | Task | Status | Notes |
|----|------|--------|-------|
| P1 | Decide push **payload** shape (minimal ping vs title/body); encryption limits. | done | JSON `{ title: "Acherons", body: <label for type> }` (see `labels.ts`). |
| P2 | Align with **notifications** contract (`type`, `context`) if needed for client display. | todo | Body is type label only; add IDs/context when product needs it. |

### 5. Mock / MV3 extension

| ID | Task | Status | Notes |
|----|------|--------|-------|
| E1 | Fetch **VAPID public key** from server (`GET`). | done | `extension/background.js` → `/api/extension/push-vapid`. |
| E2 | Request **notification permission**; `PushManager.subscribe` with `applicationServerKey`. | done | Permission in popup; subscribe in background SW. |
| E3 | **POST** `subscription.toJSON()` (or `{ endpoint, keys }`) to `/api/extension/push-subscription` with **Bearer**. | done | `lib.js` `getBearerAccessToken` + POST from SW. |
| E4 | **Service worker**: handle `push` / `notificationclick` (even if mock/toast only). | done | `extension/background.js` |
| E5 | Store tokens (`chrome.storage`); refresh access JWT using existing extension auth pattern. | todo | Already elsewhere in extension spike. |

### 6. Testing & ops

| ID | Task | Status | Notes |
|----|------|--------|-------|
| T1 | `scripts/extension-auth-e2e.sh` includes fake push body — **done**. | done | |
| T2 | `scripts/curl-push-subscription.sh` — Bearer-only retest — **done**. | done | |
| T3 | Manual or scripted **end-to-end**: insert notification → receive push on device. | todo | |
| T4 | Document operational limits (fan-out size, rate limits, optional cron for tombstones). | todo | |

---

## Later improvements

| Item | Notes |
|------|--------|
| **F5 — Parallel fan-out** | Replace / augment the serial loop in `fanout-org.server.ts` with batches (e.g. `Promise.all` over chunks of size *N*, or a concurrency pool capped at ~5–10) so total time scales better when an org has dozens of devices. Still inline with **`after()`** until you hit queue-worthy volume. |
| **Queue** | If fan-out routinely exceeds function duration or needs retries/backpressure, move sends to a worker / queue (separate from F5). |

---

## Quick legend

- **todo** — not started  
- **in_progress** — active  
- **done** — shipped / verified  
- **blocked** — waiting on dependency  
- **n/a** — not applicable  

---

## Related paths (repo)

- Schema: `webapp/src/db/schema/extension.ts` (`webPushSubscription`)
- RLS migration: `webapp/drizzle/0010_extension_web_push_rls.sql`
- Register route: `webapp/src/app/api/extension/push-subscription/route.ts`
- VAPID discovery: `webapp/src/app/api/extension/push-vapid/route.ts`
- Upsert: `webapp/src/lib/web-push/upsert-subscription.server.ts`
- RLS helper: `webapp/src/db/rls.ts`
- Notify emit + web push: `webapp/src/lib/notifications/emit.server.ts`, `webapp/src/lib/web-push/fanout-org.server.ts`, `vapid-send-config.server.ts`
- E2E: `webapp/scripts/extension-auth-e2e.sh`, `webapp/scripts/curl-push-subscription.sh`
- Extension pack: `extension/` (`popup.*`, `lib.js`, `background.js`)
