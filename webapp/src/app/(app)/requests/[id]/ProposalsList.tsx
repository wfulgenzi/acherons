"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProposedTimeslots } from "@/db/schema";

export type ProposalItem = {
  id: string;
  clinicName: string;
  status: "pending" | "accepted" | "rejected";
  notes: string | null;
  proposedTimeslots: ProposedTimeslots;
  createdAt: string;
};

const statusCfg = {
  pending: "bg-orange-50 text-orange-600 border-orange-200",
  accepted: "bg-brand-100 text-brand-800 border-brand-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
};

export function ProposalsList({
  items,
  requestId,
}: {
  items: ProposalItem[];
  requestId: string;
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleAction(proposalId: string, action: "accept" | "refuse") {
    setLoadingId(proposalId);
    const res = await fetch(`/api/proposals/${proposalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoadingId(null);

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "Action failed.");
      return;
    }
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-4 text-center">No proposals yet.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const firstSlot = item.proposedTimeslots?.[0];
        const slotLabel = firstSlot
          ? formatSlot(firstSlot.start, firstSlot.end)
          : null;
        const isPending = item.status === "pending";
        const isLoading = loadingId === item.id;

        return (
          <li
            key={item.id}
            className="bg-brand-100 border border-brand-200 rounded-xl px-5 py-4 flex items-center gap-4"
          >
            {/* Clinic + slot info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <ClinicIcon />
                <span className="text-sm font-semibold text-gray-900">
                  {item.clinicName}
                </span>
                {slotLabel && (
                  <>
                    <span className="text-brand-300">·</span>
                    <span className="text-xs text-gray-500">{slotLabel.date}</span>
                    <span className="text-brand-300">·</span>
                    <span className="text-xs font-medium text-brand-800">{slotLabel.time}</span>
                    {slotLabel.duration && (
                      <>
                        <span className="text-brand-300">·</span>
                        <span className="text-xs text-gray-500">{slotLabel.duration} min</span>
                      </>
                    )}
                  </>
                )}
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusCfg[item.status]}`}>
                  {item.status}
                </span>
              </div>
              {item.notes && (
                <p className="text-xs text-gray-400 mt-1 italic">&ldquo;{item.notes}&rdquo;</p>
              )}
              {item.proposedTimeslots.length > 1 && (
                <p className="text-xs text-brand-500 mt-1">
                  +{item.proposedTimeslots.length - 1} more timeslot{item.proposedTimeslots.length > 2 ? "s" : ""}
                </p>
              )}
            </div>

            {/* Actions — only for pending */}
            {isPending && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleAction(item.id, "refuse")}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-600 border border-brand-200 hover:border-red-200 bg-brand-50 rounded-xl px-3 py-2 transition-colors disabled:opacity-50"
                >
                  <XIcon />
                  Refuse
                </button>
                <button
                  onClick={() => handleAction(item.id, "accept")}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-800 rounded-xl px-4 py-2 transition-colors disabled:opacity-50"
                >
                  <CheckIcon />
                  {isLoading ? "…" : "Accept"}
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function formatSlot(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const duration = Math.round((e.getTime() - s.getTime()) / 60_000);
  return {
    date: s.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
    time: s.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    duration: duration > 0 ? duration : null,
  };
}

function ClinicIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-500 shrink-0">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
