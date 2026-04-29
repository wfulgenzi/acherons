import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Require braces around all control flow bodies.
      // Prettier will expand blocks onto multiple lines (spacing + indentation).
      curly: ["error", "all"],
    },
  },
  {
    /** Repository implementations stay behind `src/server/**`; app/components/lib import `@/server/*` wrappers only. */
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/server/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/db/repositories", "@/db/repositories/*"],
              message:
                "Import `@/db/repositories` only from `src/server/**`. Use server query modules from app/components/lib (runtime imports). `import type` is allowed (allowTypeImports).",
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },
  // Must be last: disables stylistic rules that Prettier would conflict with.
  eslintConfigPrettier,
]);

export default eslintConfig;
