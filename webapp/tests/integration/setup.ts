/**
 * Load **before** any `@/db` import so `DATABASE_URL` / `DATABASE_ADMIN_URL` are set.
 * Used only by `vitest.integration.config.ts`.
 *
 * Resolves `.env` from the **webapp package root** (Vitest / IDE cwd is not always `webapp/`).
 */
import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webappRoot = path.resolve(__dirname, "../..");

const envLocal = path.join(webappRoot, ".env.test.local");
const envExample = path.join(webappRoot, ".env.test.example");

if (fs.existsSync(envLocal)) {
  config({ path: envLocal });
} else if (fs.existsSync(envExample)) {
  config({ path: envExample });
}

const required = ["DATABASE_URL", "DATABASE_ADMIN_URL"] as const;
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(
      `[integration] Missing ${key}. Add ${envLocal} (copy from .env.test.example). Root=${webappRoot}`,
    );
  }
}
