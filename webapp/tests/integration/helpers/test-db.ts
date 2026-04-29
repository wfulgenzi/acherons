import postgres from "postgres";

function createIntegrationSql(connectionString: string) {
  let hostname = "";
  try {
    hostname = new URL(connectionString).hostname;
  } catch {
    /* raw connection string without URL form */
  }
  const isLocal =
    hostname === "127.0.0.1" ||
    hostname === "localhost" ||
    hostname === "::1" ||
    hostname === "[::1]";
  return postgres(connectionString, {
    max: 1,
    ...(isLocal ? { ssl: false as const } : {}),
  });
}

function rethrowPostgresConnectionError(err: unknown, label: string): never {
  const code =
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string"
      ? (err as { code: string }).code
      : null;
  const msg = err instanceof Error ? err.message : String(err);
  if (code === "28P01") {
    throw new Error(
      `${label}: password authentication failed (${msg}). ` +
        `For docker-compose.test.yml use superuser postgres/postgres on port 55432: ` +
        `DATABASE_ADMIN_URL=postgresql://postgres:postgres@127.0.0.1:55432/acherons_test. ` +
        `Run yarn db:test:up, ensure nothing else binds :55432, then yarn db:test:prepare.`,
    );
  }
  if (code === "ECONNREFUSED" || msg.includes("ECONNREFUSED")) {
    throw new Error(
      `${label}: cannot reach Postgres (${msg}). Start the test DB: yarn db:test:up`,
    );
  }
  throw err;
}

/**
 * Truncate all application tables in `public` (keeps `__drizzle_migrations`).
 * Uses the **admin** URL so RLS does not block deletes.
 */
export async function truncateAllPublicTables(adminUrl: string): Promise<void> {
  const sql = createIntegrationSql(adminUrl);
  try {
    let tables: { tablename: string }[];
    try {
      tables = await sql<
        { tablename: string }[]
      >`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename <> '__drizzle_migrations'
      `;
    } catch (err) {
      rethrowPostgresConnectionError(err, "truncateAllPublicTables");
    }
    if (tables.length === 0) {
      return;
    }
    const quoted = tables.map((t) => {
      const name = t.tablename.replace(/"/g, '""');
      return `"${name}"`;
    });
    await sql.unsafe(
      `TRUNCATE TABLE ${quoted.join(", ")} RESTART IDENTITY CASCADE`,
    );
  } finally {
    await sql.end({ timeout: 10 });
  }
}

export type TestSeedContext = {
  adminUrl: string;
  appUrl: string;
};

export function getIntegrationDbUrls(): TestSeedContext {
  const adminUrl = process.env.DATABASE_ADMIN_URL;
  const appUrl = process.env.DATABASE_URL;
  if (!adminUrl || !appUrl) {
    throw new Error(
      "DATABASE_ADMIN_URL and DATABASE_URL must be set (see .env.test.example)",
    );
  }
  return { adminUrl, appUrl };
}

/**
 * Reset DB state between tests (admin truncate). Call from `afterEach` or `beforeEach`.
 */
export async function resetIntegrationDatabase(): Promise<void> {
  const { adminUrl } = getIntegrationDbUrls();
  await truncateAllPublicTables(adminUrl);
}

/**
 * Placeholder for shared fixtures (orgs, users, memberships). Extend when writing RLS tests.
 * Use {@link getIntegrationDbUrls} when you need `adminUrl` / `appUrl`.
 */
export async function seedMinimalBaseline(): Promise<void> {
  // Intentionally empty — add inserts via admin connection when B7-style tests land.
}
