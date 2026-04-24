"use client";

import { TableList, type TableColumn } from "@/components/TableList";
import type { ClinicBookingItem } from "./types";

const columns: TableColumn<ClinicBookingItem>[] = [
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
];

export function BookingsList({ items }: { items: ClinicBookingItem[] }) {
  return (
    <TableList columns={columns} data={items} emptyMessage="No bookings yet." />
  );
}

function genderInitial(g: ClinicBookingItem["patientGender"]) {
  return g === "male" ? "M" : g === "female" ? "F" : "?";
}
