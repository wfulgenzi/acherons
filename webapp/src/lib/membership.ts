import { cache } from "react";
import { fetchMembershipRowWithOrgForUser } from "@/server/membership/membership-queries";

export type MembershipContext = {
  orgId: string;
  orgType: "dispatch" | "clinic";
  orgName: string;
  role: "member" | "admin";
};

/**
 * Loads the user's organisation membership. Prefer `getMembership` in React
 * Server Components (memoised per request); use this in Route Handlers and other
 * entry points where React's `cache()` is not the right scoping.
 */
export async function getMembershipForRequest(
  userId: string,
): Promise<MembershipContext | null> {
  const row = await fetchMembershipRowWithOrgForUser(userId);
  if (!row) {
    return null;
  }
  return {
    orgId: row.memberships.orgId,
    orgType: row.organisations.type,
    orgName: row.organisations.name,
    role: row.memberships.role,
  };
}

/**
 * Returns the calling user's membership context, memoized per request via
 * React cache(). Safe to call in both the (app) layout and individual pages —
 * the DB query runs only once per server render tree.
 *
 * Returns null if the user has no membership (triggers redirect to onboarding).
 */
export const getMembership = cache(getMembershipForRequest);
