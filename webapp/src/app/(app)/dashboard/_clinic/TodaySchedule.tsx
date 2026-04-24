import { formatTime, getDurationMins } from "./utils";

export type TodayItem = {
  id: string;
  confirmedStart: Date;
  confirmedEnd: Date;
  patientAge: number | null;
  caseDescription: string;
};

export function TodaySchedule({ items }: { items: TodayItem[] }) {
  return (
    <div className="bg-brand-50 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900">
          Today&apos;s schedule
        </h2>
        <button className="text-xs font-medium text-brand-600 hover:text-brand-800 transition-colors">
          Open calendar →
        </button>
      </div>

      {/* Timeline */}
      <div className="px-6 py-5">
        {items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            No appointments today.
          </p>
        ) : (
          <ul className="space-y-4">
            {items.map((item, i) => {
              const durationMins = getDurationMins(
                item.confirmedStart,
                item.confirmedEnd,
              );
              const isNow =
                item.confirmedStart <= new Date() &&
                new Date() < item.confirmedEnd;
              return (
                <li key={item.id} className="flex items-start gap-3">
                  {/* Time column */}
                  <div className="w-11 shrink-0 text-right">
                    <p
                      className={`text-sm font-bold ${
                        isNow ? "text-brand-600" : "text-brand-800"
                      }`}
                    >
                      {formatTime(item.confirmedStart)}
                    </p>
                    <p className="text-[11px] text-gray-400">{durationMins}m</p>
                  </div>

                  {/* Connector */}
                  <div className="flex flex-col items-center shrink-0 mt-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isNow ? "bg-brand-600" : "bg-brand-200"
                      }`}
                    />
                    {i < items.length - 1 && (
                      <div className="w-px flex-1 bg-gray-100 mt-1 min-h-[1.5rem]" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 pb-2">
                    <p className="text-sm font-semibold text-gray-900 leading-tight">
                      {item.patientAge
                        ? `${item.patientAge}y patient`
                        : "Patient"}
                      {isNow && (
                        <span className="ml-2 text-[10px] font-bold text-brand-600 bg-brand-100 px-1.5 py-0.5 rounded-full">
                          NOW
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {item.caseDescription}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
