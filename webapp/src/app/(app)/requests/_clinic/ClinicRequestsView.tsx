"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ProposalModal,
  type RequestForProposal,
} from "@/components/ProposalModal";

export type ClinicRequestItem = {
  id: string;
  patientAge: number | null;
  patientGender: "male" | "female" | "other" | "unknown" | null;
  caseDescription: string;
  postcode: string;
  createdAt: string;
  creatorName: string | null;
  creatorEmail: string | null;
  proposalStatus: "pending" | "accepted" | "rejected" | null;
};

export function ClinicRequestsView({ items }: { items: ClinicRequestItem[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<ClinicRequestItem | null>(null);

  const handleSuccess = useCallback(() => {
    setSelected(null);
    router.refresh();
  }, [router]);

  return (
    <div className="flex-1 min-h-screen">
      <header className="bg-brand-50 border-b border-brand-200 px-8 py-6 sticky top-14 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">New Requests</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Propose a timeslot — the dispatcher confirms with the patient.
            </p>
          </div>
          {items.length > 0 && (
            <span className="bg-brand-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {items.length}
            </span>
          )}
        </div>
      </header>

      <div className="px-8 py-8">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm">No new requests right now.</p>
            <p className="text-gray-300 text-xs mt-1">Check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {items.map((item) => (
              <RequestCard
                key={item.id}
                item={item}
                onClick={() => setSelected(item)}
              />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <ProposalModal
          request={selected as RequestForProposal}
          onClose={() => setSelected(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}

function RequestCard({
  item,
  onClick,
}: {
  item: ClinicRequestItem;
  onClick: () => void;
}) {
  const genderShort =
    item.patientGender === "male"
      ? "M"
      : item.patientGender === "female"
        ? "F"
        : "?";

  const ageLabel = item.patientAge != null ? `${item.patientAge}y` : "?";
  const timeAgo = formatTimeAgo(new Date(item.createdAt));
  const creatorLabel = item.creatorName
    ? firstNameInitial(item.creatorName)
    : item.creatorEmail
      ? item.creatorEmail.split("@")[0]
      : null;

  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-brand-50 rounded-2xl border border-gray-100 shadow-sm hover:border-brand-300 hover:shadow-md transition-all duration-150 p-6"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-base font-bold text-brand-800">
            {genderShort}&thinsp;·&thinsp;{ageLabel}
          </p>
          <p className="text-sm font-medium text-gray-700 mt-0.5 leading-snug line-clamp-1">
            {item.caseDescription.length > 60
              ? item.caseDescription.slice(0, 60) + "…"
              : item.caseDescription}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ProposalBadge status={item.proposalStatus} />
          <span className="text-gray-300 group-hover:text-brand-500 transition-colors">
            <ChevronRightIcon />
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-400 flex items-center gap-1">
        <ClockIcon />
        {timeAgo}
        {creatorLabel && <span className="ml-1">· via {creatorLabel}</span>}
      </p>
    </button>
  );
}

function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function firstNameInitial(name: string) {
  const parts = name.trim().split(" ");
  return parts[0] + (parts[1] ? ` ${parts[1][0]}.` : "");
}

function ProposalBadge({
  status,
}: {
  status: ClinicRequestItem["proposalStatus"];
}) {
  if (!status) {
    return null;
  }
  if (status === "pending") {
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 whitespace-nowrap">
        Proposal sent
      </span>
    );
  }
  if (status === "accepted") {
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-100 text-brand-800 border border-brand-200 whitespace-nowrap">
        Accepted
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 whitespace-nowrap">
        Refused
      </span>
    );
  }
  return null;
}

function ChevronRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
