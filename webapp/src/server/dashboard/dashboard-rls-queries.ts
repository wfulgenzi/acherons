/**
 * `withRLS` + multi-repo bundles for dashboard views. Shared with integration tests.
 */
import { withRLS } from "@/db/rls";
import { bookingsRepo, proposalsRepo, requestsRepo } from "@/db/repositories";
import type { OrgRlsContext } from "@/server/rls-context";

export type ClinicDashboardWindows = {
  todayStart: Date;
  todayEnd: Date;
  weekStart: Date;
  weekEnd: Date;
  fourteenDaysAgo: Date;
};

export async function loadClinicDashboardBundle(
  ctx: OrgRlsContext,
  windows: ClinicDashboardWindows,
) {
  const { todayStart, todayEnd, weekStart, weekEnd, fourteenDaysAgo } = windows;
  return withRLS({ userId: ctx.userId, orgId: ctx.orgId }, async (tx) =>
    Promise.all([
      requestsRepo.findAccessibleByClinic(tx, ctx.orgId),
      bookingsRepo.findByClinicInWindow(tx, ctx.orgId, todayStart, todayEnd),
      bookingsRepo.findByClinicInWindow(tx, ctx.orgId, weekStart, weekEnd),
      bookingsRepo.countByClinicInWindow(
        tx,
        ctx.orgId,
        fourteenDaysAgo,
        todayStart,
      ),
      proposalsRepo.findRecentByClinic(tx, ctx.orgId, 5),
    ]),
  );
}

export type DispatcherDashboardRange = {
  todayStart: Date;
  todayEnd: Date;
  now: Date;
};

export async function loadDispatcherDashboardBundle(
  ctx: OrgRlsContext,
  range: DispatcherDashboardRange,
) {
  const { todayStart, todayEnd, now } = range;
  return withRLS({ userId: ctx.userId, orgId: ctx.orgId }, async (tx) =>
    Promise.all([
      requestsRepo.findOpenByDispatcher(tx, ctx.orgId),
      proposalsRepo.findPendingByDispatcher(tx, ctx.orgId, 6),
      bookingsRepo.countByDispatcherInWindow(tx, ctx.orgId, todayStart, todayEnd),
      bookingsRepo.countUpcomingByDispatcher(tx, ctx.orgId, now),
    ]),
  );
}
