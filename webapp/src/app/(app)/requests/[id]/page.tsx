import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import {
  loadRequestDetailPageData,
  type ClinicOnRequest,
} from "@/server/requests/load-request-detail-page";
import { SetPageHeader } from "@/lib/page-header-context";
import { ProposalsList } from "./ProposalsList";
import { RequestClinicsMap } from "./RequestClinicsMap";
import type { OpeningHours } from "@/db/schema";

type RouteContext = { params: Promise<{ id: string }> };

export default async function RequestDetailPage({ params }: RouteContext) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const result = await loadRequestDetailPageData(session.user.id, id);
  if (result.kind === "redirect") {
    redirect(result.to);
  }
  if (result.kind === "notFound") {
    notFound();
  }

  const {
    requestId,
    req,
    clinics,
    proposalItems,
    pendingCount,
    shortId,
    creatorLabel,
    createdLabel,
    genderLabel,
  } = result;

  return (
    <div className="flex-1 min-h-screen">
      <SetPageHeader
        title={`REQ-${shortId}`}
        subtitle={`${genderLabel}${
          req.patientAge != null ? ` · ${req.patientAge} years` : ""
        } · postcode ${req.postcode}`}
      />

      <div className="px-8 py-8 space-y-6">
        <Link
          href="/requests"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-800 transition-colors"
        >
          <ChevronLeftIcon />
          All requests
        </Link>

        <div className="bg-brand-50 rounded-2xl border border-brand-200 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={req.status} />
              <p className="text-xs text-gray-400">
                Created {createdLabel} · by {creatorLabel}
              </p>
            </div>
            {req.status === "open" && (
              <Link
                href={`/requests/${requestId}/edit`}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-brand-800 border border-brand-200 hover:border-brand-300 rounded-xl px-3 py-2 transition-colors shrink-0"
              >
                <EditIcon />
                Edit clinics &amp; description
              </Link>
            )}
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {req.caseDescription}
          </p>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_300px] gap-5 items-stretch">
          <div className="bg-brand-50 rounded-2xl border border-brand-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-gray-900">
                Clinics on this request
              </h2>
              <span className="text-xs font-semibold bg-brand-100 text-brand-800 px-2.5 py-1 rounded-full border border-brand-200">
                {clinics.length} selected
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {clinics.map((clinic) => (
                <ClinicCard key={clinic.id} clinic={clinic} />
              ))}
              {clinics.length === 0 && (
                <p className="col-span-2 text-sm text-gray-400">
                  No clinics assigned.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden border border-brand-200 shadow-sm min-h-[220px]">
            <RequestClinicsMap clinics={clinics} />
          </div>
        </div>

        <div className="bg-brand-50 rounded-2xl border border-brand-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-sm font-bold text-gray-900">Proposals</h2>
            {proposalItems.length > 0 && (
              <span className="text-xs font-semibold bg-brand-100 text-brand-800 px-2.5 py-1 rounded-full border border-brand-200">
                {proposalItems.length} total · {pendingCount} pending
              </span>
            )}
          </div>
          <ProposalsList items={proposalItems} />
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ClinicCard({ clinic }: { clinic: ClinicOnRequest }) {
  const todaySlots = getTodaySlots(clinic.openingHours);
  return (
    <div className="border border-brand-200 rounded-xl p-4 bg-brand-100">
      <div className="flex items-start gap-2">
        <ClinicBuildingIcon />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight">
            {clinic.name}
          </p>
          {clinic.address && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {clinic.address}
            </p>
          )}
          {todaySlots.length > 0 && (
            <p className="text-xs text-brand-600 font-medium mt-1.5">
              Today: {todaySlots.map(([s, e]) => `${s} – ${e}`).join(" · ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    open: "bg-orange-50 text-orange-600 border-orange-200",
    confirmed: "bg-brand-100 text-brand-800 border-brand-200",
    cancelled: "bg-red-50 text-red-600 border-red-200",
  };
  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg[status] ?? cfg.open}`}
    >
      {status}
    </span>
  );
}

function getTodaySlots(hours: OpeningHours | null): [string, string][] {
  if (!hours) {
    return [];
  }
  const todayIdx = (new Date().getDay() + 6) % 7;
  return hours.find((d) => d.day === todayIdx)?.slots ?? [];
}

function ChevronLeftIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function EditIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function ClinicBuildingIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-brand-500 shrink-0 mt-0.5"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
