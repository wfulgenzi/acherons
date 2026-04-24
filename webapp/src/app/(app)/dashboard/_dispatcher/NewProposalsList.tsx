import { formatPatient } from "../_clinic/utils";

export type ProposalCardItem = {
  id: string;
  clinicName: string;
  proposedAt: Date;
  patientAge: number | null;
  patientGender: "male" | "female" | "other" | "unknown" | null;
  caseDescription: string;
  // First proposed timeslot for preview
  firstSlotStart: Date | null;
};

export function NewProposalsList({ items }: { items: ProposalCardItem[] }) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">New proposals</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Accept to confirm with the patient, refuse to keep the request open.
          </p>
        </div>
        <button className="text-xs font-medium text-brand-600 hover:text-brand-800 transition-colors">
          View all →
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-brand-50 rounded-2xl border border-gray-100 shadow-sm px-6 py-12 text-center">
          <p className="text-sm text-gray-400">No new proposals to review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => (
            <ProposalCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

function ProposalCard({ item }: { item: ProposalCardItem }) {
  const dateLabel = item.firstSlotStart
    ? item.firstSlotStart.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }) +
      " · " +
      item.firstSlotStart.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : item.proposedAt.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });

  return (
    <div className="bg-brand-50 rounded-2xl border border-brand-200 shadow-sm p-5 flex flex-col gap-3 hover:border-brand-600/30 transition-colors cursor-pointer group">
      {/* Clinic + date */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ClinicIcon />
          <span className="text-xs font-semibold text-gray-600">
            {item.clinicName}
          </span>
        </div>
        <span className="text-xs text-gray-400 shrink-0">{dateLabel}</span>
      </div>

      {/* Patient + case */}
      <div>
        <p className="text-sm font-bold text-gray-900">
          {formatPatient(item.patientAge, item.patientGender)}
        </p>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-snug">
          {item.caseDescription}
        </p>
      </div>

      {/* CTA */}
      <button className="self-start text-xs font-semibold text-brand-600 group-hover:text-brand-800 transition-colors mt-auto">
        Open &amp; decide →
      </button>
    </div>
  );
}

function ClinicIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-gray-400 shrink-0"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
