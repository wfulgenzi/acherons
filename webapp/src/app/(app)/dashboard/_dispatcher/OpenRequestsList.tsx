export type OpenRequestItem = {
  id: string;
  patientAge: number | null;
  patientGender: "male" | "female" | "other" | "unknown" | null;
  caseDescription: string;
  postcode: string;
  clinicsContacted: number;
  proposalCount: number;
  createdAt: Date;
};

import Link from "next/link";

export function OpenRequestsList({ items }: { items: OpenRequestItem[] }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-base font-bold text-gray-900">Open requests</h2>
        <Link href="/requests" className="text-xs font-medium text-brand-600 hover:text-brand-800 transition-colors">
          All requests →
        </Link>
      </div>

      <div className="bg-brand-50 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-400">No open requests.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {items.map((item) => {
              const genderInitial =
                item.patientGender === "male" ? "M"
                : item.patientGender === "female" ? "F"
                : "?";
              const ageStr = item.patientAge != null ? `${item.patientAge}y` : "?";

              return (
                <li key={item.id}>
                <Link
                  href={`/requests/${item.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-brand-50 transition-colors"
                >
                  {/* Compact patient shorthand */}
                  <div className="shrink-0 w-14">
                    <p className="text-xs font-bold text-brand-800 leading-none">
                      {genderInitial}·{ageStr}
                    </p>
                  </div>

                  {/* Case + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {item.caseDescription}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Postcode {item.postcode} · {item.clinicsContacted} clinic
                      {item.clinicsContacted !== 1 ? "s" : ""} contacted
                    </p>
                  </div>

                  {/* Proposal count badge */}
                  {item.proposalCount > 0 && (
                    <span className="shrink-0 text-xs font-semibold bg-brand-100 text-brand-800 px-2.5 py-1 rounded-full">
                      {item.proposalCount} proposal{item.proposalCount !== 1 ? "s" : ""}
                    </span>
                  )}

                  <ChevronIcon />
                </Link>
              </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function ChevronIcon() {
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
      className="text-gray-300 shrink-0"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
