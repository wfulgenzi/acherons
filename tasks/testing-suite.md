# Testing strategy — Acherons webapp

This document records **recommendations**, **decisions**, and a **task breakdown** for growing automated testing. Update **Status** as you go (`todo` | `in_progress` | `done` | `blocked` | `n/a`).

---

## Context

- **App:** Next.js 16 (App Router), React 19, Drizzle + Postgres, Supabase (auth / realtime in places), server modules colocated with product.
- **Today:** No Vitest/Jest/Playwright in `webapp/package.json` yet; no `*.test.*` files. Greenfield for test tooling.

---

## Code organization (decisions)

| Topic | Decision |
|--------|----------|
| **Domain server logic** | Use **`src/server/<domain-name>/`** for server-only, domain-specific modules (loaders, orchestration, invariants). Keeps this separate from cross-cutting **`src/lib/**` utilities and from route files. |
| **`src/lib/**`** | Keep for **reusable, cross-cutting** pieces (e.g. extension-auth, shared helpers). Some `lib` code may still have **client** concerns (e.g. Supabase realtime) — that is **not** the same as a pure **server domain** folder; naming reflects that. |
| **API routes** | Prefer **thin** `route.ts` files: parse request → call **`src/server/...` or `src/lib/...`** → return `Response`. |
| **App Router pages** | Prefer **thin** `page.tsx`: call **server loaders** in `src/server/<domain>/`, handle `redirect` at the edge, render views. **Do not** aim to unit-test every RSC page as a whole. |
| **Client vs server for tests** | Use **`"use client"`** where you need interactivity, hooks, or **high-value** RTL tests; do not convert the whole app to client just for testing. **E2E** covers the “server passed the right props” handoff for critical paths. |
| **Props / handoff** | Optional later: **shared schemas** (e.g. valibot) for serializable props at the RSC → client boundary to make contracts explicit. |

These align with the example pattern: e.g. bookings list logic → `src/server/bookings/...` (or similar domain name), `page.tsx` only orchestrates and renders.

---

## Testing layers (recommendations)

### 1) Unit / focused tests (Vitest)

- **Target:** Pure functions, validation, **`src/server/<domain>`** loaders (with **mocks** for `getSession`, DB, etc. where needed), thin API glue.
- **API routes:** Test the **extracted module** first; optionally one test per route that builds a `Request` and asserts status/body.
- **Tooling:** **Vitest** + TypeScript. **Node** environment for server code; **`jsdom`** (or `happy-dom`) for React.

### 2) Database integration tests

- **Target:** Repositories and RLS-sensitive paths that must run **real SQL**.
- **Setup:** **Postgres in Docker** (compose or Testcontainers), `DATABASE_URL` for test, run **Drizzle migrations**, then **seed** (SQL or Drizzle scripts).
- **Isolation:** Truncate (FK order) or **per-test transaction** (single connection) or **namespace IDs** per worker. Pick one approach and document it in the task that implements the harness.

### 2b) Row Level Security (`withRLS`) — how it fits

Production tenant queries go through **`db`** (non–bypass user) + **`withRLS({ userId, orgId? }, fn)`**, which sets **`app.user_id`** / **`app.org_id`** in the transaction (`src/db/rls.ts`). Policies in Postgres use those session variables.

| Test style | Does it validate RLS? |
|------------|------------------------|
| **Unit tests** that **mock** repos / `withRLS` | **No** — only proves orchestration. |
| **Integration tests** using **`adminDb`** / `DATABASE_ADMIN_URL` | **No** — admin connection **bypasses RLS** (see `src/db/index.ts`). Still useful for **migrations, seeds, or assertions that need to see all rows** (e.g. “did we insert the fixture?”). |
| **Integration tests** using **`db`** + **`withRLS(ctx, tx => repo…)`** | **Yes** — same enforcement path as the app **if** the DB user is **not** `BYPASSRLS`. |

So: add a **dedicated RLS suite** (can live beside other integration tests) that:

1. Uses **`DATABASE_URL`** (app role), **not** `DATABASE_ADMIN_URL`, for code under test.
2. Calls **real** `withRLS` + **real** repo functions (no mocks for the query path you care about).
3. **Seeds two identities** (users / orgs / memberships as needed): as **User A** + org context, assert rows **visible**; as **User B**, assert **cross-tenant rows are invisible** (empty result, `length === 0`, or count).
4. Optionally adds **negative** cases: wrong `orgId` for the same `userId` if policies tie visibility to `app.org_id`.

**Bootstrap-only flows** (`withUserContext`, membership reads before `orgId` is known) should get **their own** small RLS tests if policies differ.

You generally **do not** need to parse PostgreSQL policy SQL in tests; **behavior** (visible vs hidden) is enough. If a bug slips past, add one regression test with the exact fixture that broke.

### 3) React component tests

- **Target:** **Client** components and hooks via **`@testing-library/react`** + **`render()`** — props/fixtures match what the server would pass.
- **Limit:** Don’t force RTL on large RSC-only trees; test **leaf** UI and **server loaders** separately.

### 4) Next.js “SSR” / RSC

- **Recommendation:** Do **not** rely on unit-testing full async Server Components. Test **`src/server/<domain>`** outputs and use **E2E** for full-page behavior.

### 5) End-to-end (Playwright)

- **Tool:** **Playwright** (aligned with common Next.js practice).
- **Goal:** Real flows with **minimal mocking** — real app URL + **real Postgres** for app data where possible.
- **Supabase:** Full fidelity often means a **dedicated e2e/staging** Supabase project or branch; **auth** may require seeded users or env-only bypass — **decision required** (see Open decisions).
- **Isolation:** Fixture accounts (`dispatcher@…`, `clinic@…`), optional **worker-scoped** org/data prefixes, cleanup after suite or per-run deletion by prefix.
- **Multi-user flows:** Multiple **browser contexts** / **storageState** per role, or sequential scenarios in one worker.

---

## Broken-down tasks

Use this as an implementation checklist; reorder subtasks if dependencies demand it.

### Phase A — Tooling bootstrap

| ID | Task | Status | Notes |
|----|------|--------|--------|
| A1 | Add **Vitest** (+ coverage driver if desired), `vitest.config.ts`, scripts `test` / `test:watch` in `webapp/package.json`. | todo | Use `@/` alias consistent with Next/tsconfig paths. |
| A2 | Split **environments**: `vitest.config` → **`environment: 'node'`** default; optional **`environmentMatchGlobs`** for `**/*.tsx` → `jsdom`. | todo | Or explicit file suffixes (`*.node.test.ts` vs `*.dom.test.tsx`). |
| A3 | Add **`@testing-library/react`** + **`@testing-library/user-event`** + **`jsdom`** for component tests. | todo | |
| A4 | Document in this README **how to run** tests locally (`yarn test`, single file, CI parity). | todo | |

### Phase B — Database integration harness

| ID | Task | Status | Notes |
|----|------|--------|--------|
| B1 | Add **`docker-compose`** (or Makefile) for **test Postgres** image + port; document env var **`DATABASE_URL`** for tests. | todo | |
| B2 | Script: **migrate** test DB (`drizzle-kit migrate` or project migrate script) before integration suite. | todo | |
| B3 | Script: **seed** minimal reference data or truncate helpers for teardown. | todo | Align with isolation strategy (B4). |
| B4 | Choose and implement **isolation strategy** (truncate vs transaction vs prefixed IDs). Document tradeoffs here. | todo | |
| B5 | Wire **`yarn test:integration`** (or Vitest **project** `integration`) that runs only DB tests against Docker DB. | todo | CI must start Postgres service before this job. |
| B6 | **RLS test DB user:** Ensure integration/RLS tests use **`DATABASE_URL`** as the **same class of role** as production **`db`** (RLS enforced). Document that **`adminDb`-only** tests never substitute for RLS coverage. | todo | Mirror grants/Memberships for `app_user` in test DB as in prod. |
| B7 | **RLS behavioral suite:** Seed two tenants/users; for one repo + `withRLS`, assert **cross-tenant isolation** (and at least one **positive** “sees own rows” case). Start with the highest-risk table (e.g. requests/bookings). | todo | Lives under e.g. `src/db/repositories/__tests__/…` or `src/server/.../integration` — pick one convention. |

### Phase C — First vertical slice (pattern establishment)

| ID | Task | Status | Notes |
|----|------|--------|--------|
| C1 | Pick one domain (e.g. **bookings**): extract page data logic from `app/.../page.tsx` into **`src/server/bookings/`** (name reflects domain), returning a **discriminated union** (`redirect` vs `ok` payloads). Thin `page.tsx` only. | todo | Matches refactoring discussed for bookings. |
| C2 | Add **Vitest** tests for that loader module with **mocked** session/membership/repos (fast unit tests). | todo | |
| C3 | Add **integration tests** for **`bookingsRepo`** (or equivalent) against Docker Postgres **without** mocking SQL: (a) optional **admin** smoke “SQL shape” if useful; (b) **required** **`withRLS` + `db`** cases per **B7** so tenant isolation is covered. | todo | Depends on Phase B. |

### Phase D — API routes

| ID | Task | Status | Notes |
|----|------|--------|--------|
| D1 | Pick **one** `route.ts`, extract core logic to **`src/server/<domain>/`** or **`src/lib/...`** if cross-cutting. | todo | |
| D2 | Unit-test extracted module + minimal **handler integration** test (`NextRequest` → assert `Response`). | todo | |

### Phase E — React components

| ID | Task | Status | Notes |
|----|------|--------|--------|
| E1 | Pick one **`use client`** view (e.g. bookings table shell): **RTL** test with props/fixtures. | todo | |
| E2 | Optionally add **Storybook** later (`n/a` until needed) — not required for Vitest path. | n/a | |

### Phase F — E2E

| ID | Task | Status | Notes |
|----|------|--------|--------|
| F1 | Add **Playwright**, `playwright.config.ts`, baseURL from env (`PLAYWRIGHT_BASE_URL`). | todo | |
| F2 | Decide **where tests run**: local only vs **CI deploy** to staging vs ephemeral Preview + DB (**document decision** in Open decisions). | todo | |
| F3 | Implement **auth bootstrap** for e2e (seed users, login helper, or staging-only bypass) — **blocked on Supabase decision**. | todo | |
| F4 | One **smoke** E2E: login → land dashboard (or bookings). | todo | |
| F5 | One **multi-step** flow when ready (dispatcher → clinic → …) using **multiple contexts** or sequential steps. | todo | Depends on F3–F4. |

### Phase G — CI/CD

| ID | Task | Status | Notes |
|----|------|--------|--------|
| G1 | CI job: **lint + unit tests** (no Docker). | todo | |
| G2 | CI job: **integration tests** with **Postgres service** container + migrate + `test:integration`. | todo | |
| G3 | CI job (optional stage): **Playwright** against deployed URL + secrets for test users. | todo | After F2/F3 decided. |

---

## Open decisions (need your input)

Answer these when you can; update this section so the tasks stay unblocked.

1. **E2E target URL:** Always **local** (`next start` in CI + Postgres), vs **deployed preview/staging** URL? (Staging improves fidelity; local improves speed and secrets simplicity.)

2. **Supabase in E2E:** Use a **dedicated Supabase project** (or branch) for CI/e2e only, vs **`supabase start`** in CI (heavier), vs **minimal auth mocking** for UI-only smoke?

3. **E2E isolation:** Prefer **one shared seeded org** with **truncate between tests**, vs **new org per scenario**, vs **parallel workers with prefixed IDs**?

4. **Coverage thresholds:** Enforce **global coverage %** in CI from day one, or add after Phase C?

---

## Related paths

- Feature matrix (web push / extension): `tasks/extension_web_push/README.md`
- App source: `webapp/src/` (`app/`, `lib/`, future `server/`)
- RLS helper + connections: `webapp/src/db/rls.ts`, `webapp/src/db/index.ts` (`db` vs `adminDb`)

---

## Quick legend

- **todo** — not started  
- **in_progress** — active  
- **done** — shipped  
- **blocked** — dependency  
- **n/a** — skipped intentionally  
