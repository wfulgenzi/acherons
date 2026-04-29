/**
 * Supabase deploy: run Drizzle journal migrations, then apply `drizzle/supabase/*.sql`
 * (JWT / hosting-specific overlays). Docker/test DBs should use `db:test:migrate` only.
 *
 * Usage (from webapp/):
 *   yarn db:migrate:supabase
 *   dotenv -e .env.local -- node scripts/supabase-migrate-with-overlays.mjs
 *
 * Overlays only (after migrate already ran):
 *   yarn db:apply-supabase-overlays
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const overlaysOnly = process.argv.includes("--overlays-only");

function createSql(url) {
  let hostname = "";
  try {
    hostname = new URL(url).hostname;
  } catch {
    /* ignore */
  }
  const local =
    hostname === "127.0.0.1" ||
    hostname === "localhost" ||
    hostname === "::1";
  return postgres(url, {
    max: 1,
    ...(local ? { ssl: false } : {}),
  });
}

if (!overlaysOnly) {
  execSync("npx drizzle-kit migrate", {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
}

const url = process.env.DATABASE_ADMIN_URL;
if (!url) {
  console.error(
    "Missing DATABASE_ADMIN_URL (same as drizzle.config.ts / migrate). " +
      "Example: dotenv -e .env.local -- yarn db:migrate:supabase",
  );
  process.exit(1);
}

const dir = path.join(root, "drizzle", "supabase");
const files = fs.existsSync(dir)
  ? fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()
  : [];

if (files.length === 0) {
  console.log("No overlay SQL in drizzle/supabase/ — nothing to apply.");
  process.exit(0);
}

const sql = createSql(url);
try {
  for (const f of files) {
    const body = fs.readFileSync(path.join(dir, f), "utf8");
    console.log(`Applying Supabase overlay: ${f}`);
    await sql.unsafe(body);
  }
} finally {
  await sql.end({ timeout: 15 });
}

console.log("Supabase overlays applied.");
