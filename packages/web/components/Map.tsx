"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { JourneyResult, CarLeg, FerryLeg } from "@shared/types";
import { createQuayWaypointMarker, createUserMarker } from "./MapElements";

// Fix broken default marker URLs
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapProps {
  journey: JourneyResult | null;
  userLocation: [number, number] | null;
  completedLegs?: Set<number>;
  followUser?: boolean;
  disableFitBounds?: boolean;
}

export default function Map({ journey, userLocation, completedLegs, followUser, disableFitBounds }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayersRef = useRef<L.Layer[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const fitBoundsDoneRef = useRef(false);

  // Init map once
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      const map = L.map(mapRef.current, { zoomControl: false }).setView([60.472, 8.468], 7);
      mapInstanceRef.current = map;
      const hereKey = process.env.NEXT_PUBLIC_HERE_API_KEY;
      const tileUrl = hereKey
        ? `https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/png?style=explore.day&apiKey=${hereKey}`
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      const attribution = hereKey
        ? '&copy; <a href="https://www.here.com">HERE Maps</a>'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
      L.tileLayer(tileUrl, { attribution }).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);
    }
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        fitBoundsDoneRef.current = false;
      }
    };
  }, []);

  // Draw journey route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    routeLayersRef.current.forEach((l) => l.remove());
    routeLayersRef.current = [];

    if (!journey) return;

    const allCoords: [number, number][] = [];

    for (let idx = 0; idx < journey.legs.length; idx++) {
      const leg = journey.legs[idx];
      const { fromPlace, toPlace, mode } = leg;
      if (!fromPlace.latitude || !fromPlace.longitude || !toPlace.latitude || !toPlace.longitude) continue;

      const start: [number, number] = [fromPlace.latitude, fromPlace.longitude];
      const end: [number, number] = [toPlace.latitude, toPlace.longitude];
      allCoords.push(start, end);

      const isCompleted = completedLegs?.has(idx) ?? false;
      const isFerry = mode === "water";
      const lineCoords: [number, number][] = (!isFerry && (leg as CarLeg).geometry)
        ? (leg as CarLeg).geometry!.map(([lat, lng]) => [lat, lng])
        : [start, end];
      const polyline = L.polyline(lineCoords, {
        color: isFerry ? "#0ea5e9" : "#3b82f6",
        weight: isFerry ? 3 : 4,
        dashArray: isFerry ? "8 6" : undefined,
        opacity: isCompleted ? 0.3 : 0.9,
      }).addTo(map);
      routeLayersRef.current.push(polyline);

      if (isFerry) {
        const ferryLeg = leg as FerryLeg;
        const fromMarker = L.marker(start, {
          icon: createQuayWaypointMarker(ferryLeg.fromPlace.name),
          interactive: false,
          opacity: isCompleted ? 0.3 : 1,
        }).addTo(map);
        const toMarker = L.marker(end, {
          icon: createQuayWaypointMarker(ferryLeg.toPlace.name),
          interactive: false,
        }).addTo(map);
        routeLayersRef.current.push(fromMarker, toMarker);
      }
    }

    if (!disableFitBounds && !fitBoundsDoneRef.current && allCoords.length > 0) {
      fitBoundsDoneRef.current = true;
      map.fitBounds(
        L.latLngBounds(allCoords.map((c) => L.latLng(c[0], c[1]))),
        { padding: [40, 40] }
      );
    }
  }, [journey, completedLegs, disableFitBounds]);

  // Update user location dot
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(userLocation);
    } else {
      userMarkerRef.current = L.marker(userLocation, { icon: createUserMarker() }).addTo(map);
    }
    if (followUser) {
      map.panTo(userLocation, { animate: true, duration: 0.5 });
    }
  }, [userLocation, followUser]);

  return <div ref={mapRef} className="w-full h-full" style={{ zIndex: 0 }} />;
}
