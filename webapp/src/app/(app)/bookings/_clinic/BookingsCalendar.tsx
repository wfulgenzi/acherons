"use client";

import { useState } from "react";
import type { ClinicBookingItem } from "./types";

const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function get7Days(from: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function isoToDayOfWeek(dateKey: string): number {
  // 0 = Mon ... 6 = Sun
  const d = new Date(dateKey + "T00:00:00");
  return (d.getDay() + 6) % 7;
}

function durationMins(start: string, end: string): number {
  return Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 60_000,
  );
}

function genderShort(g: ClinicBookingItem["patientGender"]): string {
  return g === "male" ? "M" : g === "female" ? "F" : "?";
}

interface Props {
  items: ClinicBookingItem[];
  today: Date;
}

export function BookingsCalendar({ items, today }: Props) {
  const todayKey = toDateKey(today);
  const [selectedKey, setSelectedKey] = useState(todayKey);

  const days = get7Days(today);

  // Group bookings by date key
  const byDay: Record<string, ClinicBookingItem[]> = {};
  for (const item of items) {
    const key = item.confirmedStart.slice(0, 10);
    if (!byDay[key]) {
      byDay[key] = [];
    }
    byDay[key].push(item);
  }

  const selectedBookings = byDay[selectedKey] ?? [];
  const selectedDate = new Date(selectedKey + "T00:00:00");
  const selectedLabel = selectedDate.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex gap-5 items-start">
      {/* ── 7-day strip ─────────────────────────────────────────────────────── */}
      <div className="flex-1 bg-brand-50 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {days.map((day) => {
            const key = toDateKey(day);
            const isToday = key === todayKey;
            const isSelected = key === selectedKey;
            const dayOfWeek = isoToDayOfWeek(key);
            return (
              <button
                key={key}
                onClick={() => setSelectedKey(key)}
                className={`flex flex-col items-center py-4 transition-colors ${
                  isSelected ? "bg-brand-50" : "hover:bg-gray-50"
                }`}
              >
                <span className="text-xs font-semibold text-gray-400 tracking-wide mb-2">
                  {DAY_LABELS[dayOfWeek]}
                </span>
                <span
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-colors ${
                    isToday
                      ? "bg-brand-600 text-white"
                      : isSelected
                        ? "bg-brand-100 text-brand-800"
                        : "text-gray-700"
                  }`}
                >
                  {day.getDate()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Booking chips per day */}
        <div className="grid grid-cols-7 min-h-[120px] divide-x divide-gray-50">
          {days.map((day) => {
            const key = toDateKey(day);
            const dayBookings = byDay[key] ?? [];
            const isSelected = key === selectedKey;
            return (
              <button
                key={key}
                onClick={() => setSelectedKey(key)}
                className={`p-2 flex flex-col gap-1 items-start transition-colors text-left ${
                  isSelected ? "bg-brand-50" : "hover:bg-gray-50"
                }`}
              >
                {dayBookings.map((b) => {
                  const time = new Date(b.confirmedStart).toLocaleTimeString(
                    "en-GB",
                    { hour: "2-digit", minute: "2-digit" },
                  );
                  return (
                    <span
                      key={b.id}
                      className="w-full text-xs font-medium bg-brand-100 text-brand-800 rounded-md px-1.5 py-0.5 truncate"
                    >
                      {time} {genderShort(b.patientGender)}·
                      {b.patientAge ?? "?"}
                    </span>
                  );
                })}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Day details panel ─────────────────────────────────────────────── */}
      <div className="w-72 shrink-0 bg-brand-50 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">
            Day Details
          </p>
          <p className="text-base font-bold text-gray-900">{selectedLabel}</p>
        </div>

        <div className="p-4 space-y-3">
          {selectedBookings.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              No bookings this day.
            </p>
          ) : (
            selectedBookings
              .sort(
                (a, b) =>
                  new Date(a.confirmedStart).getTime() -
                  new Date(b.confirmedStart).getTime(),
              )
              .map((b) => {
                const start = new Date(b.confirmedStart);
                const mins = durationMins(b.confirmedStart, b.confirmedEnd);
                const timeStr = start.toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div
                    key={b.id}
                    className="bg-brand-50 rounded-xl p-4 border border-brand-100"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-bold text-brand-800">
                        {timeStr}
                      </p>
                      <span className="text-[10px] font-semibold text-brand-500 uppercase tracking-wide shrink-0">
                        {mins} min
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-gray-700 mb-0.5">
                      {genderShort(b.patientGender)} · {b.patientAge ?? "?"}y
                    </p>
                    <p className="text-xs text-gray-500 leading-snug line-clamp-2">
                      {b.caseDescription}
                    </p>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}
