"use client";

import { useState, useEffect } from "react";

export type RequestForProposal = {
  id: string;
  patientAge: number | null;
  patientGender: "male" | "female" | "other" | "unknown" | null;
  caseDescription: string;
};

interface Props {
  request: RequestForProposal;
  onClose: () => void;
  onSuccess: () => void;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function ProposalModal({ request, onClose, onSuccess }: Props) {
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!date || !time || duration <= 0) {
      setError("Please fill in all fields.");
      return;
    }

    const startDate = new Date(`${date}T${time}:00`);
    const endDate = new Date(startDate.getTime() + duration * 60_000);

    setSubmitting(true);
    const res = await fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId: request.id,
        proposedTimeslots: [
          { start: startDate.toISOString(), end: endDate.toISOString() },
        ],
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Failed to send proposal.");
      return;
    }

    onSuccess();
  }

  const genderLabel =
    request.patientGender === "male" ? "Male"
    : request.patientGender === "female" ? "Female"
    : request.patientGender === "other" ? "Other"
    : "Unknown";

  const patientSummary = [
    genderLabel,
    request.patientAge != null ? `${request.patientAge}y` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Modal */}
      <div className="bg-brand-50 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-8 pt-8 pb-5">
          <div>
            <h2 className="text-lg font-bold text-brand-800">Propose a slot</h2>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              The dispatcher will review and accept the proposed time on the patient&apos;s behalf.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-brand-800 transition-colors mt-0.5 shrink-0 ml-4"
          >
            <XIcon />
          </button>
        </div>

        {/* Patient summary card */}
        <div className="mx-8 mb-6 bg-brand-50 border border-brand-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <PersonIcon />
            <span className="text-sm font-semibold text-brand-800">{patientSummary}</span>
          </div>
          <p className="text-sm font-bold text-gray-900 leading-snug mb-1">
            {request.caseDescription.length > 80
              ? request.caseDescription.slice(0, 80) + "…"
              : request.caseDescription}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                <span className="flex items-center gap-1.5">
                  <CalendarIcon />
                  Date
                </span>
              </label>
              <input
                type="date"
                value={date}
                min={todayISO()}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/10 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                <span className="flex items-center gap-1.5">
                  <ClockIcon />
                  Time
                </span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/10 transition"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={duration}
              min={5}
              max={480}
              step={5}
              onChange={(e) => setDuration(Number(e.target.value))}
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/10 transition"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-gray-500 hover:text-brand-800 transition-colors px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-brand-600 hover:bg-brand-800 disabled:bg-brand-300 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              {submitting ? "Sending…" : "Send proposal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function PersonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-500 shrink-0">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
