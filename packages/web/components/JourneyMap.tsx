"use client";

import dynamic from "next/dynamic";
import type { MapProps } from "@/components/Map";

const Map = dynamic<MapProps>(() => import("@/components/Map"), { ssr: false });

export type JourneyMapProps = MapProps;

export default function JourneyMap(props: JourneyMapProps) {
  return <Map {...props} />;
}
