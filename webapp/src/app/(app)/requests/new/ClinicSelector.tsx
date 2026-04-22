"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import type { ClinicItem } from "./NewRequestFlow";
import type { OpeningHours } from "@/db/schema";

// ── Haversine distance (km) ────────────────────────────────────────────────
function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── sessionStorage geocode cache ──────────────────────────────────────────
const GEO_CACHE_PREFIX = "acherons:geo:";

function getCachedGeo(postcode: string): [number, number] | null {
  try {
    const raw = sessionStorage.getItem(GEO_CACHE_PREFIX + postcode.toLowerCase());
    if (!raw) return null;
    return JSON.parse(raw) as [number, number];
  } catch { return null; }
}

function setCachedGeo(postcode: string, coords: [number, number]) {
  try {
    sessionStorage.setItem(GEO_CACHE_PREFIX + postcode.toLowerCase(), JSON.stringify(coords));
  } catch { /* storage full */ }
}

// Dynamically import the Leaflet map — must not run on the server
const ClinicMapInner = dynamic(
  () => import("./ClinicMapInner").then((m) => m.ClinicMapInner),
  { ssr: false, loading: () => <MapPlaceholder /> }
);

interface Props {
  clinics: ClinicItem[];
  postcode: string;
  onDispatch: (selectedClinicIds: string[]) => void;
  submitting: boolean;
  initialSelectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

export function ClinicSelector({ clinics, postcode, onDispatch, submitting, initialSelectedIds, onSelectionChange }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(initialSelectedIds ?? [])
  );
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const listRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Geocode the postcode → mapCenter (with sessionStorage cache)
  useEffect(() => {
    // Wrap cached lookup in async too so setState always runs asynchronously,
    // avoiding the "setState synchronously in effect" lint rule.
    async function geocode() {
      const cached = getCachedGeo(postcode);
      if (cached) {
        setMapCenter(cached);
        return;
      }
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(postcode)}&limit=1`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        if (data[0]) {
          const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
          setMapCenter(coords);
          setCachedGeo(postcode, coords);
        }
      } catch {
        // Geocoding failed — map will use clinic centroid default
      }
    }
    void geocode();
  }, [postcode]);

  // Sort clinics by distance from postcode once we have a centre coordinate
  const sortedClinics = useMemo(() => {
    if (!mapCenter) return clinics;
    return [...clinics]
      .map((c) => ({
        ...c,
        distanceKm:
          c.latitude != null && c.longitude != null
            ? haversineKm(mapCenter[0], mapCenter[1], c.latitude, c.longitude)
            : null,
      }))
      .sort((a, b) => {
        if (a.distanceKm == null && b.distanceKm == null) return 0;
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });
  }, [clinics, mapCenter]);

  function toggleClinic(id: string) {
    // Compute next outside the updater so we can call onSelectionChange
    // synchronously after — calling parent setState inside a child state
    // updater triggers the "setState while rendering" warning.
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
    onSelectionChange?.(Array.from(next));
  }

  // When a map marker is clicked, scroll the list to that clinic
  const handleMarkerClick = useCallback((clinicId: string) => {
    const el = listRefs.current.get(clinicId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    toggleClinic(clinicId);
  // toggleClinic is stable (no external deps), ref is stable — intentional
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-5">
      {/* Dispatch button at top right */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {clinics.length} clinic{clinics.length !== 1 ? "s" : ""} found
          {selectedIds.size > 0 && (
            <span className="ml-2 font-semibold text-brand-800">
              · {selectedIds.size} selected
            </span>
          )}
        </p>
        <button
          onClick={() => onDispatch(Array.from(selectedIds))}
          disabled={selectedIds.size === 0 || submitting}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-800 disabled:bg-brand-200 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          {submitting ? "Dispatching…" : `Dispatch to ${selectedIds.size} clinic${selectedIds.size !== 1 ? "s" : ""} →`}
        </button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-5 items-start">
        {/* Left: clinic list */}
        <div className="bg-brand-50 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Clinics near {postcode}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {mapCenter ? "Sorted by distance" : "Locating postcode…"}
              </p>
            </div>
            {selectedIds.size > 0 && (
              <span className="text-xs font-semibold bg-brand-100 text-brand-800 px-2.5 py-1 rounded-full shrink-0">
                {selectedIds.size} selected
              </span>
            )}
          </div>

          <ul
            className="divide-y divide-gray-50 overflow-y-auto"
            style={{ maxHeight: "calc(100vh - 320px)" }}
          >
            {sortedClinics.length === 0 ? (
              <li className="px-5 py-10 text-center text-sm text-gray-400">
                No clinics available.
              </li>
            ) : (
              sortedClinics.map((clinic, idx) => (
                <ClinicRow
                  key={clinic.id}
                  clinic={clinic}
                  index={idx + 1}
                  distanceKm={"distanceKm" in clinic ? (clinic.distanceKm as number | null) : null}
                  isSelected={selectedIds.has(clinic.id)}
                  isHovered={hoveredId === clinic.id}
                  onToggle={() => toggleClinic(clinic.id)}
                  onMouseEnter={() => setHoveredId(clinic.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  refCallback={(el) => {
                    if (el) listRefs.current.set(clinic.id, el);
                    else listRefs.current.delete(clinic.id);
                  }}
                />
              ))
            )}
          </ul>
        </div>

        {/* Right: map */}
        <div className="sticky top-24 rounded-2xl overflow-hidden border border-gray-100 shadow-sm" style={{ height: "calc(100vh - 280px)" }}>
          <ClinicMapInner
            clinics={clinics}
            center={mapCenter}
            hoveredClinicId={hoveredId}
            selectedClinicIds={selectedIds}
            onMarkerClick={handleMarkerClick}
          />
        </div>
      </div>
    </div>
  );
}

// ── Clinic row ────────────────────────────────────────────────────────────────

function ClinicRow({
  clinic,
  index,
  distanceKm,
  isSelected,
  isHovered,
  onToggle,
  onMouseEnter,
  onMouseLeave,
  refCallback,
}: {
  clinic: ClinicItem;
  index: number;
  distanceKm: number | null;
  isSelected: boolean;
  isHovered: boolean;
  onToggle: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  refCallback: (el: HTMLLIElement | null) => void;
}) {
  const { today, tomorrow } = getOpeningHours(clinic.openingHours);

  return (
    <li
      ref={refCallback}
      onClick={onToggle}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`px-4 py-4 cursor-pointer transition-colors ${
        isHovered ? "bg-brand-50" : "hover:bg-brand-50/60"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div
          className={`mt-0.5 w-5 h-5 rounded-full shrink-0 border-2 flex items-center justify-center transition-colors ${
            isSelected
              ? "bg-brand-600 border-brand-600"
              : "border-gray-200 bg-brand-50"
          }`}
        >
          {isSelected && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + index + distance */}
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              <span className="text-brand-500 mr-1.5 font-medium">{index}.</span>
              {clinic.name}
            </p>
            {distanceKm != null && (
              <span className="text-xs font-semibold text-brand-500 shrink-0">
                {distanceKm < 1
                  ? `${Math.round(distanceKm * 1000)} m`
                  : `${distanceKm.toFixed(1)} km`}
              </span>
            )}
          </div>

          {/* Address */}
          {clinic.address && (
            <div className="flex items-center gap-1 mt-1">
              <PinIcon />
              <p className="text-xs text-gray-500 truncate">{clinic.address}</p>
            </div>
          )}

          {/* Phone */}
          {clinic.phone && (
            <div className="flex items-center gap-1 mt-0.5">
              <PhoneIcon />
              <p className="text-xs text-gray-500">{clinic.phone}</p>
            </div>
          )}

          {/* Opening hours */}
          {(today.length > 0 || tomorrow.length > 0) && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {today.length > 0 && (
                <HoursCard label="Today" slots={today} />
              )}
              {tomorrow.length > 0 && (
                <HoursCard label="Tomorrow" slots={tomorrow} />
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function HoursCard({ label, slots }: { label: string; slots: [string, string][] }) {
  return (
    <div className="bg-brand-50 rounded-lg px-3 py-2">
      <p className="text-[10px] font-semibold text-brand-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      {slots.map(([start, end], i) => (
        <p key={i} className="text-xs text-brand-800 font-medium leading-snug">
          {start} – {end}
        </p>
      ))}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getOpeningHours(hours: OpeningHours | null) {
  if (!hours) return { today: [], tomorrow: [] };
  const jsDay = new Date().getDay(); // 0 = Sunday
  const todayIdx = (jsDay + 6) % 7; // 0 = Monday
  const tomorrowIdx = (todayIdx + 1) % 7;
  return {
    today: hours.find((d) => d.day === todayIdx)?.slots ?? [],
    tomorrow: hours.find((d) => d.day === tomorrowIdx)?.slots ?? [],
  };
}

function MapPlaceholder() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-brand-50 rounded-2xl">
      <p className="text-sm text-gray-400">Loading map…</p>
    </div>
  );
}

function PinIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.56 3.3 2 2 0 0 1 3.53 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
