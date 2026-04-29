# Testing strategy — Acherons webapp

This document records **recommendations**, **decisions**, and a **task breakdown** for growing automated testing. Update **Status** as you go (`todo` | `in_progress` | `done` | `blocked` | `n/a`).

---

## Context

- **App:** Next.js 16 (App Router), React 19, Drizzle + Postgres, Supabase (auth / realtime in places), server modules colocated with product.
- **Today:** **Vitest** in `webapp/` (unit tests; Playwright not added yet). See `webapp/package.json` `engines.node` and **Node.js version (Vitest 4)** below.

---

## Test directory layout (`webapp/`)

| Location | Purpose |
|----------|---------|
| **`tests/unit/`** | Fast unit tests. **Mirror `src/`**: same subfolders and source basename + **`.test.ts`** or **`.test.tsx`**. Example: `src/server/bookings/load-bookings-page.ts` → `tests/unit/server/bookings/load-bookings-page.test.ts`. |
| **`tests/integration/`** | Tests that need **Docker Compose Postgres**, **migrations**, **seed/teardown**, or asserting **real DB in/out** (including RLS). Same mirror optional; prefer clear names and shared harness imports. |
| **`tests/stubs/`** | Build/test stubs (e.g. `server-only` for Vitest). Not a mirror of `src/`. |

Shared fixtures/helpers can live in **`tests/unit/helpers/`** (or **`tests/integration/helpers/`**) when multiple suites need them — you do **not** need one giant `tests/unit/server/bookings.ts`; mirroring keeps navigation and ownership obvious.

---

## Node.js version (Vitest 4 / Vite 8)

**Vitest 4** pulls **Vite 8** and **Rolldown**. On **older Node** (e.g. **20.12.x**), `yarn test` can fail at startup with:

`TypeError [ERR_INVALID_ARG_VALUE]: ... styleText ... Received [ 'underline', 'gray' ]`

That happens because Rolldown calls Node’s `util.styleText` with **multiple modifiers**; Node versions that only accept a **single** format throw before any tests run. Some transitive deps also declare **`engines.node >= 20.19.0`**, so **`yarn install`** may refuse on older Node unless you fix the Node version.

**Fix:** Use the Node version in **`webapp/.nvmrc`** (`nvm use` in `webapp/`) or any **>= 20.19** (and preferably **22.x** if you still see Rolldown issues). **`package.json`** lists a minimum **`engines.node`** — treat it as authoritative for CI and local dev.

Downgrading Vitest/Vite was only a **temporary workaround** when the shell used an older Node; it is **not** required if Node meets `engines` and `.nvmrc`.

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
| A1 | Add **Vitest** (+ coverage driver if desired), `vitest.config.ts`, scripts `test` / `test:watch` in `webapp/package.json`. | done | Use `@/` alias consistent with Next/tsconfig paths. **`yarn test`** runs **`tests/unit`** only; **`yarn test:integration`** → **`tests/integration`**. |
| A2 | Split **environments**: **`environment: 'node'`** default (Vitest 4). **Vitest 4 removed `environmentMatchGlobs`** — for RTL/DOM, put **`// @vitest-environment jsdom`** at the top of a `*.test.tsx` file (or use Vitest **projects** if we need many DOM suites). | done | |
| A3 | Add **`@testing-library/react`** + **`@testing-library/user-event`** + **`jsdom`** for component tests. | done | |
| A4 | Document in this README **how to run** tests locally (`yarn test`, single file, CI parity). | done | **Unit:** `cd webapp && yarn test`. **Integration:** copy **`.env.test.example`** → **`.env.test.local`**, run **`yarn db:test:up`** then **`yarn db:test:prepare`**, then **`yarn test:integration`**. Single file: `yarn vitest run path/to/file.test.ts`. |

### Phase B — Database integration harness

| ID | Task | Status | Notes |
|----|------|--------|--------|
| B1 | Add **`docker-compose`** (or Makefile) for **test Postgres** image + port; document env var **`DATABASE_URL`** for tests. | done | **`webapp/docker-compose.test.yml`** — port **55432**, DB **`acherons_test`**. |
| B2 | Script: **migrate** test DB (`drizzle-kit migrate` or project migrate script) before integration suite. | done | **`yarn db:test:migrate`** (loads **`.env.test.local`** via dotenv-cli). |
| B3 | Script: **seed** minimal reference data or truncate helpers for teardown. | done | **`tests/integration/helpers/test-db.ts`**: **`truncateAllPublicTables`**, **`resetIntegrationDatabase`**, **`seedMinimalBaseline`** (placeholder until B7). |
| B4 | Choose and implement **isolation strategy** (truncate vs transaction vs prefixed IDs). Document tradeoffs here. | done | **Truncate** all public tables except **`__drizzle_migrations`** via **admin** URL between tests; **`vitest.integration.config.ts`** uses **`singleFork`** to avoid races. |
| B5 | Wire **`yarn test:integration`** (or Vitest **project** `integration`) that runs only DB tests against Docker DB. | done | **`vitest.integration.config.ts`** + **`tests/integration/setup.ts`** loads **`.env.test.local`**. |
| B6 | **RLS test DB user:** Ensure integration/RLS tests use **`DATABASE_URL`** as the **same class of role** as production **`db`** (RLS enforced). Document that **`adminDb`-only** tests never substitute for RLS coverage. | done | **`scripts/db-test-grants.sql`**: role **`acherons_app`**. **`DATABASE_ADMIN_URL`** = migrate / truncate / seed; **`DATABASE_URL`** = **`db`** + **`withRLS`** for RLS tests. |
| B7 | **RLS behavioral suite:** Seed two tenants/users; for one repo + `withRLS`, assert **cross-tenant isolation** (and at least one **positive** “sees own rows” case). Start with the highest-risk table (e.g. requests/bookings). | done | **`src/server/*/\*-rls-queries.ts`** centralise `withRLS` + repos (no `server-only`). **`tests/integration/\*-rls.test.ts`** call those modules + **`DATABASE_URL`**. Seeds: **`dispatcher-rls-seed.ts`**, **`booking-proposal-rls-seed.ts`**. |

**First-time local:** `cp .env.test.example .env.test.local` → **`yarn db:test:up`** → **`yarn db:test:prepare`** → **`yarn test:integration`**. **`yarn db:test:down`** tears down the compose stack (**`-v`** clears data).

### Phase C — First vertical slice (pattern establishment)

| ID | Task | Status | Notes |
|----|------|--------|--------|
| C1 | Pick one domain (e.g. **bookings**): extract page data logic from `app/.../page.tsx` into **`src/server/bookings/`** (name reflects domain), returning a **discriminated union** (`redirect` vs `ok` payloads). Thin `page.tsx` only. | done | Extended across bookings, requests, proposals, dashboard, etc. |
| C2 | Add **Vitest** tests for that loader module with **mocked** session/membership/repos (fast unit tests). | done | See **`tests/unit/server/`**. |
| C3 | Add **integration tests** for **`bookingsRepo`** (or equivalent) against Docker Postgres **without** mocking SQL: (a) optional **admin** smoke “SQL shape” if useful; (b) **required** **`withRLS` + `db`** cases per **B7** so tenant isolation is covered. | done | Uses **`bookings-rls-queries`** / **`requests-rls-queries`** / **`proposals-rls-queries`** / **`dashboard-rls-queries`** — same surface as server loaders. |

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
- App source: `webapp/src/` (`app/`, `lib/`, `server/`)
- RLS helper + connections: `webapp/src/db/rls.ts`, `webapp/src/db/index.ts` (`db` vs `adminDb`)
- **RLS query modules** (shared by **`src/server/*/load-*.ts`** and **`tests/integration/`**): `webapp/src/server/rls-context.ts`, `webapp/src/server/requests/requests-rls-queries.ts`, `webapp/src/server/bookings/bookings-rls-queries.ts`, `webapp/src/server/proposals/proposals-rls-queries.ts`, `webapp/src/server/dashboard/dashboard-rls-queries.ts`

---

## Quick legend

- **todo** — not started  
- **in_progress** — active  
- **done** — shipped  
- **blocked** — dependency  
- **n/a** — skipped intentionally  
