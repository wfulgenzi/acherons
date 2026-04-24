import { formatTime, getDurationMins, formatPatient } from "./utils";

export type UpcomingBookingItem = {
  id: string;
  confirmedStart: Date;
  confirmedEnd: Date;
  patientAge: number | null;
  patientGender: "male" | "female" | "other" | "unknown" | null;
  caseDescription: string;
};

export function UpcomingBookings({ items }: { items: UpcomingBookingItem[] }) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-base font-bold text-gray-900">
          Upcoming this week
        </h2>
        <button className="text-xs font-medium text-brand-600 hover:text-brand-800 transition-colors">
          Calendar →
        </button>
      </div>

      <div className="bg-brand-50 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-400">
              No bookings scheduled this week.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {items.map((item) => {
              const durationMins = getDurationMins(
                item.confirmedStart,
                item.confirmedEnd,
              );
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-4 px-6 py-5 hover:bg-brand-50 transition-colors"
                >
                  {/* Date badge */}
                  <div className="w-12 shrink-0 text-center">
                    <div className="bg-brand-100 rounded-xl px-1 py-2">
                      <p className="text-[10px] font-semibold text-brand-500 uppercase leading-none">
                        {item.confirmedStart.toLocaleDateString("en-GB", {
                          weekday: "short",
                        })}
                      </p>
                      <p className="text-lg font-bold text-brand-800 leading-tight mt-0.5">
                        {item.confirmedStart.getDate()}
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatPatient(item.patientAge, item.patientGender)}
                    </p>
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {item.caseDescription}
                    </p>
                  </div>

                  {/* Time */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-700">
                      {formatTime(item.confirmedStart)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {durationMins}min
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
