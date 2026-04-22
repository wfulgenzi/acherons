"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type ClinicForMap = {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};

const markerIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:28px;height:28px;border-radius:50%;
    background:oklch(0.55 0.055 145);
    border:2px solid white;
    box-shadow:0 2px 6px rgba(0,0,0,0.3);
    display:flex;align-items:center;justify-content:center;
    color:white;font-size:11px;font-weight:700;
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export function RequestClinicsMapInner({ clinics }: { clinics: ClinicForMap[] }) {
  const mappable = clinics.filter((c) => c.latitude != null && c.longitude != null);

  const defaultCenter: [number, number] =
    mappable.length > 0
      ? [
          mappable.reduce((s, c) => s + c.latitude!, 0) / mappable.length,
          mappable.reduce((s, c) => s + c.longitude!, 0) / mappable.length,
        ]
      : [51.505, -0.09];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      className="h-full w-full"
      style={{ height: "100%" }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {mappable.map((clinic, idx) => (
        <Marker
          key={clinic.id}
          position={[clinic.latitude!, clinic.longitude!]}
          icon={markerIcon}
        >
          <Popup>
            <div className="text-sm font-semibold">{idx + 1}. {clinic.name}</div>
            {clinic.address && <div className="text-xs text-gray-500">{clinic.address}</div>}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
