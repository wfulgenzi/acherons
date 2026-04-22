import { formatPatient, timeAgo } from "./utils";

export type ActivityItem = {
  id: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
  patientAge: number | null;
  patientGender: "male" | "female" | "other" | "unknown" | null;
};

const statusConfig = {
  pending: { dot: "bg-amber-400", label: "Pending", badge: "bg-amber-50 text-amber-700" },
  accepted: { dot: "bg-brand-600", label: "Accepted", badge: "bg-brand-100 text-brand-800" },
  rejected: { dot: "bg-red-400", label: "Rejected", badge: "bg-red-50 text-red-600" },
};

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <div className="bg-brand-50 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-2">
        <TrendingIcon />
        <h2 className="text-sm font-bold text-gray-900">Recent activity</h2>
      </div>

      {/* List */}
      <div className="px-6 py-4">
        {items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            No recent proposals.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => {
              const cfg = statusConfig[item.status];
              return (
                <li key={item.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {formatPatient(item.patientAge, item.patientGender)}
                      </p>
                      <p className="text-xs text-gray-400">{timeAgo(item.createdAt)}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${cfg.badge}`}
                  >
                    {cfg.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function TrendingIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
