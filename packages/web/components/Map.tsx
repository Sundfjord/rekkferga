"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { JourneyResult, CarLeg, FerryLeg } from "@shared/types";
import { createQuayWaypointMarker, createUserMarker, createDestinationMarker } from "./MapElements";


export interface MapProps {
  journey: JourneyResult | null;
  userLocation: [number, number] | null;
  completedLegs?: Set<number>;
  followUser?: boolean;
  /** Increment to trigger a fitBounds to the full route. */
  fitBoundsSignal?: number;
}

export default function Map({ journey, userLocation, completedLegs, followUser, fitBoundsSignal }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const routeLayersRef = useRef<L.Layer[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const prevJourneyRef = useRef<JourneyResult | null>(null);
  const { resolvedTheme } = useTheme();

  // Init map once
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      const map = L.map(mapRef.current, { zoomControl: false }).setView([60.472, 8.468], 7);
      mapInstanceRef.current = map;
      L.control.zoom({ position: "bottomright" }).addTo(map);
    }
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      tileLayerRef.current = null;
      routeLayersRef.current = [];
      userMarkerRef.current = null;
    };
  }, []);

  // Swap tile layer when theme changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    const isDark = resolvedTheme === "dark";
    const hereKey = process.env.NEXT_PUBLIC_HERE_API_KEY;
    const style = isDark ? "explore.night" : "explore.day";
    const tileUrl = hereKey
      ? `https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/png?style=${style}&apiKey=${hereKey}`
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    const attribution = hereKey
      ? '&copy; <a href="https://www.here.com">HERE Maps</a>'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

    tileLayerRef.current = L.tileLayer(tileUrl, { attribution }).addTo(map);
  }, [resolvedTheme]);

  // Draw journey route whenever it changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    routeLayersRef.current.forEach((l) => l.remove());
    routeLayersRef.current = [];

    if (!journey) return;

    for (let idx = 0; idx < journey.legs.length; idx++) {
      const leg = journey.legs[idx];
      const { fromPlace, toPlace, mode } = leg;
      if (!fromPlace.latitude || !fromPlace.longitude || !toPlace.latitude || !toPlace.longitude) continue;

      const start: [number, number] = [fromPlace.latitude, fromPlace.longitude];
      const end: [number, number] = [toPlace.latitude, toPlace.longitude];
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

    // Destination marker at the end of the route
    const lastLeg = journey.legs[journey.legs.length - 1];
    if (lastLeg?.toPlace.latitude && lastLeg?.toPlace.longitude) {
      const destMarker = L.marker(
        [lastLeg.toPlace.latitude, lastLeg.toPlace.longitude],
        { icon: createDestinationMarker(), interactive: false }
      ).addTo(map);
      routeLayersRef.current.push(destMarker);
    }

    // Auto-fit bounds when a new journey loads (not on departure refreshes)
    if (journey !== prevJourneyRef.current) {
      prevJourneyRef.current = journey;
      const allCoords: [number, number][] = [];
      if (userLocation) allCoords.push(userLocation);
      for (const leg of journey.legs) {
        const { fromPlace, toPlace } = leg;
        if (fromPlace.latitude && fromPlace.longitude) allCoords.push([fromPlace.latitude, fromPlace.longitude]);
        if (toPlace.latitude && toPlace.longitude) allCoords.push([toPlace.latitude, toPlace.longitude]);
        if (leg.mode !== "water" && (leg as CarLeg).geometry) {
          for (const pt of (leg as CarLeg).geometry!) allCoords.push([pt[0], pt[1]]);
        }
      }
      if (allCoords.length > 1) {
        map.fitBounds(
          L.latLngBounds(allCoords.map((c) => L.latLng(c[0], c[1]))),
          { padding: [48, 48], animate: true }
        );
      }
    }
  }, [journey, completedLegs, userLocation]);

  // Fit to full route whenever signal fires
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !journey || !fitBoundsSignal) return;

    const allCoords: [number, number][] = [];
    for (const leg of journey.legs) {
      const { fromPlace, toPlace } = leg;
      if (fromPlace.latitude && fromPlace.longitude) allCoords.push([fromPlace.latitude, fromPlace.longitude]);
      if (toPlace.latitude && toPlace.longitude) allCoords.push([toPlace.latitude, toPlace.longitude]);
    }
    if (allCoords.length > 0) {
      map.fitBounds(
        L.latLngBounds(allCoords.map((c) => L.latLng(c[0], c[1]))),
        { padding: [64, 64] }
      );
    }
    // journey intentionally not in deps — only refit when signal fires, not on departure refreshes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitBoundsSignal]);

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
