"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as v from "valibot";
import { Button } from "@/components/ui/Button";
import { CreateOrganisationSchema } from "@acherons/contracts";

type FieldErrors = Partial<Record<string, string[]>>;

export default function NewClinicPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setServerError("");

    const form = new FormData(e.currentTarget);

    const raw = {
      name: form.get("name"),
      type: "clinic",
      address: form.get("address") || undefined,
      phone: form.get("phone") || undefined,
      website: form.get("website") || undefined,
      mapsUrl: form.get("mapsUrl") || undefined,
      specialisations: form.get("specialisations")
        ? (form.get("specialisations") as string)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined,
    };

    const result = v.safeParse(CreateOrganisationSchema, raw);
    if (!result.success) {
      setErrors(v.flatten(result.issues).nested ?? {});
      return;
    }

    setLoading(true);
    const res = await fetch("/api/organisations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.output),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setServerError(data.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    const org = await res.json();
    router.push(`/admin/clinics/${org.id}`);
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link
          href="/admin/clinics"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back to clinics
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">New clinic</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-900">Details</h2>

          <Field label="Name" error={errors.name?.[0]}>
            <input
              name="name"
              type="text"
              required
              placeholder="Clinic name"
              className={inputClass}
            />
          </Field>

          <Field label="Address" error={errors.address?.[0]}>
            <input
              name="address"
              type="text"
              placeholder="123 Main St, City"
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone" error={errors.phone?.[0]}>
              <input
                name="phone"
                type="text"
                placeholder="+1 234 567 8900"
                className={inputClass}
              />
            </Field>
            <Field label="Website" error={errors.website?.[0]}>
              <input
                name="website"
                type="url"
                placeholder="https://example.com"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Google Maps URL" error={errors.mapsUrl?.[0]}>
            <input
              name="mapsUrl"
              type="url"
              placeholder="https://maps.google.com/..."
              className={inputClass}
            />
          </Field>

          <Field
            label="Specialisations"
            hint="Comma-separated, e.g. Cardiology, Neurology"
            error={errors.specialisations?.[0]}
          >
            <input
              name="specialisations"
              type="text"
              placeholder="Cardiology, Neurology, Orthopaedics"
              className={inputClass}
            />
          </Field>
        </div>

        {serverError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {serverError}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading} variant="primary" size="lg">
            {loading ? "Creating…" : "Create clinic"}
          </Button>
          <Link
            href="/admin/clinics"
            className="text-sm font-medium text-brand-500 hover:text-brand-800 px-3 py-2.5"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-700">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
