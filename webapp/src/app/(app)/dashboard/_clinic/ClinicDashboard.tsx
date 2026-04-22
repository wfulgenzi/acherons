import { eq, and, desc, gte, lt, count } from "drizzle-orm";
import { db } from "@/db";
import { requests, requestClinicAccess, proposals, bookings } from "@/db/schema";
import { StatCards } from "./StatCards";
import { NewRequestsList } from "./NewRequestsList";
import { UpcomingBookings } from "./UpcomingBookings";
import { TodaySchedule } from "./TodaySchedule";
import { RecentActivity } from "./RecentActivity";

interface Props {
  orgId: string;
  orgName: string;
  userName: string | null;
}

function getGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export async function ClinicDashboard({ orgId, userName }: Props) {
  const now = new Date();

  // ── Date boundaries ─────────────────────────────────────────────────────
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86_400_000);
  const daysToMonday = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const weekStart = new Date(todayStart.getTime() - daysToMonday * 86_400_000);
  const weekEnd = new Date(weekStart.getTime() + 7 * 86_400_000);
  const fourteenDaysAgo = new Date(todayStart.getTime() - 14 * 86_400_000);

  // ── Fetch all data in parallel ───────────────────────────────────────────
  const [openRequests, todayBookings, weekBookings, completedRows, recentProposals] =
    await Promise.all([
      // Open requests this clinic has been granted access to (including already-proposed)
      db
        .select({ request: requests, proposalStatus: proposals.status })
        .from(requests)
        .innerJoin(
          requestClinicAccess,
          and(
            eq(requestClinicAccess.requestId, requests.id),
            eq(requestClinicAccess.clinicOrgId, orgId)
          )
        )
        .leftJoin(
          proposals,
          and(
            eq(proposals.requestId, requests.id),
            eq(proposals.clinicOrgId, orgId)
          )
        )
        .where(eq(requests.status, "open"))
        .orderBy(desc(requests.createdAt)),

      // Today's bookings
      db
        .select({ booking: bookings, request: requests })
        .from(bookings)
        .innerJoin(requests, eq(requests.id, bookings.requestId))
        .where(
          and(
            eq(bookings.clinicOrgId, orgId),
            gte(bookings.confirmedStart, todayStart),
            lt(bookings.confirmedStart, todayEnd)
          )
        )
        .orderBy(bookings.confirmedStart),

      // This week's bookings
      db
        .select({ booking: bookings, request: requests })
        .from(bookings)
        .innerJoin(requests, eq(requests.id, bookings.requestId))
        .where(
          and(
            eq(bookings.clinicOrgId, orgId),
            gte(bookings.confirmedStart, weekStart),
            lt(bookings.confirmedStart, weekEnd)
          )
        )
        .orderBy(bookings.confirmedStart),

      // Completed bookings count (past 14 days, before today)
      db
        .select({ total: count() })
        .from(bookings)
        .where(
          and(
            eq(bookings.clinicOrgId, orgId),
            gte(bookings.confirmedStart, fourteenDaysAgo),
            lt(bookings.confirmedStart, todayStart)
          )
        ),

      // Recent proposals by this clinic with request info
      db
        .select({ proposal: proposals, request: requests })
        .from(proposals)
        .innerJoin(requests, eq(requests.id, proposals.requestId))
        .where(eq(proposals.clinicOrgId, orgId))
        .orderBy(desc(proposals.createdAt))
        .limit(5),
    ]);

  // ── Presentation ─────────────────────────────────────────────────────────
  const firstName = userName?.split(" ")[0] ?? null;
  const greeting = getGreeting(now.getHours());
  const dateStr = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex-1 min-h-screen">
      {/* ── Top header ─────────────────────────────────────────────────── */}
      <header className="bg-brand-50 border-b border-brand-200 px-8 py-6 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {greeting}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5 capitalize">{dateStr}</p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search — wired up later */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-52 cursor-text">
            <SearchIcon />
            <span className="text-sm text-gray-400 select-none">
              Search patients…
            </span>
          </div>

          {/* Notification bell — not wired yet */}
          <button
            disabled
            className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-brand-200 bg-brand-100 text-brand-500 cursor-not-allowed"
            title="Notifications coming soon"
          >
            <BellIcon />
          </button>
        </div>
      </header>

      {/* ── Page content ───────────────────────────────────────────────── */}
      <div className="px-8 py-8 space-y-7">
        {/* Stat cards */}
        <StatCards
          newRequestsCount={openRequests.length}
          todayCount={todayBookings.length}
          weekCount={weekBookings.length}
          completedCount={completedRows[0]?.total ?? 0}
        />

        {/* Main 2-col grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left — main content (2/3) */}
          <div className="col-span-2 space-y-6">
            <NewRequestsList
              items={openRequests.slice(0, 5).map((r) => ({
                id: r.request.id,
                patientAge: r.request.patientAge,
                patientGender: r.request.patientGender,
                caseDescription: r.request.caseDescription,
                createdAt: r.request.createdAt.toISOString(),
                proposalStatus: r.proposalStatus ?? null,
              }))}
            />
            <UpcomingBookings
              items={weekBookings.map((r) => ({
                id: r.booking.id,
                confirmedStart: r.booking.confirmedStart,
                confirmedEnd: r.booking.confirmedEnd,
                patientAge: r.request.patientAge,
                patientGender: r.request.patientGender,
                caseDescription: r.request.caseDescription,
              }))}
            />
          </div>

          {/* Right — sidebar (1/3) */}
          <div className="space-y-4">
            <TodaySchedule
              items={todayBookings.map((r) => ({
                id: r.booking.id,
                confirmedStart: r.booking.confirmedStart,
                confirmedEnd: r.booking.confirmedEnd,
                patientAge: r.request.patientAge,
                caseDescription: r.request.caseDescription,
              }))}
            />
            <RecentActivity
              items={recentProposals.map((r) => ({
                id: r.proposal.id,
                status: r.proposal.status,
                createdAt: r.proposal.createdAt,
                patientAge: r.request.patientAge,
                patientGender: r.request.patientGender,
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
