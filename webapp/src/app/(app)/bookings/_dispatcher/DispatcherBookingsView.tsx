"use client";

import { useState } from "react";
import { TableList, type TableColumn } from "@/components/TableList";

export type BookingRow = {
  id: string;
  requestId: string;
  confirmedStart: string;
  confirmedEnd: string;
  patientAge: number | null;
  patientGender: "male" | "female" | "other" | "unknown" | null;
  caseDescription: string;
  clinicName: string;
};

type TimeFilter = "upcoming" | "past";

const columns: TableColumn<BookingRow>[] = [
  {
    key: "datetime",
    label: "Date & Time",
    render: (row) => {
      const start = new Date(row.confirmedStart);
      const end = new Date(row.confirmedEnd);
      const mins = Math.round((end.getTime() - start.getTime()) / 60_000);
      return (
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {start.toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {start.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {" · "}
            {mins} min
          </p>
        </div>
      );
    },
  },
  {
    key: "patient",
    label: "Patient",
    render: (row) => (
      <p className="text-sm font-semibold text-brand-800">
        {genderInitial(row.patientGender)} ·{" "}
        {row.patientAge != null ? `${row.patientAge}y` : "?"}
      </p>
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
    key: "clinic",
    label: "Clinic",
    render: (row) => <p className="text-sm text-gray-700">{row.clinicName}</p>,
  },
];

interface Props {
  data: BookingRow[];
  today: string; // ISO
}

export function DispatcherBookingsView({ data, today }: Props) {
  const [filter, setFilter] = useState<TimeFilter>("upcoming");
  const nowMs = new Date(today).getTime();

  const filtered = data.filter((r) =>
    filter === "upcoming"
      ? new Date(r.confirmedStart).getTime() >= nowMs
      : new Date(r.confirmedStart).getTime() < nowMs,
  );

  // Upcoming: ascending (soonest first). Past: descending (most recent first).
  const sorted = [...filtered].sort((a, b) => {
    const diff =
      new Date(a.confirmedStart).getTime() -
      new Date(b.confirmedStart).getTime();
    return filter === "upcoming" ? diff : -diff;
  });

  const upcomingCount = data.filter(
    (r) => new Date(r.confirmedStart).getTime() >= nowMs,
  ).length;
  const pastCount = data.length - upcomingCount;

  return (
    <div className="flex-1 min-h-screen">
      <header className="bg-brand-50 border-b border-brand-200 px-8 py-6 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900">Bookings</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Confirmed appointments across all clinics.
        </p>
      </header>

      <div className="px-8 py-8 space-y-6">
        <TimeFilterTabs
          filter={filter}
          onFilter={setFilter}
          upcomingCount={upcomingCount}
          pastCount={pastCount}
        />
        <TableList
          columns={columns}
          data={sorted}
          emptyMessage={`No ${filter} bookings.`}
        />
      </div>
    </div>
  );
}

function TimeFilterTabs({
  filter,
  onFilter,
  upcomingCount,
  pastCount,
}: {
  filter: TimeFilter;
  onFilter: (f: TimeFilter) => void;
  upcomingCount: number;
  pastCount: number;
}) {
  const tabs: { key: TimeFilter; label: string; count: number }[] = [
    { key: "upcoming", label: "Upcoming", count: upcomingCount },
    { key: "past", label: "Past", count: pastCount },
  ];
  return (
    <div className="flex items-center gap-2">
      {tabs.map((tab) => {
        const active = tab.key === filter;
        return (
          <button
            key={tab.key}
            onClick={() => onFilter(tab.key)}
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
                  : tab.count > 0
                    ? "bg-brand-100 text-brand-800"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function genderInitial(g: BookingRow["patientGender"]) {
  return g === "male" ? "M" : g === "female" ? "F" : "?";
}
