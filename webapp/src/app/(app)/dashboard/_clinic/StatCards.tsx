type Props = {
  newRequestsCount: number;
  todayCount: number;
  weekCount: number;
  completedCount: number;
};

export function StatCards({
  newRequestsCount,
  todayCount,
  weekCount,
  completedCount,
}: Props) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        value={newRequestsCount}
        label="New requests"
        sub="awaiting your response"
        accent={newRequestsCount > 0}
        icon={<InboxIcon />}
      />
      <StatCard
        value={todayCount}
        label="Today"
        sub="appointments"
        icon={<TodayIcon />}
      />
      <StatCard
        value={weekCount}
        label="This week"
        sub="upcoming bookings"
        icon={<CalendarIcon />}
      />
      <StatCard
        value={completedCount}
        label="Completed"
        sub="last 14 days"
        icon={<CheckIcon />}
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
    <div className="bg-brand-50 rounded-2xl p-6 border border-gray-100 shadow-sm flex items-start justify-between gap-3">
      <div>
        <p
          className={`text-5xl font-bold tracking-tight leading-none ${
            accent ? "text-brand-600" : "text-brand-800"
          }`}
        >
          {value}
        </p>
        <p className="text-sm font-medium text-brand-800 mt-3">{label}</p>
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

function TodayIcon() {
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

function CalendarIcon() {
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
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function CheckIcon() {
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
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
