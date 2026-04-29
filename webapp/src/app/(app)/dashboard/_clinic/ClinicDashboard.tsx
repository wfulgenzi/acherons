import { SetPageHeader } from "@/lib/page-header-context";
import type { ClinicDashboardViewProps } from "@/server/dashboard/load-dashboard-page";
import { StatCards } from "./StatCards";
import { NewRequestsList } from "./NewRequestsList";
import { UpcomingBookings } from "./UpcomingBookings";
import { TodaySchedule } from "./TodaySchedule";
import { RecentActivity } from "./RecentActivity";

export function ClinicDashboard({
  headerTitle,
  headerSubtitle,
  statCards,
  newRequestsItems,
  upcomingBookingsItems,
  todayScheduleItems,
  recentActivityItems,
}: ClinicDashboardViewProps) {
  return (
    <div className="flex-1 min-h-screen">
      <SetPageHeader title={headerTitle} subtitle={headerSubtitle} />

      <div className="px-8 py-8 space-y-7">
        <StatCards
          newRequestsCount={statCards.newRequestsCount}
          todayCount={statCards.todayCount}
          weekCount={statCards.weekCount}
          completedCount={statCards.completedCount}
        />

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <NewRequestsList items={newRequestsItems} />
            <UpcomingBookings items={upcomingBookingsItems} />
          </div>

          <div className="space-y-4">
            <TodaySchedule items={todayScheduleItems} />
            <RecentActivity items={recentActivityItems} />
          </div>
        </div>
      </div>
    </div>
  );
}
