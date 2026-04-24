"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPatient, timeAgo } from "./utils";
import {
  ProposalModal,
  type RequestForProposal,
} from "@/components/ProposalModal";

export type RequestItem = {
  id: string;
  patientAge: number | null;
  patientGender: "male" | "female" | "other" | "unknown" | null;
  caseDescription: string;
  createdAt: string; // ISO string — serialisable across the server/client boundary
  proposalStatus: "pending" | "accepted" | "rejected" | null;
};

export function NewRequestsList({ items }: { items: RequestItem[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<RequestItem | null>(null);

  const handleSuccess = useCallback(() => {
    setSelected(null);
    router.refresh();
  }, [router]);

  return (
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">New requests</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Click to propose a timeslot
          </p>
        </div>
        <Link
          href="/requests"
          className="text-xs font-medium text-brand-600 hover:text-brand-800 transition-colors"
        >
          View all →
        </Link>
      </div>

      <div className="bg-brand-50 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-400">
              No new requests at this time.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setSelected(item)}
                  className="w-full text-left flex items-center gap-4 px-6 py-5 hover:bg-brand-50 transition-colors group"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-brand-600">
                      {item.patientAge ?? "?"}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatPatient(item.patientAge, item.patientGender)}
                    </p>
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {item.caseDescription}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {timeAgo(new Date(item.createdAt))}
                    </p>
                  </div>

                  {/* Proposal badge + chevron */}
                  <div className="flex items-center gap-2 shrink-0">
                    <ProposalBadge status={item.proposalStatus} />
                    <ChevronIcon />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <ProposalModal
          request={selected as RequestForProposal}
          onClose={() => setSelected(null)}
          onSuccess={handleSuccess}
        />
      )}
    </section>
  );
}

function ProposalBadge({ status }: { status: RequestItem["proposalStatus"] }) {
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

function ChevronIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-gray-300 shrink-0"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
