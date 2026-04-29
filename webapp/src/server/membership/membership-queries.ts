/**
 * Pre-RLS membership lookup (app session user). Used by `lib/membership`.
 */
import { withUserContext } from "@/db/rls";
import { membershipsRepo } from "@/db/repositories";

export async function fetchMembershipRowWithOrgForUser(userId: string) {
  return withUserContext(userId, (tx) =>
    membershipsRepo.findByUserIdWithOrg(tx, userId),
  );
}
