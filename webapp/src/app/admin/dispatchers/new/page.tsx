"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as v from "valibot";
import { Button } from "@/components/ui/Button";
import { CreateOrganisationSchema } from "@/lib/schemas/organisations";

export default function NewDispatcherPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [serverError, setServerError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNameError("");
    setServerError("");

    const form = new FormData(e.currentTarget);
    const raw = { name: form.get("name"), type: "dispatch" };

    const result = v.safeParse(CreateOrganisationSchema, raw);
    if (!result.success) {
      const flat = v.flatten(result.issues).nested ?? {};
      setNameError(flat.name?.[0] ?? "");
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
    router.push(`/admin/dispatchers/${org.id}`);
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link
          href="/admin/dispatchers"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back to dispatchers
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">
          New dispatcher
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-900">Details</h2>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">
              Name
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="Dispatcher name"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            {nameError && <p className="text-xs text-red-600">{nameError}</p>}
          </div>
        </div>

        {serverError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {serverError}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading} variant="primary" size="lg">
            {loading ? "Creating…" : "Create dispatcher"}
          </Button>
          <Link
            href="/admin/dispatchers"
            className="text-sm font-medium text-brand-500 hover:text-brand-800 px-3 py-2.5"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
