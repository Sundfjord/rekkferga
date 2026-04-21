"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { JourneyResult, CarLeg, FerryLeg, DepartureOption } from "@shared/types";
import { formatMarginLabel, formatTime, marginTier, selectDeparturesForDisplay } from "@shared/utils";
import { createQuayWaypointMarker, createUserMarker, createDestinationMarker } from "./MapElements";

function isValidCoordinate(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function buildRouteCoordinates(journey: JourneyResult): [number, number][] {
  const allCoords: [number, number][] = [];

  for (const leg of journey.legs) {
    const { fromPlace, toPlace } = leg;
    if (isValidCoordinate(fromPlace.latitude) && isValidCoordinate(fromPlace.longitude)) {
      allCoords.push([fromPlace.latitude, fromPlace.longitude]);
    }
    if (isValidCoordinate(toPlace.latitude) && isValidCoordinate(toPlace.longitude)) {
      allCoords.push([toPlace.latitude, toPlace.longitude]);
    }
    if (leg.mode !== "water" && (leg as CarLeg).geometry) {
      for (const [lat, lng] of (leg as CarLeg).geometry!) {
        if (isValidCoordinate(lat) && isValidCoordinate(lng)) {
          allCoords.push([lat, lng]);
        }
      }
    }
  }

  return allCoords;
}

function fitMapToRoute(map: L.Map, coords: [number, number][], padding: [number, number], animate = true) {
  if (coords.length < 2) return;
  if (!map.getContainer()?.isConnected) return;
  map.fitBounds(L.latLngBounds(coords.map(([lat, lng]) => L.latLng(lat, lng))), {
    padding,
    animate,
  });
}

function quayKey(name: string, latitude: number, longitude: number): string {
  return `${name}|${latitude.toFixed(6)}|${longitude.toFixed(6)}`;
}

function buildDeparturePopupContent(quayName: string, departures: DepartureOption[]): HTMLElement {
  const container = document.createElement("div");
  container.style.minWidth = "220px";
  container.style.padding = "2px 0";
  container.style.fontFamily = "var(--font-dm-sans, 'DM Sans', sans-serif)";
  container.style.color = "var(--text-primary)";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.gap = "4px";

  const title = document.createElement("div");
  title.textContent = quayName;
  title.style.fontSize = "14px";
  title.style.fontWeight = "700";
  title.style.marginBottom = "8px";
  container.appendChild(title);

  const selectedDepartures = selectDeparturesForDisplay(departures);
  if (!selectedDepartures.length) {
    const unavailable = document.createElement("div");
    unavailable.textContent = "Unavailable";
    unavailable.style.fontSize = "13px";
    unavailable.style.color = "var(--text-secondary)";
    container.appendChild(unavailable);
    return container;
  }

  for (const departure of selectedDepartures) {
    if (departure.marginMinutes === null) continue;
    const tier = marginTier(departure.marginMinutes);
    const styles: Record<typeof tier, { bg: string; text: string }> = {
      safe: { bg: "var(--color-margin-safe-surface)", text: "var(--color-margin-safe-text)" },
      tight: { bg: "var(--color-margin-tight-surface)", text: "var(--color-margin-tight-text)" },
      missed: { bg: "var(--color-margin-missed-surface)", text: "var(--color-margin-missed-text)" },
    };
    const row = document.createElement("div");
    const { prefix, label } = formatMarginLabel(departure.marginMinutes);
    row.textContent = `${formatTime(departure.expectedDepartureTime)} - ${prefix}${label}`;
    row.style.display = "inline-flex";
    row.style.alignItems = "center";
    row.style.fontSize = "12px";
    row.style.fontWeight = "700";
    row.style.padding = "5px 8px";
    row.style.borderRadius = "8px";
    row.style.marginBottom = "4px";
    row.style.backgroundColor = styles[tier].bg;
    row.style.color = styles[tier].text;
    row.style.fontFamily = "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)";
    container.appendChild(row);
  }

  return container;
}

export interface JourneyMapProps {
  journey: JourneyResult | null;
  userLocation: [number, number] | null;
  completedLegs?: Set<number>;
  followUser?: boolean;
  fitBoundsSignal?: number;
}

export default function JourneyMap({ journey, userLocation, completedLegs, followUser, fitBoundsSignal }: JourneyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const routeLayersRef = useRef<L.Layer[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const fitRafRef = useRef<number | null>(null);
  const prevJourneyRef = useRef<JourneyResult | null>(null);
  const { resolvedTheme } = useTheme();

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
      if (fitRafRef.current !== null) {
        cancelAnimationFrame(fitRafRef.current);
        fitRafRef.current = null;
      }
      tileLayerRef.current = null;
      routeLayersRef.current = [];
      userMarkerRef.current = null;
    };
  }, []);

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

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    routeLayersRef.current.forEach((l) => l.remove());
    routeLayersRef.current = [];

    if (!journey) return;

    const departuresByQuay = new Map<string, DepartureOption[]>();
    for (const leg of journey.legs) {
      if (leg.mode !== "water") continue;
      const ferryLeg = leg as FerryLeg;
      const { fromPlace } = ferryLeg;
      if (!isValidCoordinate(fromPlace.latitude) || !isValidCoordinate(fromPlace.longitude)) continue;
      departuresByQuay.set(
        quayKey(fromPlace.name, fromPlace.latitude, fromPlace.longitude),
        ferryLeg.departures ?? []
      );
    }

    for (let idx = 0; idx < journey.legs.length; idx++) {
      const leg = journey.legs[idx];
      const { fromPlace, toPlace, mode } = leg;
      if (
        !isValidCoordinate(fromPlace.latitude) ||
        !isValidCoordinate(fromPlace.longitude) ||
        !isValidCoordinate(toPlace.latitude) ||
        !isValidCoordinate(toPlace.longitude)
      ) {
        continue;
      }

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
        const fromDepartures = departuresByQuay.get(quayKey(ferryLeg.fromPlace.name, start[0], start[1])) ?? [];

        const fromMarker = L.marker(start, {
          icon: createQuayWaypointMarker(ferryLeg.fromPlace.name),
          interactive: true,
          opacity: isCompleted ? 0.3 : 1,
        }).addTo(map);
        fromMarker.bindPopup(buildDeparturePopupContent(ferryLeg.fromPlace.name, fromDepartures), {
          className: "journey-ferry-popup",
          autoPan: true,
        });
        const toMarker = L.marker(end, {
          icon: createQuayWaypointMarker(ferryLeg.toPlace.name),
          interactive: false,
        }).addTo(map);
        routeLayersRef.current.push(fromMarker, toMarker);
      }
    }

    const lastLeg = journey.legs[journey.legs.length - 1];
    if (isValidCoordinate(lastLeg?.toPlace.latitude) && isValidCoordinate(lastLeg?.toPlace.longitude)) {
      const destMarker = L.marker(
        [lastLeg.toPlace.latitude, lastLeg.toPlace.longitude],
        { icon: createDestinationMarker(), interactive: false }
      ).addTo(map);
      routeLayersRef.current.push(destMarker);
    }

    if (journey !== prevJourneyRef.current) {
      prevJourneyRef.current = journey;
      fitMapToRoute(map, buildRouteCoordinates(journey), [48, 48], true);
    }
  }, [journey, completedLegs, userLocation]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !journey || !fitBoundsSignal) return;

    if (fitRafRef.current !== null) {
      cancelAnimationFrame(fitRafRef.current);
      fitRafRef.current = null;
    }

    fitRafRef.current = requestAnimationFrame(() => {
      if (mapInstanceRef.current !== map) return;
      if (!map.getContainer()?.isConnected) return;
      map.invalidateSize();
      fitMapToRoute(map, buildRouteCoordinates(journey), [64, 64], false);
      fitRafRef.current = null;
    });

    return () => {
      if (fitRafRef.current !== null) {
        cancelAnimationFrame(fitRafRef.current);
        fitRafRef.current = null;
      }
    };
  }, [fitBoundsSignal, journey]);

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
