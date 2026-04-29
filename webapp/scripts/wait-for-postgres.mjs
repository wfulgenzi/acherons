/**
 * Wait until DATABASE_ADMIN_URL accepts connections (docker health + startup lag).
 * Usage: from webapp/ with .env.test.local present, or pass env inline.
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

const url = process.env.DATABASE_ADMIN_URL;
if (!url) {
  console.error("Missing DATABASE_ADMIN_URL (load .env.test.local)");
  process.exit(1);
}

const maxAttempts = 45;
const delayMs = 1000;

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

for (let i = 0; i < maxAttempts; i++) {
  const sql = postgres(url, sqlOpts(url));
  try {
    await sql`SELECT 1`;
    await sql.end({ timeout: 2 });
    console.log("Postgres is ready.");
    process.exit(0);
  } catch (err) {
    await sql.end({ timeout: 1 }).catch(() => {});
    if (i === maxAttempts - 1) {
      console.error("Postgres did not become ready in time:", err);
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
}
