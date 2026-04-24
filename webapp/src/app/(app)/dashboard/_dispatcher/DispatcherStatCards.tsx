type Props = {
  openRequestsCount: number;
  newProposalsCount: number;
  todayCount: number;
  pipelineCount: number;
};

export function DispatcherStatCards({
  openRequestsCount,
  newProposalsCount,
  todayCount,
  pipelineCount,
}: Props) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        value={openRequestsCount}
        label="Open requests"
        sub="awaiting proposals"
        accent={openRequestsCount > 0}
        icon={<InboxIcon />}
      />
      <StatCard
        value={newProposalsCount}
        label="New proposals"
        sub="needing your review"
        accent={newProposalsCount > 0}
        icon={<BellIcon />}
      />
      <StatCard
        value={todayCount}
        label="Today"
        sub="confirmed bookings"
        icon={<ClockIcon />}
      />
      <StatCard
        value={pipelineCount}
        label="This pipeline"
        sub="upcoming bookings"
        icon={<PipelineIcon />}
      />
    </div>
  );
}

function StatCard({
  value,
  label,
  sub,
  icon,
  accent,
}: {
  value: number;
  label: string;
  sub: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="bg-brand-50 rounded-2xl p-4 border border-gray-100 shadow-sm flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-brand-800 mb-1">{label}</p>
        <p
          className={`text-3xl font-bold tracking-tight leading-none ${
            accent ? "text-brand-600" : "text-brand-800"
          }`}
        >
          {value}
        </p>
        <p className="text-xs text-brand-500 mt-0.5">{sub}</p>
      </div>
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          accent ? "bg-brand-100 text-brand-600" : "bg-brand-50 text-brand-200"
        }`}
      >
        {icon}
      </div>
    </div>
  );
}

function InboxIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
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

function ClockIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function PipelineIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="8 12 12 8 16 12" />
      <line x1="12" y1="16" x2="12" y2="8" />
    </svg>
  );
}
