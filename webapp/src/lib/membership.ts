import { cache } from "react";
import { withUserContext } from "@/db/rls";
import { membershipsRepo } from "@/db/repositories";

export type MembershipContext = {
  orgId: string;
  orgType: "dispatch" | "clinic";
  orgName: string;
  role: "member" | "admin";
};

/**
 * Returns the calling user's membership context, memoized per request via
 * React cache(). Safe to call in both the (app) layout and individual pages —
 * the DB query runs only once per server render tree.
 *
 * Returns null if the user has no membership (triggers redirect to onboarding).
 */
export const getMembership = cache(async (userId: string): Promise<MembershipContext | null> => {
  const row = await withUserContext(userId, (tx) =>
    membershipsRepo.findByUserIdWithOrg(tx, userId)
  );
  if (!row) return null;
  return {
    orgId: row.memberships.orgId,
    orgType: row.organisations.type,
    orgName: row.organisations.name,
    role: row.memberships.role,
  };
});
