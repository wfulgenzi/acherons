"use client";

import { useState } from "react";
import { Combobox, type ComboboxOption } from "@/components/Combobox";

export type OrgOption = {
  id: string;
  name: string;
  type: "clinic" | "dispatch";
};

interface Props {
  allOrgs: OrgOption[];
  onAssign: (orgId: string, role: "member" | "admin") => Promise<void>;
  onCancel: () => void;
}

export function AssignOrgForm({ allOrgs, onAssign, onCancel }: Props) {
  const [typeFilter, setTypeFilter] = useState<"all" | "clinic" | "dispatch">(
    "all",
  );
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<"member" | "admin">(
    "member",
  );
  const [loading, setLoading] = useState(false);

  const comboOptions: ComboboxOption[] = allOrgs
    .filter((o) => typeFilter === "all" || o.type === typeFilter)
    .map((o) => ({
      id: o.id,
      label: o.name,
      meta: o.type.charAt(0).toUpperCase() + o.type.slice(1),
    }));

  function handleTypeFilter(t: "all" | "clinic" | "dispatch") {
    setTypeFilter(t);
    setSelectedOrgId(null); // reset selection when filter changes
  }

  async function handleSubmit() {
    if (!selectedOrgId) {
      return;
    }
    setLoading(true);
    await onAssign(selectedOrgId, selectedRole);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {/* Type filter */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
          Type
        </label>
        <div className="flex gap-2">
          {(["all", "clinic", "dispatch"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                typeFilter === t
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-brand-50 text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Organisation combobox */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
          Organisation
        </label>
        <Combobox
          options={comboOptions}
          value={selectedOrgId}
          onChange={setSelectedOrgId}
          placeholder="Select an organisation…"
          searchPlaceholder="Search organisations…"
        />
      </div>

      {/* Role */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
          Role
        </label>
        <div className="flex gap-2">
          {(["member", "admin"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setSelectedRole(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                selectedRole === r
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-brand-50 text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleSubmit}
          disabled={!selectedOrgId || loading}
          className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors px-4 py-2 rounded-lg"
        >
          {loading ? "Assigning…" : "Assign"}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="text-sm text-gray-500 hover:text-gray-700 px-2 py-2 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
