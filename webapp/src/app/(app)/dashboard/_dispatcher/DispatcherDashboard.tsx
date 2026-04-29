import { SetPageHeader } from "@/lib/page-header-context";
import type { DispatcherDashboardViewProps } from "@/server/dashboard/load-dashboard-page";
import { DispatcherStatCards } from "./DispatcherStatCards";
import { NewProposalsList } from "./NewProposalsList";
import { OpenRequestsList } from "./OpenRequestsList";
import { QuickActionCard } from "./QuickActionCard";

export function DispatcherDashboard({
  headerSubtitle,
  statCards,
  proposalItems,
  openRequestItems,
}: DispatcherDashboardViewProps) {
  return (
    <div className="flex-1 min-h-screen">
      <SetPageHeader title="Dispatcher hub" subtitle={headerSubtitle} />

      <div className="px-8 py-8 space-y-7">
        <DispatcherStatCards
          openRequestsCount={statCards.openRequestsCount}
          newProposalsCount={statCards.newProposalsCount}
          todayCount={statCards.todayCount}
          pipelineCount={statCards.pipelineCount}
        />

        <NewProposalsList items={proposalItems} />

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <OpenRequestsList items={openRequestItems} />
          </div>
          <div>
            <QuickActionCard />
          </div>
        </div>
      </div>
    </div>
  );
}
