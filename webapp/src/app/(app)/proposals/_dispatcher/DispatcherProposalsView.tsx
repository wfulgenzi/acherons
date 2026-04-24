"use client";

import { useState } from "react";
import { TableList, type TableColumn } from "@/components/TableList";

export type DispatcherProposalRow = {
  id: string;
  requestId: string;
  requestShortId: string;
  patientAge: number | null;
  patientGender: "male" | "female" | "other" | "unknown" | null;
  caseDescription: string;
  clinicName: string;
  proposedStart: string | null;
  proposedEnd: string | null;
  status: "pending" | "accepted" | "rejected";
  submittedAt: string;
};

type StatusFilter = "pending" | "accepted" | "rejected";

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Declined" },
];

const columns: TableColumn<DispatcherProposalRow>[] = [
  {
    key: "clinic",
    label: "Clinic",
    render: (row) => (
      <p className="text-sm font-semibold text-brand-800">{row.clinicName}</p>
    ),
  },
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
];

export function DispatcherProposalsView({
  data,
}: {
  data: DispatcherProposalRow[];
}) {
  const [activeTab, setActiveTab] = useState<StatusFilter>("pending");

  const counts: Record<StatusFilter, number> = {
    pending: data.filter((r) => r.status === "pending").length,
    accepted: data.filter((r) => r.status === "accepted").length,
    rejected: data.filter((r) => r.status === "rejected").length,
  };

  const filtered = data.filter((r) => r.status === activeTab);

  return (
    <div className="flex-1 min-h-screen">
      <header className="bg-brand-50 border-b border-brand-200 px-8 py-6 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900">Proposals</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Clinic proposals for your open requests.
        </p>
      </header>

      <div className="px-8 py-8 space-y-6">
        {/* Status tabs */}
        <div className="flex items-center gap-2">
          {STATUS_TABS.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                  active
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-brand-50 text-gray-500 border-gray-200 hover:border-brand-300 hover:text-brand-800"
                }`}
              >
                {tab.label}
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                    active
                      ? "bg-white/20 text-white"
                      : counts[tab.key] > 0
                        ? "bg-brand-100 text-brand-800"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {counts[tab.key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Table */}
        <TableList
          columns={columns}
          data={filtered}
          getRowHref={(row) => `/requests/${row.requestId}`}
          emptyMessage={`No ${activeTab} proposals.`}
        />
      </div>
    </div>
  );
}

function genderInitial(g: DispatcherProposalRow["patientGender"]) {
  return g === "male" ? "M" : g === "female" ? "F" : "?";
}
