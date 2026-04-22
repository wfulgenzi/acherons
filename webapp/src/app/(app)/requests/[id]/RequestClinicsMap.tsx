"use client";

import dynamic from "next/dynamic";

type ClinicForMap = {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};

const MapInner = dynamic(() => import("./RequestClinicsMapInner").then((m) => m.RequestClinicsMapInner), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-brand-50 rounded-xl">
      <p className="text-xs text-gray-400">Loading map…</p>
    </div>
  ),
});

export function RequestClinicsMap({ clinics }: { clinics: ClinicForMap[] }) {
  return (
    <div className="h-full w-full">
      <MapInner clinics={clinics} />
    </div>
  );
}
