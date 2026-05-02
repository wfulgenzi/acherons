# Running scripts in the terminal

- After `cd` into **`webapp/`**, run **`nvm use`** before installs or scripts (see [`.nvmrc`](.nvmrc)).

ESLint and Prettier configs are in the **repository root** (`../eslint.config.mjs`, `../.prettierrc`). Use **`yarn lint`** / **`yarn format`** here, or from the monorepo root run **`yarn lint`** / **`yarn format`** for all workspaces.

<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->
