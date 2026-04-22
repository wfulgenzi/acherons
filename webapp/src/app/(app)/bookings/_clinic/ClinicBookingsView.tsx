"use client";

import { useState } from "react";
import { BookingsCalendar } from "./BookingsCalendar";
import { BookingsList } from "./BookingsList";
import type { ClinicBookingItem } from "./types";

type View = "calendar" | "list";
type TimeFilter = "upcoming" | "past";

interface Props {
  items: ClinicBookingItem[];
  today: string; // ISO
}

export function ClinicBookingsView({ items, today }: Props) {
  const [view, setView] = useState<View>("calendar");
  const [listFilter, setListFilter] = useState<TimeFilter>("upcoming");

  const todayDate = new Date(today);
  const nowMs = todayDate.getTime();

  const upcomingItems = items.filter(
    (r) => new Date(r.confirmedStart).getTime() >= nowMs
  );
  const pastItems = [...items]
    .filter((r) => new Date(r.confirmedStart).getTime() < nowMs)
    .reverse(); // most recent past first

  const listItems = listFilter === "upcoming" ? upcomingItems : pastItems;

  const upcomingCount = upcomingItems.length;
  const pastCount = pastItems.length;

  return (
    <div className="flex-1 min-h-screen">
      <header className="bg-brand-50 border-b border-brand-200 px-8 py-6 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Bookings</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Confirmed appointments dispatched to your clinic.
            </p>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setView("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                view === "calendar"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-brand-800"
              }`}
            >
              <CalendarIcon />
              Calendar
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                view === "list"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-brand-800"
              }`}
            >
              <ListIcon />
              List
            </button>
          </div>
        </div>
      </header>

      <div className="px-8 py-8 space-y-6">
        {view === "calendar" ? (
          // Calendar always shows upcoming only — no past tab
          <BookingsCalendar items={upcomingItems} today={todayDate} />
        ) : (
          <>
            {/* Upcoming / Past tabs for list view */}
            <div className="flex items-center gap-2">
              {(
                [
                  { key: "upcoming" as TimeFilter, label: "Upcoming", count: upcomingCount },
                  { key: "past" as TimeFilter, label: "Past", count: pastCount },
                ] as const
              ).map((tab) => {
                const active = tab.key === listFilter;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setListFilter(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                      active
                        ? "bg-brand-600 text-white border-brand-600"
                        : "bg-brand-50 text-gray-500 border-gray-200 hover:border-brand-300 hover:text-brand-800"
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                        active
                          ? "bg-white/20 text-white"
                          : tab.count > 0
                          ? "bg-brand-100 text-brand-800"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <BookingsList items={listItems} />
          </>
        )}
      </div>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}
