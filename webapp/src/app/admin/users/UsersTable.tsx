"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export type UserRow = {
  id: string;
  name: string | null;
  email: string;
  isAdmin: boolean;
  orgName: string | null;
  orgType: "clinic" | "dispatch" | null;
  membershipRole: "member" | "admin" | null;
  createdAt: string;
};

interface UsersTableProps {
  data: UserRow[];
  currentUserId: string;
}

export function UsersTable({ data, currentUserId }: UsersTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(row: UserRow) {
    if (
      !window.confirm(
        `Delete user "${row.name || row.email}"? This cannot be undone.`,
      )
    ) {
      return;
    }

    setDeletingId(row.id);
    const res = await fetch(`/api/users/${row.id}`, { method: "DELETE" });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to delete user.");
    } else {
      router.refresh(); // re-runs the server page to get updated data
    }

    setDeletingId(null);
  }

  return (
    <div className="bg-brand-50 border border-brand-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {["User", "Organisation", "Role", "Created", ""].map((h) => (
              <th
                key={h}
                className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-10 text-center text-sm text-gray-400"
              >
                No users found.
              </td>
            </tr>
          ) : (
            data.map((row) => {
              const isSelf = row.id === currentUserId;
              return (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  {/* User */}
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/admin/users/${row.id}`}
                      className="flex items-center gap-2.5 group"
                    >
                      <div className="w-7 h-7 rounded-full bg-brand-200 text-brand-800 text-xs font-semibold flex items-center justify-center shrink-0">
                        {(row.name || row.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-brand-800 group-hover:text-brand-vivid transition-colors">
                          {row.name ?? <span className="text-gray-400">—</span>}
                          {isSelf && (
                            <span className="ml-1.5 text-[10px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                              YOU
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">{row.email}</p>
                      </div>
                    </Link>
                  </td>

                  {/* Organisation */}
                  <td className="px-4 py-3.5">
                    {row.orgName ? (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-700">{row.orgName}</span>
                        <OrgTypeBadge type={row.orgType!} />
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">
                        No organisation
                      </span>
                    )}
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {row.isAdmin && <Badge variant="brand">Admin</Badge>}
                      {row.membershipRole && (
                        <Badge variant="muted">
                          {row.membershipRole.charAt(0).toUpperCase() +
                            row.membershipRole.slice(1)}
                        </Badge>
                      )}
                      {!row.isAdmin && !row.membershipRole && (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </div>
                  </td>

                  {/* Created */}
                  <td className="px-4 py-3.5 text-gray-500">
                    {new Date(row.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>

                  {/* Delete */}
                  <td className="px-4 py-3.5 text-right">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(row)}
                      disabled={isSelf || deletingId === row.id}
                      title={
                        isSelf
                          ? "You cannot delete your own account"
                          : "Delete user"
                      }
                    >
                      {deletingId === row.id ? "Deleting…" : "Delete"}
                    </Button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function OrgTypeBadge({ type }: { type: "clinic" | "dispatch" }) {
  return (
    <Badge variant={type === "clinic" ? "green" : "slate"}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
}
