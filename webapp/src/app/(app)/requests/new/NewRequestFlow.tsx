"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { OpeningHours } from "@/db/schema";
import { PatientForm, type PatientData } from "./PatientForm";
import { ClinicSelector } from "./ClinicSelector";

export type ClinicItem = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  openingHours: OpeningHours | null;
};

type Stage = 1 | 2;

const DRAFT_KEY = "acherons:new-request-draft";
const DRAFT_TTL_MS = 60 * 60 * 1000; // 1 hour

type Draft = {
  patientData: Partial<PatientData>;
  selectedClinicIds: string[];
  savedAt: string; // ISO
};

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft: Draft = JSON.parse(raw);
    const age = Date.now() - new Date(draft.savedAt).getTime();
    if (age > DRAFT_TTL_MS) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

function saveDraft(patientData: Partial<PatientData>, selectedClinicIds: string[]) {
  try {
    const draft: Draft = { patientData, selectedClinicIds, savedAt: new Date().toISOString() };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch { /* storage full or unavailable */ }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
}

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 minute ago";
  if (mins < 60) return `${mins} minutes ago`;
  return "over an hour ago";
}

interface Props {
  clinics: ClinicItem[];
}

export function NewRequestFlow({ clinics }: Props) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>(1);

  // Persisted form state — survives stage switches and restores from draft
  const [patientData, setPatientData] = useState<Partial<PatientData>>({});
  const [selectedClinicIds, setSelectedClinicIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  // Incrementing key forces PatientForm to remount (re-initialise from initialData)
  // when a draft is restored or the form is explicitly reset.
  const [formKey, setFormKey] = useState(0);

  // Whether the user has any data worth warning about
  const hasData =
    !!patientData.description ||
    !!patientData.postcode ||
    !!patientData.age ||
    selectedClinicIds.length > 0;

  // Whether stage 1 data is complete enough to advance
  const canAdvanceToStage2 =
    patientData.age != null &&
    patientData.age >= 0 &&
    patientData.age <= 150 &&
    !!patientData.postcode?.trim() &&
    !!patientData.description?.trim();

  // ── On mount: check for a saved draft ───────────────────────────────────────
  // useState initialiser runs once — safe alternative to a setState-in-effect
  const [draftBanner, setDraftBanner] = useState<Draft | null>(() => {
    // Only runs on the client (this is a client component)
    if (typeof window === "undefined") return null;
    const draft = loadDraft();
    if (draft && (draft.patientData.description || draft.patientData.postcode)) {
      return draft;
    }
    return null;
  });

  // ── beforeunload: warn on browser close/refresh when there's data ──────────
  useEffect(() => {
    if (!hasData) return;
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasData]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handleRestoreDraft() {
    if (!draftBanner) return;
    setPatientData(draftBanner.patientData);
    setSelectedClinicIds(draftBanner.selectedClinicIds);
    setFormKey((k) => k + 1); // force PatientForm to remount with new initialData
    setDraftBanner(null);
  }

  function handleDiscardDraft() {
    clearDraft();
    setDraftBanner(null);
    setFormKey((k) => k + 1); // remount with empty initialData
  }

  function handlePatientInProgressChange(partial: Partial<PatientData>) {
    setPatientData(partial);
    saveDraft(partial, selectedClinicIds);
  }

  function handlePatientNext(data: PatientData) {
    setPatientData(data);
    saveDraft(data, selectedClinicIds);
    setStage(2);
  }

  function handleClinicSelectionChange(ids: string[]) {
    setSelectedClinicIds(ids);
    saveDraft(patientData, ids);
  }

  const handleDispatch = useCallback(async (clinicIds: string[]) => {
    const pd = patientData as PatientData;
    if (!pd.gender || !pd.age || !pd.postcode || !pd.description) return;
    setSubmitting(true);

    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientGender: pd.gender,
        patientAge: pd.age,
        postcode: pd.postcode,
        caseDescription: pd.description,
        clinicIds,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to create request.");
      return;
    }

    clearDraft();
    router.push("/dashboard");
    router.refresh();
  }, [patientData, router]);

  return (
    <div className="flex-1 min-h-screen">
      {/* Page header */}
      <header className="bg-brand-50 border-b border-brand-200 px-8 py-6">
        <h1 className="text-xl font-bold text-gray-900">New request</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {stage === 1
            ? "Step 1 — Patient information"
            : "Step 2 — Choose clinics to dispatch to"}
        </p>
      </header>

      <div className="px-8 py-8">
        {/* Draft restore banner */}
        {draftBanner && (
          <div className="mb-6 flex items-center justify-between gap-4 bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-4">
            <div className="flex items-center gap-3">
              <DraftIcon />
              <div>
                <p className="text-sm font-semibold text-yellow-800">
                  Unsaved draft found
                </p>
                <p className="text-xs text-yellow-600 mt-0.5">
                  Saved {timeAgo(draftBanner.savedAt)}
                  {draftBanner.patientData.postcode
                    ? ` · postcode ${draftBanner.patientData.postcode}`
                    : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDiscardDraft}
                className="text-xs font-medium text-yellow-700 hover:text-yellow-900 transition-colors px-3 py-1.5"
              >
                Start fresh
              </button>
              <button
                onClick={handleRestoreDraft}
                className="text-xs font-semibold bg-yellow-700 hover:bg-yellow-800 text-white px-4 py-1.5 rounded-xl transition-colors"
              >
                Resume draft
              </button>
            </div>
          </div>
        )}

        {/* Step indicator */}
        <StepIndicator
          stage={stage}
          onBack={() => setStage(1)}
          onAdvance={() => setStage(2)}
          canAdvance={canAdvanceToStage2}
        />

        <div className="mt-8">
          {stage === 1 ? (
            <PatientForm
              key={formKey}
              onNext={handlePatientNext}
              initialData={patientData}
              onInProgressChange={handlePatientInProgressChange}
            />
          ) : (
            <ClinicSelector
              clinics={clinics}
              postcode={(patientData as PatientData).postcode}
              onDispatch={handleDispatch}
              submitting={submitting}
              initialSelectedIds={selectedClinicIds}
              onSelectionChange={handleClinicSelectionChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StepIndicator({
  stage,
  onBack,
  onAdvance,
  canAdvance,
}: {
  stage: Stage;
  onBack: () => void;
  onAdvance: () => void;
  canAdvance: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      {/* Step 1 */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-brand-600 text-white">
          {stage === 2 ? <CheckIcon /> : "1"}
        </div>
        <button
          onClick={stage === 2 ? onBack : undefined}
          className={`text-sm font-semibold ${
            stage === 1
              ? "text-brand-800"
              : "text-brand-600 hover:underline cursor-pointer"
          }`}
        >
          Patient
        </button>
      </div>

      <div className="w-10 h-px border-t-2 border-dashed border-brand-200" />

      {/* Step 2 */}
      <div className="flex items-center gap-2">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border-2 transition-colors ${
            stage === 2
              ? "bg-brand-600 text-white border-brand-600"
              : canAdvance
              ? "bg-brand-50 text-brand-600 border-brand-400 cursor-pointer"
              : "bg-brand-50 text-brand-300 border-brand-200"
          }`}
          onClick={stage === 1 && canAdvance ? onAdvance : undefined}
        >
          2
        </div>
        <button
          onClick={stage === 1 && canAdvance ? onAdvance : undefined}
          disabled={stage === 1 && !canAdvance}
          className={`text-sm font-semibold transition-colors ${
            stage === 2
              ? "text-brand-800"
              : canAdvance
              ? "text-brand-600 hover:underline cursor-pointer"
              : "text-gray-400 cursor-not-allowed"
          }`}
        >
          Clinics
        </button>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function DraftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600 shrink-0">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  );
}
