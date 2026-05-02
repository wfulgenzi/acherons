# Extension — clinic product shell & parity with webapp

Track progress by updating **Status** (`todo` | `in_progress` | `done` | `blocked` | `n/a`). Add notes inline or under **Notes**.

**Related:** [`tasks/requirements.md`](./requirements.md) (shared API typing rules), [`extension-web-push.md`](./extension-web-push.md) (push registration pipeline — keep compatible). **Popup HTTP caching:** § [Popup API caching (stale-while-revalidate)](#popup-api-caching-stale-while-revalidate) below.

---

## Goals

- **Preserve** existing extension behaviours: OAuth-style link / token storage, session refresh, **Web Push** registration + POST to API, **notification → sound** (and related background/offscreen handling).
- **Redesign** the popup so it feels like an **“extension edition”** of the clinic webapp: same **brand / Tailwind theme** (`@acherons/ui/theme.css` + shared primitives where worthwhile).
- **Scope:** **Clinic org users only** for in-extension workflows. **Dispatcher** (and **admin**) users get a **lightweight gate** — not full dispatcher UX in MV3.
- **Org-less users:** mirror the **intent** of webapp [`onboarding`](../webapp/src/app/onboarding/page.tsx) (no workspace yet).
- **Feature areas** inside the clinic experience: **Dashboard**, **New requests**, **My proposals**, **Bookings** — UX can differ from Next (top icon nav, stacked sections, or deep links); **prefer linking out** when an area is too dense for the popup.

---

## Current behaviours to preserve (inventory)

Update this table if implementation moves.

| Behaviour | Where today (indicative) | Status |
|-----------|--------------------------|--------|
| Connect / auth handoff + token storage | `extension/src/popup/PopupApp.tsx`, `extension/src/shared/session.ts`, background | todo — retain while redesigning |
| Session check / refresh (`read-all`, `/api/extension/refresh`) | `session.ts`, background | todo |
| Web Push: VAPID fetch, permission, `PushManager.subscribe`, POST subscription | background + popup triggers | todo — see extension-web-push |
| Notification click / push → audio (offscreen) | `extension/src/background/index.ts`, offscreen | todo |
| Full-page “connection” tab | **Removed** — redundant with popup + **Developer tools → Ping API session** | done |

---

## Information architecture & gates

### 1. Logged-out home

| ID | Task | Status | Notes |
|----|------|--------|-------|
| IA1 | Single primary CTA aligned with webapp login (`/login`): **“Log in”**, launching the OAuth / handoff flow. | done | **`LoginWithAcheronsButton`** — default label **Log in**; busy **Logging in…**. |
| IA2 | Minimal chrome: logo/wordmark optional; no duplicate login forms in-extension. | done | Themed header copy only; full chrome deferred. |

### 2. Post-login: org & role resolution

The webapp uses **Better Auth session** + **`getMembership`** (see [`webapp/src/server/dashboard/load-dashboard-page.ts`](../webapp/src/server/dashboard/load-dashboard-page.ts): no membership → redirect `/onboarding`; `orgType === "clinic"` vs dispatch).

The extension only has **Bearer tokens** today. To reproduce gates **without** scraping HTML:

| ID | Task | Status | Notes |
|----|------|--------|-------|
| API1 | **Define or reuse** a small JSON API callable with extension Bearer: returns `{ membership: null \| { orgId, orgName, orgType, role } }`. (`role` is org-level; not global platform admin.) | done | **`GET /api/extension/me`** — `ExtensionMeResponse`; client **`src/shared/extension-me.ts`** + **`useExtensionGate`**. |
| API2 | Cache membership (and version/hash) in `chrome.storage.local` with sane TTL or invalidate on 401 / explicit logout. | done | **`EXTENSION_ME_CACHE_KEY`**, **5 min TTL**, keyed by **`clientId`**; **`clearExtensionMeCache`** on 401 + **`clearExtensionSessionInStorage`**; **`refresh(true)`** bypasses cache (dev tools). See `extension/src/shared/extension-me-cache.ts`. |
| IA3 | **Dispatcher (orgType `dispatch`)**: minimal gate — **Open in browser** to `/dashboard` only (edge case; no dispatcher copy beyond brand + CTA). | done | **`openAppTab('/dashboard')`**. |
| IA4 | **Global platform admin** (`user.is_admin`): **out of scope** for the extension; no special case in the API. (Webapp still redirects those users to `/admin` in the browser.) | n/a | |
| IA5 | **No organisation** (`membership === null`): UI copy aligned with onboarding — e.g. welcome + “no workspace” + CTA **Open web app** to `/onboarding` or home. Reuse phrasing from [`webapp/src/app/onboarding/page.tsx`](../webapp/src/app/onboarding/page.tsx). | done | **`openAppTab('/onboarding')`**; extension-only hint not ported yet. |

### 3. Clinic shell (main experience)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| IA6 | **Navigation** between Dashboard / New requests / My proposals / Bookings: acceptable patterns — bottom icon row, segmented control, dropdown, or list — **no requirement** for 1:1 page parity with Next. | done | **`ClinicTopNav`** — full-width **top** strip (large icons + short labels); **`ClinicShell`** content + **Open in browser** for non-dashboard tabs. |
| IA7 | **Global actions:** sign out (clear extension storage), optional “open in browser” deep link, notification permission / push status compact indicator. | in_progress | Sign out + open app in **`ClinicShell`**; push/notif in **Developer tools** collapsible. |
| IA8 | **Deep links:** for complex interactions (e.g. rich request detail, maps), link to webapp with **org-scoped URL** where possible. | todo | |

---

## Feature parity (clinic)

Work can parallelize once **API1** exists. Prefer **existing app JSON routes** where they already enforce clinic RLS; otherwise add thin extension-scoped routes.

| Area | Webapp reference (indicative) | Extension direction | Status |
|------|-------------------------------|---------------------|--------|
| **Dashboard** | [`(app)/dashboard`](../webapp/src/app/(app)/dashboard/page.tsx), `load-dashboard-page` | Summary cards / stats; link “see full dashboard” if truncated | todo |
| **New requests** | [`(app)/requests`](../webapp/src/app/(app)/requests/page.tsx) clinic view | **See list of requests** (full clinic flows for v1). | todo |
| **My proposals** | [`(app)/proposals`](../webapp/src/app/(app)/proposals/page.tsx) | **Create proposal** with **same form options / behaviour as webapp** (may later lift shared pieces into `packages/ui`). | todo |
| **Bookings** | [`(app)/bookings`](../webapp/src/app/(app)/bookings/page.tsx) | **View bookings** in-extension (density TBD). | todo |

| ID | Task | Status | Notes |
|----|------|--------|-------|
| F1 | Spike: list **which API handlers** the clinic webapp already calls for each area (server loaders → fetch patterns). Document in this file or `extension/README.md`. | done | See **§ F1 — Clinic data sources** below. |
| F2 | Dashboard: minimal viable widgets + loading/error states (reuse theme tokens). | in_progress | **MVP:** API + `ClinicDashboardPanel` (stats, today slice, open requests slice, link out). |
| F3 | New requests: list + in-scope actions per contracts / RLS (goal: parity with clinic webapp for listing). | in_progress | **`GET /api/extension/clinic/requests`** + **`ClinicRequestsPanel`**; propose/edit still via browser. |
| F4 | Proposals: create flow — form parity with webapp; optional shared UI in `@acherons/ui` later. | in_progress | **List:** **`GET /api/extension/clinic/proposals`** (pending only) + **`ClinicProposalsPanel`** → link **`/requests/:id`**. Create still in webapp. |
| F5 | Bookings: view — parity with webapp viewing expectations. | in_progress | **`GET /api/extension/clinic/bookings`** + **`ClinicBookingsPanel`** (upcoming / past, link **`/requests/:id`**). |
| F6 | Empty states + errors for each section (match webapp tone). | todo | |

---

## F1 — Clinic data sources (spike)

Clinic **pages** are React Server Components: they call **`load*PageData`** loaders, not `fetch` to JSON routes. Existing **`/api/*`** routes that use **`requireAppApiAuth`** already accept **extension Bearer** tokens (see [`webapp/src/lib/resolve-app-api-auth.server.ts`](../webapp/src/lib/resolve-app-api-auth.server.ts)). New extension-specific **`GET`** routes can reuse the **same RLS query helpers** as the loaders and return JSON typed in **`@acherons/contracts`**.

| Area | Webapp entry | Data functions (server-only) | Existing JSON API today |
|------|----------------|------------------------------|-------------------------|
| **Dashboard** | [`load-dashboard-page.ts`](../webapp/src/server/dashboard/load-dashboard-page.ts) → [`loadClinicDashboardBundle`](../webapp/src/server/dashboard/dashboard-rls-queries.ts) | Stats + slices for new requests, bookings, schedule, activity | **`GET /api/extension/clinic/dashboard`** — extension Bearer; see [`ExtensionClinicDashboardResponse`](../packages/contracts/src/extension-clinic-dashboard.ts) + [`ClinicDashboardPanel`](../extension/src/popup/components/ClinicDashboardPanel.tsx). |
| **Requests** | [`load-requests-page.ts`](../webapp/src/server/requests/load-requests-page.ts) → [`listClinicAccessibleRequests`](../webapp/src/server/requests/requests-rls-queries.ts) | Maps to `ClinicRequestItem[]` via `mapClinicRowsToItems` | **`POST /api/requests`** is **dispatcher-only** (create). No **GET list** for clinics yet — add **`GET`** reusing list + map. |
| **Proposals** | [`load-proposals-page.ts`](../webapp/src/server/proposals/load-proposals-page.ts) → [`listProposalsForClinic`](../webapp/src/server/proposals/proposals-rls-queries.ts) | `mapClinicRowsToProposalRows` | **`POST /api/proposals`** — already **clinic + `requireAppApiAuth`** (extension Bearer works). **GET** list for extension UI may need a new **`GET /api/proposals`** (or scoped route) if the webapp only uses SSR for the list. |
| **Bookings** | [`load-bookings-page.ts`](../webapp/src/server/bookings/load-bookings-page.ts) → [`listBookingsForClinic`](../webapp/src/server/bookings/bookings-rls-queries.ts) | `mapClinicRowsToItems` | No dedicated clinic list route observed — likely **new GET** mirroring loader output. |

**Client `fetch` in app (for forms/actions):** [`NewRequestFlow`](../webapp/src/app/(app)/requests/new/NewRequestFlow.tsx) → `POST /api/requests` (dispatcher); [`ProposalsList`](../webapp/src/app/(app)/requests/[id]/ProposalsList.tsx) → `PATCH`/`/api/proposals/:id`; edit flows → `/api/requests/:id`. Extension **create proposal** should match those contracts and auth rules.

---

## Styling & shared UI (`packages/ui`)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| ST1 | Keep extension on **`@acherons/ui/theme.css`**; avoid hard-coded hex where semantic tokens exist (`brand-*`, `gray-*`). | todo | Theme already carries Tailwind colour remaps from webapp. |
| ST2 | Extract **Button**, **Card**, typography primitives to `@acherons/ui` **if** webapp components are easy to share (no Next-only APIs). Otherwise duplicate minimal class bundles in `packages/ui` first. | todo | |
| ST3 | Popup layout: **fixed 320×500px** (`popup.css` — `html`/`body`/`#root`); scroll inside `#root`; focus rings — match webapp baseline where feasible. | done | |

---

## Popup API caching (stale-while-revalidate)

**Goal:** Avoid hitting **`GET /api/extension/clinic/*`** on **every tab switch** or **every popup open**. Show **last good data** immediately, refresh in the background when **stale** (or on explicit refresh).

**Existing:** **`GET /api/extension/me`** already uses a **TTL cache** in `chrome.storage.local` (`extension/src/shared/auth/cacheUserInfo.ts`, **API2**).

| ID | Task | Status | Notes |
|----|------|--------|-------|
| CACHE1 | **Clinic tab data:** apply **SWR-style** behaviour for dashboard, requests, proposals, bookings — shared keys (e.g. by route + `clientId` / token generation), **`staleTime`** so switching **`ClinicTopNav`** tabs does not refetch while fresh. | done | TanStack Query + **`clinic-stale-times.ts`** + session-scoped keys (**`clinic-session-key.ts`**). |
| CACHE2 | **Invalidation:** clear or bump cache on **sign out**, **401** from any clinic route, and (later) after **mutations** from the extension. | done | **`queryClient.clear()`** on sign out / devtools clear tokens; **401** → **`ClinicUnauthorizedError`** + **`ExtensionQueryProvider`** clears storage + cache. Mutations: still todo when extension writes clinic data. |
| CACHE3 | **Optional persistence:** mirror hottest payloads in **`chrome.storage.local`** with TTL for **instant** popup reopen — only if in-memory **TanStack Query** (or equivalent) cache is not enough. | done | **`PersistQueryClientProvider`** + **`createAsyncStoragePersister`** over **`chrome.storage.local`** (**`query-persist-chrome.ts`**); **`maxAge` 24h**; dehydrate **`queryKey[0] === 'clinic'`** only; **`buster`** = **`clientId:expiresAt`** / **`anon`**; cleared on sign out + **401**. |

### Web Push → clinic UI freshness (invalidate TanStack Query)

When a push arrives, the **service worker** cannot touch the popup’s React Query cache directly; use a cross-context signal so dashboard **“New”** / clinic lists refetch. See [`extension-web-push.md`](./extension-web-push.md).

| ID | Task | Status | Notes |
|----|------|--------|-------|
| PUSH1 | **Storage bump (durable):** After handling an incoming push (post-notification / coalesced with existing handler), write **`clinicDataBump`** (monotonic counter or timestamp) to **`chrome.storage.local`**. Popup mounts **`chrome.storage.onChanged`** (e.g. on **`ExtensionQueryProvider`** or **`ClinicShell`**) and calls **`queryClient.invalidateQueries`** for **`['clinic']`** or a narrower **`['clinic','dashboard', …]`** key so data is stale-at-worst by next popup open. | todo | Works when popup was closed at push time. |
| PUSH2 | **Runtime message (live):** Same push path optionally **`chrome.runtime.sendMessage`** to extension views with a typed payload so an **open** popup invalidates **immediately** without waiting on storage round-trip; dedupe / align with **PUSH1** bump to avoid double-thrash. | todo | Add message type in **`extension/src/shared/messages.ts`**. |

### TTL hints (starting points — tune in implementation)

| Endpoint | Suggested `staleTime` | Notes |
|----------|------------------------|--------|
| **`/api/extension/me`** | Already ~5 min (storage) | Keep; gate UX. |
| **`/api/extension/clinic/dashboard`** | ~1–3 min | Heavier payload; inbox slice can use shorter effective freshness if needed. |
| **`/api/extension/clinic/requests`**, **proposals**, **bookings** | ~30s–2 min | Lists; not on every tab flip if still fresh. |

**Popup specifics:** disable or tune **`refetchOnWindowFocus`** — the extension **popup is not** a normal browser tab; prefer **TTL + manual refresh** (or devtools) over refetch-on-open every time.

### Library choice: **TanStack Query** vs **custom `fetch` helper**

| Approach | Pros | Cons |
|----------|------|------|
| **[TanStack Query](https://tanstack.com/query)** (`@tanstack/react-query`) | **`staleTime` / `gcTime`**, request **deduping**, shared cache across components, **background refetch**, **`invalidateQueries`**, loading/error states — matches SWR without reinventing it. | Extra dependency + small bundle cost (acceptable for a React popup with several list endpoints). |
| **Native `fetch` + unified helper** (e.g. `cachedFetch({ key, ttl, fetcher })` + `Map` or storage) | **No new deps**, full control, tiny surface. | You reimplement **TTL, dedupe, in-flight coalescing**, and **cache invalidation**; easier to get wrong when tabs multiply. |

**Recommendation:** Use **`@tanstack/react-query`** with a **`QueryClientProvider`** at the popup root (e.g. wrap **`PopupApp`** or **`ClinicShell`** parent). Keep **`fetchExtension*`** + **`@acherons/contracts`** parsing inside **`queryFn`** so typing stays centralized. If bundle size becomes a hard constraint, fall back to a **thin custom cache** (single module, same TTL rules as above).

---

## Engineering chunks (implementation order suggestion)

| Phase | Scope | Status |
|-------|--------|--------|
| **P0** | Membership/session API + client wrapper; gate UI (logged out / onboarding / dispatcher / clinic). | in_progress |
| **P1** | Clinic shell + navigation skeleton + themed empty states. | todo |
| **P2** | Dashboard data + UI. | todo |
| **P3** | Requests list + actions (as scoped). | todo |
| **P4** | Proposals + Bookings (as scoped). | todo |
| **P5** | Push + sound regression pass; update [`extension-web-push.md`](./extension-web-push.md) matrix if flows move. | todo |
| **P6** | Popup **SWR / TanStack Query** for clinic **`GET`** routes (**CACHE1–3**). | done | **CACHE1–3** shipped (persisted clinic cache per **CACHE3**). |

---

## Design & product decisions (locked)

1. **Branding:** Match webapp — product name **Acherons HS** (see [`webapp` login](../webapp/src/app/(auth)/login/page.tsx) nav + [`layout` metadata](../webapp/src/app/layout.tsx)). Extension manifest, popup title, primary strings aligned.
2. **Dispatcher gate:** Edge case — **no explanatory copy**; title **Acherons HS** + **Open in browser** → `/dashboard` + sign out.
3. **Popup chrome:** **320×500px** fixed; content scrolls inside the panel.
4. **Deep links:** **Same paths as webapp** (`/dashboard`, `/requests`, …); no analytics query params until analytics exists.
5. **`status.html`:** **Removed.** Connection diagnostics = popup **Developer tools** (**Ping API session**, debug log, Web Push).
6. **Clinic v1 scope:** **Requests** (list), **proposals** (create with webapp-equivalent form), **bookings** (view). Shared `@acherons/ui` extraction optional / later.

---

## Quick legend

- **todo** — not started  
- **in_progress** — active  
- **done** — shipped / verified  
- **blocked** — waiting on dependency  
- **n/a** — not applicable  

---

## Repo pointers

| Topic | Path |
|-------|------|
| Shared API typing rules | [`tasks/requirements.md`](./requirements.md) |
| Extension popup entry | `extension/pages/popup.html`, `extension/src/popup/` |
| Extension theme shell | `extension/src/styles/extension.css` |
| Shared Tailwind theme | `packages/ui/src/theme.css` |
| Webapp onboarding copy | `webapp/src/app/onboarding/page.tsx` |
| Clinic vs dispatcher routing logic | `webapp/src/server/dashboard/load-dashboard-page.ts`, `webapp/src/app/(app)/layout.tsx` |
| Extension auth spec (historical) | `webapp/specs/extension-auth.md` |
