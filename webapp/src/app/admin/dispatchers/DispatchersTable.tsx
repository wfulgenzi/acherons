"use client";

import { TableList, type TableColumn } from "@/components/TableList";

export type DispatcherRow = {
  id: string;
  name: string;
  memberCount: number;
  createdAt: string;
};

const columns: TableColumn<DispatcherRow>[] = [
  {
    key: "name",
    label: "Name",
    render: (row) => (
      <span className="font-medium text-gray-900">{row.name}</span>
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

export function DispatchersTable({ data }: { data: DispatcherRow[] }) {
  return (
    <TableList
      columns={columns}
      data={data}
      getRowHref={(row) => `/admin/dispatchers/${row.id}`}
      emptyMessage="No dispatchers yet. Create one to get started."
    />
  );
}
