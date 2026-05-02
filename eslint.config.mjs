import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, globalIgnores } from "eslint/config";
import eslint from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

const repoRoot = path.dirname(fileURLToPath(import.meta.url));
const webappRoot = path.join(repoRoot, "webapp");

/** Scope flat-config entries (e.g. eslint-config-next) to paths under `webapp/`. */
function scopeToWebapp(configs) {
  return configs.map((entry) => {
    if (!entry || typeof entry !== "object") {
      return entry;
    }
    return {
      ...entry,
      files: ["**/webapp/**/*.{js,jsx,mjs,ts,tsx}"],
      settings: {
        ...entry.settings,
        next: {
          ...entry.settings?.next,
          rootDir: webappRoot,
        },
      },
    };
  });
}

export default defineConfig([
  globalIgnores([
    "**/node_modules/**",
    "**/dist/**",
    "**/.next/**",
    "**/out/**",
    "**/build/**",
    "**/coverage/**",
    "**/yarn.lock",
    "**/package-lock.json",
    "**/pnpm-lock.yaml",
    "**/next-env.d.ts",
    "webapp/drizzle/**",
  ]),
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,mts}"],
    rules: {
      /** Names starting with `_` are intentionally unused (callbacks, catch, etc.). */
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    rules: {
      curly: ["error", "all"],
    },
  },
  ...scopeToWebapp([...nextVitals, ...nextTs]),
  {
    files: ["**/extension/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat["jsx-runtime"].rules,
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
    settings: {
      react: { version: "19.0" },
    },
  },
  {
    /** Repository implementations stay behind `src/server/**`; app/components/lib import `@/server/*` wrappers only. */
    files: ["**/webapp/src/**/*.{ts,tsx}"],
    ignores: ["**/webapp/src/server/**"],
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
  eslintConfigPrettier,
]);
