"use client";

import { Quay } from "@/types/quay";
import Map from "@/components/Map";

interface MapWrapperProps {
  quays: Quay[];
  position: [number, number];
  onQuaySelect: (quay: Quay) => void;
  onUserLocationChange?: (coords: [number, number]) => void; // Add this prop
}

export default function MapWrapper({
  quays,
  position,
  onQuaySelect,
  onUserLocationChange,
}: MapWrapperProps) {
  return (
    <div className="w-full h-full">
      <Map
        quays={quays}
        position={position}
        onQuaySelect={onQuaySelect}
        onUserLocationChange={onUserLocationChange}
      />
    </div>
  );
}
