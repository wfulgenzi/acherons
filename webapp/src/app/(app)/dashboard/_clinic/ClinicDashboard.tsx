import { withRLS } from "@/db/rls";
import { requestsRepo, bookingsRepo, proposalsRepo } from "@/db/repositories";
import { StatCards } from "./StatCards";
import { NewRequestsList } from "./NewRequestsList";
import { UpcomingBookings } from "./UpcomingBookings";
import { TodaySchedule } from "./TodaySchedule";
import { RecentActivity } from "./RecentActivity";

interface Props {
  orgId: string;
  orgName: string;
  userId: string;
  userName: string | null;
}

function getGreeting(hour: number): string {
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 17) {
    return "Good afternoon";
  }
  return "Good evening";
}

export async function ClinicDashboard({ orgId, userId, userName }: Props) {
  const now = new Date();

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86_400_000);
  const daysToMonday = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const weekStart = new Date(todayStart.getTime() - daysToMonday * 86_400_000);
  const weekEnd = new Date(weekStart.getTime() + 7 * 86_400_000);
  const fourteenDaysAgo = new Date(todayStart.getTime() - 14 * 86_400_000);

  const [
    openRequests,
    todayBookings,
    weekBookings,
    completedCount,
    recentProposals,
  ] = await withRLS({ userId, orgId }, async (tx) =>
    Promise.all([
      requestsRepo.findAccessibleByClinic(tx, orgId),
      bookingsRepo.findByClinicInWindow(tx, orgId, todayStart, todayEnd),
      bookingsRepo.findByClinicInWindow(tx, orgId, weekStart, weekEnd),
      bookingsRepo.countByClinicInWindow(
        tx,
        orgId,
        fourteenDaysAgo,
        todayStart,
      ),
      proposalsRepo.findRecentByClinic(tx, orgId, 5),
    ]),
  );

  const firstName = userName?.split(" ")[0] ?? null;
  const greeting = getGreeting(now.getHours());
  const dateStr = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex-1 min-h-screen">
      <header className="bg-brand-50 border-b border-brand-200 px-8 py-6 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {greeting}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5 capitalize">{dateStr}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-52 cursor-text">
            <SearchIcon />
            <span className="text-sm text-gray-400 select-none">
              Search patients…
            </span>
          </div>

          <button
            disabled
            className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-brand-200 bg-brand-100 text-brand-500 cursor-not-allowed"
            title="Notifications coming soon"
          >
            <BellIcon />
          </button>
        </div>
      </header>

      <div className="px-8 py-8 space-y-7">
        <StatCards
          newRequestsCount={openRequests.length}
          todayCount={todayBookings.length}
          weekCount={weekBookings.length}
          completedCount={completedCount}
        />

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <NewRequestsList
              items={openRequests.slice(0, 5).map((r) => ({
                id: r.id,
                patientAge: r.patientAge,
                patientGender: r.patientGender,
                caseDescription: r.caseDescription,
                createdAt: r.createdAt.toISOString(),
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
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-gray-400 shrink-0"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
