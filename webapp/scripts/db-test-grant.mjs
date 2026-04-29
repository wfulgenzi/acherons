/**
 * Create non-superuser role + grants so DATABASE_URL is subject to RLS
 * (superuser / table owner bypasses RLS unless FORCE ROW LEVEL SECURITY).
 *
 * Run after migrations: `yarn db:test:grant`
 */
import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const localEnv = path.join(root, ".env.test.local");
const exampleEnv = path.join(root, ".env.test.example");
if (fs.existsSync(localEnv)) {
  config({ path: localEnv });
} else if (fs.existsSync(exampleEnv)) {
  config({ path: exampleEnv });
}

const adminUrl = process.env.DATABASE_ADMIN_URL;
if (!adminUrl) {
  console.error("Missing DATABASE_ADMIN_URL");
  process.exit(1);
}

const sqlFile = path.join(__dirname, "db-test-grants.sql");
const body = fs.readFileSync(sqlFile, "utf8");

function sqlOpts(urlString) {
  try {
    const u = new URL(urlString);
    const local =
      u.hostname === "127.0.0.1" ||
      u.hostname === "localhost" ||
      u.hostname === "::1";
    return local ? { max: 1, ssl: false } : { max: 1 };
  } catch {
    return { max: 1 };
  }
}

const sql = postgres(adminUrl, sqlOpts(adminUrl));
try {
  await sql.unsafe(body);
  console.log("db:test:grant applied.");
} finally {
  await sql.end({ timeout: 5 });
}
