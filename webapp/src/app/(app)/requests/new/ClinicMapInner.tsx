"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ClinicItem } from "./NewRequestFlow";

// Fix Leaflet's default marker icon path issue with webpack/Next.js
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const markerIconSelected = L.divIcon({
  className: "",
  html: `<div style="
    width:32px;height:32px;border-radius:50%;
    background:oklch(0.55 0.055 145);
    border:3px solid white;
    box-shadow:0 2px 6px rgba(0,0,0,0.35);
    display:flex;align-items:center;justify-content:center;
    color:white;font-size:13px;font-weight:700;
  "></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const markerIconHovered = L.divIcon({
  className: "",
  html: `<div style="
    width:36px;height:36px;border-radius:50%;
    background:oklch(0.28 0.025 145);
    border:3px solid white;
    box-shadow:0 2px 8px rgba(0,0,0,0.4);
    display:flex;align-items:center;justify-content:center;
    color:white;font-size:13px;font-weight:700;
  "></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Sub-component that reacts to hoveredClinicId / mapCenter changes
function MapController({
  center,
  hoveredClinicId,
  clinics,
}: {
  center: [number, number] | null;
  hoveredClinicId: string | null;
  clinics: ClinicItem[];
}) {
  const map = useMap();

  // Fly to postcode center when it arrives
  useEffect(() => {
    if (center) {
      map.flyTo(center, 13, { duration: 1 });
    }
  }, [center, map]);

  // Fly to hovered clinic
  useEffect(() => {
    if (!hoveredClinicId) {
      return;
    }
    const clinic = clinics.find((c) => c.id === hoveredClinicId);
    if (clinic?.latitude && clinic?.longitude) {
      map.flyTo([clinic.latitude, clinic.longitude], 15, { duration: 0.6 });
    }
  }, [hoveredClinicId, clinics, map]);

  return null;
}

interface Props {
  clinics: ClinicItem[];
  center: [number, number] | null;
  hoveredClinicId: string | null;
  selectedClinicIds: Set<string>;
  onMarkerClick: (clinicId: string) => void;
}

export function ClinicMapInner({
  clinics,
  center,
  hoveredClinicId,
  selectedClinicIds,
  onMarkerClick,
}: Props) {
  const mappableClinics = clinics.filter(
    (c) => c.latitude != null && c.longitude != null,
  );

  // Default center: average of all clinics, or London fallback
  const defaultCenter: [number, number] =
    mappableClinics.length > 0
      ? [
          mappableClinics.reduce((s, c) => s + c.latitude!, 0) /
            mappableClinics.length,
          mappableClinics.reduce((s, c) => s + c.longitude!, 0) /
            mappableClinics.length,
        ]
      : [51.505, -0.09];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      className="h-full w-full rounded-2xl"
      style={{ minHeight: "500px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapController
        center={center}
        hoveredClinicId={hoveredClinicId}
        clinics={clinics}
      />

      {mappableClinics.map((clinic, idx) => {
        const isSelected = selectedClinicIds.has(clinic.id);
        const isHovered = hoveredClinicId === clinic.id;
        const icon = isHovered
          ? markerIconHovered
          : isSelected
            ? markerIconSelected
            : markerIcon;

        return (
          <Marker
            key={clinic.id}
            position={[clinic.latitude!, clinic.longitude!]}
            icon={icon}
            eventHandlers={{
              click: () => onMarkerClick(clinic.id),
            }}
          >
            <Popup>
              <div className="text-sm font-semibold">
                {idx + 1}. {clinic.name}
              </div>
              {clinic.address && (
                <div className="text-xs text-gray-500 mt-0.5">
                  {clinic.address}
                </div>
              )}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
