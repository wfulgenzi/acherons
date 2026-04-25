import { withRLS } from "@/db/rls";
import { requestsRepo, proposalsRepo, bookingsRepo } from "@/db/repositories";
import { DispatcherStatCards } from "./DispatcherStatCards";
import { NewProposalsList, type ProposalCardItem } from "./NewProposalsList";
import { OpenRequestsList, type OpenRequestItem } from "./OpenRequestsList";
import { QuickActionCard } from "./QuickActionCard";

interface Props {
  orgId: string;
  orgName: string;
  userId: string;
  userName: string | null;
}

export async function DispatcherDashboard({ orgId, userId }: Props) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86_400_000);

  const [openRequests, pendingProposalRows, todayCount, pipelineCount] =
    await withRLS({ userId, orgId }, async (tx) =>
      Promise.all([
        requestsRepo.findOpenByDispatcher(tx, orgId),
        proposalsRepo.findPendingByDispatcher(tx, orgId, 6),
        bookingsRepo.countByDispatcherInWindow(tx, orgId, todayStart, todayEnd),
        bookingsRepo.countUpcomingByDispatcher(tx, orgId, now),
      ]),
    );

  const dateStr = now.toLocaleDateString("en-GB", {
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

  return (
    <div className="flex-1 min-h-screen">
      <header className="bg-brand-50 border-b border-brand-200 px-8 py-6 flex items-center justify-between sticky top-14 z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dispatcher hub</h1>
          <p className="text-sm text-gray-400 mt-0.5 capitalize">{dateStr}</p>
        </div>
      </header>

      <div className="px-8 py-8 space-y-7">
        <DispatcherStatCards
          openRequestsCount={openRequests.length}
          newProposalsCount={pendingProposalRows.length}
          todayCount={todayCount}
          pipelineCount={pipelineCount}
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
