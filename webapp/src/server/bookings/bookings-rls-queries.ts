/**
 * `withRLS` + bookings repositories for server loaders and integration tests.
 */
import { withRLS } from "@/db/rls";
import { bookingsRepo } from "@/db/repositories";
import type { OrgRlsContext } from "@/server/rls-context";

export async function listBookingsForClinic(ctx: OrgRlsContext, clinicOrgId: string) {
  return withRLS({ userId: ctx.userId, orgId: ctx.orgId }, (tx) =>
    bookingsRepo.findByClinic(tx, clinicOrgId),
  );
}

export async function listBookingsForDispatcher(
  ctx: OrgRlsContext,
  dispatcherOrgId: string,
) {
  return withRLS({ userId: ctx.userId, orgId: ctx.orgId }, (tx) =>
    bookingsRepo.findByDispatcher(tx, dispatcherOrgId),
  );
}
