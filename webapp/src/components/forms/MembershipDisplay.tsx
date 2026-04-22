"use client";

import { useState } from "react";

export type CurrentMembership = {
  orgId: string;
  orgName: string;
  orgType: "clinic" | "dispatch";
  role: "member" | "admin";
};

interface Props {
  membership: CurrentMembership;
  onRemove: () => Promise<void>;
}

export function MembershipDisplay({ membership, onRemove }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    if (!window.confirm("Remove this user's organisation membership?")) return;
    setLoading(true);
    await onRemove();
    setLoading(false);
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-900">{membership.orgName}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              membership.orgType === "clinic"
                ? "bg-blue-50 text-blue-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {membership.orgType.charAt(0).toUpperCase() + membership.orgType.slice(1)}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
            {membership.role.charAt(0).toUpperCase() + membership.role.slice(1)}
          </span>
        </div>
      </div>
      <button
        onClick={handleRemove}
        disabled={loading}
        className="text-xs font-medium text-red-600 hover:text-red-700 disabled:text-gray-300 transition-colors"
      >
        {loading ? "Removing…" : "Remove membership"}
      </button>
    </div>
  );
}
