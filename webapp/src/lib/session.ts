import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Returns the current session, memoized per request via React cache().
 * Safe to call in both layouts and pages — the underlying auth lookup
 * runs only once per server render tree regardless of how many components
 * call this.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});
