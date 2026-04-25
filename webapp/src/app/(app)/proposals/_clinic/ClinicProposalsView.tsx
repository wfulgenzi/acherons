"use client";

import { TableList, type TableColumn } from "@/components/TableList";

export type ProposalRow = {
  id: string;
  requestShortId: string;
  patientAge: number | null;
  patientGender: "male" | "female" | "other" | "unknown" | null;
  caseDescription: string;
  proposedStart: string | null; // ISO — first timeslot
  proposedEnd: string | null;
  status: "pending" | "accepted" | "rejected";
  submittedAt: string; // ISO
};

const columns: TableColumn<ProposalRow>[] = [
  {
    key: "request",
    label: "Request",
    render: (row) => (
      <div>
        <p className="text-xs font-semibold text-gray-400 leading-none">
          REQ-{row.requestShortId}
        </p>
        <p className="text-sm font-bold text-brand-800 mt-1 leading-none">
          {genderInitial(row.patientGender)} ·{" "}
          {row.patientAge != null ? `${row.patientAge}y` : "?"}
        </p>
      </div>
    ),
  },
  {
    key: "description",
    label: "Description",
    render: (row) => (
      <p className="text-sm text-gray-900 line-clamp-2 leading-snug">
        {row.caseDescription}
      </p>
    ),
  },
  {
    key: "proposed",
    label: "Proposed slot",
    render: (row) => {
      if (!row.proposedStart) {
        return <span className="text-xs text-gray-400">—</span>;
      }
      const start = new Date(row.proposedStart);
      const end = row.proposedEnd ? new Date(row.proposedEnd) : null;
      const durationMins = end
        ? Math.round((end.getTime() - start.getTime()) / 60_000)
        : null;
      return (
        <div>
          <p className="text-sm text-gray-900">
            {start.toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
            {", "}
            {start.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {durationMins != null && (
            <p className="text-xs text-gray-400 mt-0.5">{durationMins} min</p>
          )}
        </div>
      );
    },
  },
  {
    key: "submitted",
    label: "Submitted",
    render: (row) => {
      const d = new Date(row.submittedAt);
      return (
        <span className="text-xs text-gray-500">
          {d.toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })}
          {", "}
          {d.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      );
    },
  },
  {
    key: "status",
    label: "Status",
    render: (row) => <StatusBadge status={row.status} />,
  },
];

export function ClinicProposalsView({ data }: { data: ProposalRow[] }) {
  return (
    <div className="flex-1 min-h-screen">
      <header className="bg-brand-50 border-b border-brand-200 px-8 py-6 sticky top-14 z-10">
        <h1 className="text-xl font-bold text-gray-900">My Proposals</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Proposals you have submitted to dispatchers.
        </p>
      </header>

      <div className="px-8 py-8">
        <TableList
          columns={columns}
          data={data}
          emptyMessage="No proposals submitted yet."
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ProposalRow["status"] }) {
  if (status === "pending") {
    return (
      <span className="inline-flex text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
        Pending
      </span>
    );
  }
  if (status === "accepted") {
    return (
      <span className="inline-flex text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-100 text-brand-800 border border-brand-200">
        Accepted
      </span>
    );
  }
  return (
    <span className="inline-flex text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">
      Refused
    </span>
  );
}

function genderInitial(g: ProposalRow["patientGender"]) {
  return g === "male" ? "M" : g === "female" ? "F" : "?";
}
