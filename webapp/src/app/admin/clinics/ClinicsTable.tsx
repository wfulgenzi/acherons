"use client";

import { TableList, type TableColumn } from "@/components/TableList";
import { Badge } from "@/components/ui/Badge";

export type ClinicRow = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  specialisations: string[] | null;
  memberCount: number;
  createdAt: string;
};

const columns: TableColumn<ClinicRow>[] = [
  {
    key: "name",
    label: "Name",
    render: (row) => (
      <span className="font-medium text-gray-900">{row.name}</span>
    ),
  },
  {
    key: "address",
    label: "Address",
    render: (row) => (
      <span className="text-gray-500">{row.address ?? "—"}</span>
    ),
  },
  {
    key: "phone",
    label: "Phone",
    render: (row) => (
      <span className="text-gray-500">{row.phone ?? "—"}</span>
    ),
  },
  {
    key: "specialisations",
    label: "Specialisations",
    render: (row) =>
      row.specialisations?.length ? (
        <div className="flex flex-wrap gap-1">
          {row.specialisations.slice(0, 3).map((s) => (
            <Badge key={s} variant="green">{s}</Badge>
          ))}
          {row.specialisations.length > 3 && (
            <span className="text-xs text-gray-400">
              +{row.specialisations.length - 3}
            </span>
          )}
        </div>
      ) : (
        <span className="text-gray-400">—</span>
      ),
  },
  {
    key: "memberCount",
    label: "Members",
    render: (row) => (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        {row.memberCount}
      </span>
    ),
  },
  {
    key: "createdAt",
    label: "Created",
    render: (row) =>
      new Date(row.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
  },
];

export function ClinicsTable({ data }: { data: ClinicRow[] }) {
  return (
    <TableList
      columns={columns}
      data={data}
      getRowHref={(row) => `/admin/clinics/${row.id}`}
      emptyMessage="No clinics yet. Create one to get started."
    />
  );
}
