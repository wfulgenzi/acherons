/** Webapp origin used for API calls (override with `VITE_APP_BASE` at build time). */
export const APP_BASE =
  typeof import.meta.env.VITE_APP_BASE === "string" &&
  import.meta.env.VITE_APP_BASE.length > 0
    ? import.meta.env.VITE_APP_BASE.replace(/\/$/, "")
    : "http://localhost:3000";
