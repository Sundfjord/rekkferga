"use client";

import type { JourneyResult } from "@shared/types";
import Map from "@/components/Map";

interface MapWrapperProps {
  journey: JourneyResult | null;
  userLocation: [number, number] | null;
}

export default function MapWrapper({ journey, userLocation }: MapWrapperProps) {
  return (
    <div className="w-full h-full">
      <Map journey={journey} userLocation={userLocation} />
    </div>
  );
}
