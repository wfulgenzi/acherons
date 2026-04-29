/**
 * Shared coverage scope for backend-ish source (server, db, lib, API routes).
 * Vitest v4: use `include` so the report lists files in scope, not only loaded files.
 * @see https://vitest.dev/config/#coverage
 */
export const backendCoverage = {
  provider: "v8" as const,
  reporter: ["text", "text-summary", "html", "json-summary", "lcov"],
  /** Globs are relative to project root (webapp/). */
  include: [
    "src/server/**/*.ts",
    "src/lib/**/*.ts",
    "src/db/**/*.ts",
    "src/app/api/**/*.ts",
  ],
  exclude: [
    "**/*.d.ts",
    "**/*.config.*",
    "**/node_modules/**",
    ".next/**",
  ],
};
