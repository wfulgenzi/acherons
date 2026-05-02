# Running scripts in the terminal

- After `cd` into this directory (`extension/`), always run `nvm use` first so the Node version matches [`.nvmrc`](.nvmrc) (required for Vite and the monorepo engine).
- Run `nvm use` **before** `yarn install`, `npm install`, or any command that installs packages or runs the build.

ESLint and Prettier live at the **repo root** (`../eslint.config.mjs`, `../.prettierrc`). From **`extension/`**: `yarn lint` / `yarn format` use those configs via ESLint’s and Prettier’s upward lookup.
