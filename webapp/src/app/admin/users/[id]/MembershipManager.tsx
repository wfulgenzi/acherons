"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MembershipDisplay,
  type CurrentMembership,
} from "@/components/forms/MembershipDisplay";
import { Button } from "@/components/ui/Button";
import {
  AssignOrgForm,
  type OrgOption,
} from "@/components/forms/AssignOrgForm";

// Re-export types so the server page only needs to import from here
export type { CurrentMembership, OrgOption };

interface Props {
  userId: string;
  membership: CurrentMembership | null;
  allOrgs: OrgOption[];
}

export function MembershipManager({ userId, membership, allOrgs }: Props) {
  const router = useRouter();
  const [assigning, setAssigning] = useState(false);

  async function handleRemove() {
    const res = await fetch(`/api/users/${userId}/membership`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "Failed to remove membership.");
      return;
    }
    router.refresh();
  }

  async function handleAssign(orgId: string, role: "member" | "admin") {
    const res = await fetch(`/api/users/${userId}/membership`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, role }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "Failed to assign membership.");
      return;
    }
    setAssigning(false);
    router.refresh();
  }

  if (membership) {
    return (
      <MembershipDisplay membership={membership} onRemove={handleRemove} />
    );
  }

  if (!assigning) {
    return (
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">No organisation assigned.</p>
        <Button size="sm" onClick={() => setAssigning(true)}>
          + Assign organisation
        </Button>
      </div>
    );
  }

  return (
    <AssignOrgForm
      allOrgs={allOrgs}
      onAssign={handleAssign}
      onCancel={() => setAssigning(false)}
    />
  );
}
