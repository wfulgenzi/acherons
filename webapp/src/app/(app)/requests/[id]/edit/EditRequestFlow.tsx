"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SetPageHeader } from "@/lib/page-header-context";
import type { OpeningHours } from "@/db/schema";
import { ClinicSelector } from "../../new/ClinicSelector";

export type EditClinicItem = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  openingHours: OpeningHours | null;
};

interface Props {
  requestId: string;
  initialDescription: string;
  initialSelectedClinicIds: string[];
  postcode: string;
  clinics: EditClinicItem[];
}

export function EditRequestFlow({
  requestId,
  initialDescription,
  initialSelectedClinicIds,
  postcode,
  clinics,
}: Props) {
  const router = useRouter();
  const [description, setDescription] = useState(initialDescription);
  const [submitting, setSubmitting] = useState(false);
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const headerActions = useMemo(
    () => (
      <button
        type="button"
        onClick={handleBack}
        className="shrink-0 text-sm text-gray-500 transition-colors hover:text-brand-800"
      >
        ← Cancel
      </button>
    ),
    [handleBack],
  );

  async function handleSave(selectedClinicIds: string[]) {
    setSubmitting(true);
    const res = await fetch(`/api/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caseDescription: description.trim(),
        clinicIds: selectedClinicIds,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "Failed to save.");
      return;
    }
    router.push(`/requests/${requestId}`);
    router.refresh();
  }

  return (
    <div className="flex-1 min-h-screen">
      <SetPageHeader
        title="Edit request"
        subtitle="Update the description and clinic selection"
        actions={headerActions}
      />

      <div className="px-8 py-8 space-y-6 max-w-5xl">
        {/* Description card */}
        <div className="bg-brand-50 rounded-2xl border border-gray-100 shadow-sm p-6">
          <label className="block text-sm font-medium text-gray-600 mb-3">
            Description of the issue
          </label>
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/10 transition resize-none"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            {description.length} characters
          </p>
        </div>

        {/* Clinic selector — reused from New Request, pre-filled */}
        <ClinicSelector
          clinics={clinics}
          postcode={postcode}
          onDispatch={handleSave}
          submitting={submitting}
          initialSelectedIds={initialSelectedClinicIds}
        />
      </div>
    </div>
  );
}
