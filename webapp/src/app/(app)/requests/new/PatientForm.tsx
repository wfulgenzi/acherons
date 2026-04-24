"use client";

import { useState } from "react";

export type PatientData = {
  gender: "male" | "female" | "other" | "unknown";
  age: number;
  postcode: string;
  description: string;
};

const GENDER_OPTIONS: { value: PatientData["gender"]; label: string }[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
  { value: "unknown", label: "Unknown" },
];

interface Props {
  onNext: (data: PatientData) => void;
  initialData?: Partial<PatientData>;
  onInProgressChange?: (data: Partial<PatientData>) => void;
}

export function PatientForm({
  onNext,
  initialData,
  onInProgressChange,
}: Props) {
  const [gender, setGender] = useState<PatientData["gender"]>(
    initialData?.gender ?? "female",
  );
  const [age, setAge] = useState(
    initialData?.age != null ? String(initialData.age) : "",
  );
  const [postcode, setPostcode] = useState(initialData?.postcode ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );

  function notify(patch: Partial<PatientData>) {
    onInProgressChange?.({
      gender,
      age: age !== "" ? Number(age) : undefined,
      postcode,
      description,
      ...patch,
    });
  }

  const isValid =
    age !== "" &&
    Number(age) >= 0 &&
    Number(age) <= 150 &&
    postcode.trim().length > 0 &&
    description.trim().length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) {
      return;
    }
    onNext({
      gender,
      age: Number(age),
      postcode: postcode.trim(),
      description: description.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <div className="bg-brand-50 rounded-2xl border border-gray-100 shadow-sm p-8 space-y-7">
        {/* Sex */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-3">
            Sex
          </label>
          <div className="flex gap-2 flex-wrap">
            {GENDER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setGender(opt.value);
                  notify({ gender: opt.value });
                }}
                className={`px-5 py-2 rounded-full text-sm font-medium border transition-colors ${
                  gender === opt.value
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-brand-50 text-gray-600 border-gray-200 hover:border-brand-300 hover:text-brand-800"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Age + Postcode */}
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="age"
              className="block text-sm font-medium text-gray-600 mb-2"
            >
              Age
            </label>
            <input
              id="age"
              type="number"
              min={0}
              max={150}
              value={age}
              onChange={(e) => {
                setAge(e.target.value);
                notify({
                  age:
                    e.target.value !== "" ? Number(e.target.value) : undefined,
                });
              }}
              placeholder="e.g. 34"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/10 transition"
            />
          </div>
          <div>
            <label
              htmlFor="postcode"
              className="block text-sm font-medium text-gray-600 mb-2"
            >
              Postcode
            </label>
            <input
              id="postcode"
              type="text"
              value={postcode}
              onChange={(e) => {
                setPostcode(e.target.value);
                notify({ postcode: e.target.value });
              }}
              placeholder="e.g. 75020"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/10 transition"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-600 mb-2"
          >
            Description of the issue
          </label>
          <textarea
            id="description"
            rows={6}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              notify({ description: e.target.value });
            }}
            placeholder="Describe the patient's condition..."
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/10 transition resize-none"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            {description.length} character{description.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!isValid}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-800 disabled:bg-brand-200 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Find clinics
            <ArrowRightIcon />
          </button>
        </div>
      </div>
    </form>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
