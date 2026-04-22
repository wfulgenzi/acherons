"use client";

import { TableList, type TableColumn } from "./TableList";

export type OrgMemberRow = {
  userId: string;
  name: string | null;
  email: string;
  role: "member" | "admin";
  joinedAt: string;
};

const columns: TableColumn<OrgMemberRow>[] = [
  {
    key: "user",
    label: "User",
    render: (row) => (
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center shrink-0">
          {(row.name || row.email)[0].toUpperCase()}
        </div>
        <div>
          {row.name && (
            <p className="font-medium text-gray-900 leading-tight">{row.name}</p>
          )}
          <p className="text-xs text-gray-500">{row.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: "role",
    label: "Role",
    render: (row) => (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          row.role === "admin"
            ? "bg-blue-50 text-blue-700"
            : "bg-gray-100 text-gray-600"
        }`}
      >
        {row.role.charAt(0).toUpperCase() + row.role.slice(1)}
      </span>
    ),
  },
  {
    key: "joinedAt",
    label: "Joined",
    render: (row) =>
      new Date(row.joinedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
  },
];

export function OrgMembersTable({ data }: { data: OrgMemberRow[] }) {
  return (
    <TableList
      columns={columns}
      data={data}
      emptyMessage="No members assigned to this organisation yet."
    />
  );
}
