"use client";

import { TableList, type TableColumn } from "@/components/TableList";

export type RequestRow = {
  id: string;
  shortId: string;
  patientAge: number | null;
  patientGender: "male" | "female" | "other" | "unknown" | null;
  caseDescription: string;
  postcode: string;
  creatorLabel: string;
  createdAt: string;
  clinicsContacted: number;
  proposalCount: number;
};

const columns: TableColumn<RequestRow>[] = [
  {
    key: "patient",
    label: "Ref / Patient",
    render: (row) => (
      <div>
        <p className="text-xs font-semibold text-gray-400 leading-none">
          REQ-{row.shortId}
        </p>
        <p className="text-sm font-bold text-brand-800 mt-1 leading-none">
          {genderInitial(row.patientGender)} · {row.patientAge != null ? `${row.patientAge}y` : "?"}
        </p>
      </div>
    ),
  },
  {
    key: "description",
    label: "Description",
    render: (row) => (
      <div>
        <p className="text-sm text-gray-900 line-clamp-2 leading-snug">
          {row.caseDescription}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Postcode {row.postcode}
          {row.creatorLabel ? ` · via ${firstNameInitial(row.creatorLabel)}` : ""}
        </p>
      </div>
    ),
  },
  {
    key: "created",
    label: "Created",
    render: (row) => {
      const d = new Date(row.createdAt);
      return (
        <span className="text-xs text-gray-500">
          {d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
          {", "}
          {d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
        </span>
      );
    },
  },
  {
    key: "clinics",
    label: "Clinics",
    render: (row) => (
      <span className="text-sm font-medium text-gray-700">{row.clinicsContacted}</span>
    ),
  },
  {
    key: "proposals",
    label: "Proposals",
    render: (row) => (
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
          row.proposalCount > 0
            ? "bg-brand-100 text-brand-800"
            : "bg-gray-100 text-gray-400"
        }`}
      >
        {row.proposalCount}
        <ChevronIcon />
      </span>
    ),
  },
];

export function DispatcherRequestsView({ data }: { data: RequestRow[] }) {
  return (
    <div className="flex-1 min-h-screen">
      <header className="bg-brand-50 border-b border-brand-200 px-8 py-6 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900">Requests</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Most recent first. Click a request to view proposals.
        </p>
      </header>

      <div className="px-8 py-8">
        <TableList
          columns={columns}
          data={data}
          getRowHref={(row) => `/requests/${row.id}`}
          emptyMessage="No open requests."
        />
      </div>
    </div>
  );
}

function genderInitial(g: RequestRow["patientGender"]) {
  return g === "male" ? "M" : g === "female" ? "F" : "?";
}

function firstNameInitial(name: string) {
  const parts = name.split(" ");
  return parts[0] + (parts[1] ? ` ${parts[1][0]}.` : "");
}

function ChevronIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
