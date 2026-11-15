'use client';

import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';

export type LatLng = { latitude: number; longitude: number };

type LocationPickerProps = {
  value: LatLng | null;
  fallbackCenter: LatLng;
  onChange: (value: LatLng) => void;
};

// Pin berbasis HTML agar tidak bergantung pada berkas gambar ikon bawaan Leaflet.
const pinIcon = L.divIcon({
  className: '',
  html: '<span style="display:block;width:28px;height:28px;border-radius:50% 50% 50% 0;background:#7c3aed;border:3px solid #fff;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(15,23,42,.35)"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

function round(value: number) {
  return Math.round(value * 1e6) / 1e6;
}

function ClickToPlace({ onChange }: { onChange: (value: LatLng) => void }) {
  useMapEvents({
    click(event) {
      onChange({ latitude: round(event.latlng.lat), longitude: round(event.latlng.lng) });
    },
  });
  return null;
}

function FollowValue({ value }: { value: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (value) map.panTo([value.latitude, value.longitude]);
  }, [map, value]);
  return null;
}

/** Peta Leaflet + OpenStreetMap: klik peta atau geser pin untuk menentukan titik lokasi kos. */
export default function LocationPicker({ value, fallbackCenter, onChange }: LocationPickerProps) {
  const center = value ?? fallbackCenter;

  const markerHandlers = useMemo(
    () => ({
      dragend(event: L.LeafletEvent) {
        const position = (event.target as L.Marker).getLatLng();
        onChange({ latitude: round(position.lat), longitude: round(position.lng) });
      },
    }),
    [onChange],
  );

  return (
    <MapContainer
      center={[center.latitude, center.longitude]}
      zoom={value ? 17 : 15}
      scrollWheelZoom
      className="h-72 w-full rounded-2xl border border-line sm:h-80"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickToPlace onChange={onChange} />
      <FollowValue value={value} />
      {value ? <Marker position={[value.latitude, value.longitude]} icon={pinIcon} draggable eventHandlers={markerHandlers} /> : null}
    </MapContainer>
  );
}
