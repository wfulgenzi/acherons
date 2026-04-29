/**
 * `withRLS` + notifications repo for loaders, API routes, and tests.
 */
import { withRLS } from "@/db/rls";
import { notificationsRepo } from "@/db/repositories";
import type { OrgRlsContext } from "@/server/rls-context";

export async function markNotificationReadByIdForOrg(
  ctx: OrgRlsContext,
  notificationId: string,
) {
  return withRLS({ userId: ctx.userId, orgId: ctx.orgId }, (tx) =>
    notificationsRepo.markReadByIdForOrg(tx, notificationId, ctx.orgId),
  );
}

export async function markAllUnreadNotificationsForOrg(ctx: OrgRlsContext) {
  return withRLS({ userId: ctx.userId, orgId: ctx.orgId }, (tx) =>
    notificationsRepo.markAllUnreadForOrg(tx, ctx.orgId),
  );
}

export async function findRecentNotificationsForOrg(
  ctx: OrgRlsContext,
  limit: number,
) {
  return withRLS({ userId: ctx.userId, orgId: ctx.orgId }, (tx) =>
    notificationsRepo.findRecentForOrg(tx, ctx.orgId, limit),
  );
}
