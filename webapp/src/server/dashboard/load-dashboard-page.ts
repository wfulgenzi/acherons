import "server-only";

import { getMembership } from "@/lib/membership";
import type { MembershipContext } from "@/lib/membership";
import {
  loadClinicDashboardBundle,
  loadDispatcherDashboardBundle,
} from "@/server/dashboard/dashboard-rls-queries";
import type { RequestItem } from "@/app/(app)/dashboard/_clinic/NewRequestsList";
import type { UpcomingBookingItem } from "@/app/(app)/dashboard/_clinic/UpcomingBookings";
import type { TodayItem } from "@/app/(app)/dashboard/_clinic/TodaySchedule";
import type { ActivityItem } from "@/app/(app)/dashboard/_clinic/RecentActivity";
import type { ProposalCardItem } from "@/app/(app)/dashboard/_dispatcher/NewProposalsList";
import type { OpenRequestItem } from "@/app/(app)/dashboard/_dispatcher/OpenRequestsList";

export type ClinicDashboardViewProps = {
  headerTitle: string;
  headerSubtitle: string;
  statCards: {
    newRequestsCount: number;
    todayCount: number;
    weekCount: number;
    completedCount: number;
  };
  newRequestsItems: RequestItem[];
  upcomingBookingsItems: UpcomingBookingItem[];
  todayScheduleItems: TodayItem[];
  recentActivityItems: ActivityItem[];
};

export type DispatcherDashboardViewProps = {
  headerSubtitle: string;
  statCards: {
    openRequestsCount: number;
    newProposalsCount: number;
    todayCount: number;
    pipelineCount: number;
  };
  proposalItems: ProposalCardItem[];
  openRequestItems: OpenRequestItem[];
};

export type DashboardPageResult =
  | { kind: "redirect"; to: "/onboarding" }
  | { kind: "clinic"; data: ClinicDashboardViewProps }
  | { kind: "dispatcher"; data: DispatcherDashboardViewProps };

export type DashboardPageLoaderDeps = {
  getMembership?: (
    userId: string,
  ) => Promise<MembershipContext | null>;
  /** Fixed clock for tests */
  now?: Date;
};

export function getDashboardGreeting(hour: number): string {
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 17) {
    return "Good afternoon";
  }
  return "Good evening";
}

export function buildClinicDashboardHeaderTitle(
  greeting: string,
  firstName: string | null,
): string {
  return `${greeting}${firstName ? `, ${firstName}` : ""}`;
}

function clinicDateWindows(now: Date) {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86_400_000);
  const daysToMonday = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const weekStart = new Date(todayStart.getTime() - daysToMonday * 86_400_000);
  const weekEnd = new Date(weekStart.getTime() + 7 * 86_400_000);
  const fourteenDaysAgo = new Date(todayStart.getTime() - 14 * 86_400_000);
  return { todayStart, todayEnd, weekStart, weekEnd, fourteenDaysAgo };
}

export async function loadClinicDashboardView(
  userId: string,
  orgId: string,
  userName: string | null,
  now: Date,
): Promise<ClinicDashboardViewProps> {
  const { todayStart, todayEnd, weekStart, weekEnd, fourteenDaysAgo } =
    clinicDateWindows(now);

  const [
    openRequests,
    todayBookings,
    weekBookings,
    completedCount,
    recentProposals,
  ] = await loadClinicDashboardBundle(
    { userId, orgId },
    {
      todayStart,
      todayEnd,
      weekStart,
      weekEnd,
      fourteenDaysAgo,
    },
  );

  const firstName = userName?.split(" ")[0] ?? null;
  const greeting = getDashboardGreeting(now.getHours());
  const headerTitle = buildClinicDashboardHeaderTitle(greeting, firstName);
  const headerSubtitle = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const newRequestsItems: RequestItem[] = openRequests.slice(0, 5).map((r) => ({
    id: r.id,
    patientAge: r.patientAge,
    patientGender: r.patientGender,
    caseDescription: r.caseDescription,
    createdAt: r.createdAt.toISOString(),
    proposalStatus: r.proposalStatus ?? null,
  }));

  const upcomingBookingsItems: UpcomingBookingItem[] = weekBookings.map(
    (r) => ({
      id: r.booking.id,
      confirmedStart: r.booking.confirmedStart,
      confirmedEnd: r.booking.confirmedEnd,
      patientAge: r.request.patientAge,
      patientGender: r.request.patientGender,
      caseDescription: r.request.caseDescription,
    }),
  );

  const todayScheduleItems: TodayItem[] = todayBookings.map((r) => ({
    id: r.booking.id,
    confirmedStart: r.booking.confirmedStart,
    confirmedEnd: r.booking.confirmedEnd,
    patientAge: r.request.patientAge,
    caseDescription: r.request.caseDescription,
  }));

  const recentActivityItems: ActivityItem[] = recentProposals.map((r) => ({
    id: r.proposal.id,
    status: r.proposal.status,
    createdAt: r.proposal.createdAt,
    patientAge: r.request.patientAge,
    patientGender: r.request.patientGender,
  }));

  return {
    headerTitle,
    headerSubtitle,
    statCards: {
      newRequestsCount: openRequests.length,
      todayCount: todayBookings.length,
      weekCount: weekBookings.length,
      completedCount,
    },
    newRequestsItems,
    upcomingBookingsItems,
    todayScheduleItems,
    recentActivityItems,
  };
}

export async function loadDispatcherDashboardView(
  userId: string,
  orgId: string,
  now: Date,
): Promise<DispatcherDashboardViewProps> {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86_400_000);

  const [openRequests, pendingProposalRows, todayCount, pipelineCount] =
    await loadDispatcherDashboardBundle(
      { userId, orgId },
      { todayStart, todayEnd, now },
    );

  const headerSubtitle = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const proposalItems: ProposalCardItem[] = pendingProposalRows.map((r) => {
    const firstSlot = r.proposal.proposedTimeslots?.[0] ?? null;
    return {
      id: r.proposal.id,
      clinicName: r.clinicName,
      proposedAt: r.proposal.createdAt,
      patientAge: r.request.patientAge,
      patientGender: r.request.patientGender,
      caseDescription: r.request.caseDescription,
      firstSlotStart: firstSlot ? new Date(firstSlot.start) : null,
    };
  });

  const openRequestItems: OpenRequestItem[] = openRequests.map((r) => ({
    id: r.id,
    patientAge: r.patientAge,
    patientGender: r.patientGender,
    caseDescription: r.caseDescription,
    postcode: r.postcode,
    clinicsContacted: r.clinicsContacted,
    proposalCount: r.proposalCount,
    createdAt: r.createdAt,
  }));

  return {
    headerSubtitle,
    statCards: {
      openRequestsCount: openRequests.length,
      newProposalsCount: pendingProposalRows.length,
      todayCount,
      pipelineCount,
    },
    proposalItems,
    openRequestItems,
  };
}

/**
 * Loads dashboard data for the authenticated user. Pass `userName` for the clinic
 * greeting (first name); omit concerns login — handle `getSession` in `page.tsx`.
 */
export async function loadDashboardPageData(
  userId: string,
  userName: string | null,
  deps: DashboardPageLoaderDeps = {},
): Promise<DashboardPageResult> {
  const resolveMembership = deps.getMembership ?? getMembership;
  const membership = await resolveMembership(userId);
  if (!membership) {
    return { kind: "redirect", to: "/onboarding" };
  }

  const now = deps.now ?? new Date();

  if (membership.orgType === "clinic") {
    const data = await loadClinicDashboardView(
      userId,
      membership.orgId,
      userName,
      now,
    );
    return { kind: "clinic", data };
  }

  const data = await loadDispatcherDashboardView(userId, membership.orgId, now);
  return { kind: "dispatcher", data };
}
