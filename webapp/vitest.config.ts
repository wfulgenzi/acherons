import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

import { backendCoverage } from "./vitest.coverage.backend";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@acherons/contracts": path.resolve(
        __dirname,
        "../packages/contracts/src/index.ts",
      ),
      "server-only": path.resolve(__dirname, "./tests/stubs/server-only.ts"),
    },
  },
  test: {
    setupFiles: ["./vitest.setup.ts"],
    environment: "node",
    /**
     * Vitest 4 dropped `environmentMatchGlobs`. For RTL / DOM tests, add at the
     * top of a file: `// @vitest-environment jsdom`
     */
    include: [
      "tests/unit/**/*.test.ts",
      "tests/unit/**/*.test.tsx",
    ],
    exclude: ["node_modules", ".next"],
    coverage: {
      ...backendCoverage,
      reportsDirectory: "./coverage/unit",
    },
  },
});
