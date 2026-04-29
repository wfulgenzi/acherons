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
    name: "integration",
    setupFiles: ["./vitest.setup.ts", "./tests/integration/setup.ts"],
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    exclude: ["node_modules", ".next"],
    fileParallelism: false,
    maxWorkers: 1,
    coverage: {
      ...backendCoverage,
      reportsDirectory: "./coverage/integration",
    },
  },
});
