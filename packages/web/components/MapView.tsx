"use client";

import { useEffect, useMemo, useRef } from "react";
import { useTheme } from "next-themes";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Quay, QuayRoute } from "@shared/types";
import { QUAY_PIN, QUAY_PIN_SELECTED, createUserMarker } from "./MapElements";

function isValidCoord(v: number | undefined | null): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export interface MapViewProps {
  quays: Quay[];
  userLocation: [number, number] | null;
  selectedQuay: Quay | null;
  route: QuayRoute | null;
  onSelectQuay: (quay: Quay) => void;
}

export default function MapView({
  quays,
  userLocation,
  selectedQuay,
  route,
  onSelectQuay,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const pinsLayerRef = useRef<L.LayerGroup | null>(null);
  const markersByIdRef = useRef<Map<string, L.Marker>>(new Map());
  const overlayLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const highlightedIdRef = useRef<string | null>(null);
  const { resolvedTheme } = useTheme();

  const quaysById = useMemo(() => {
    const m = new Map<string, Quay>();
    for (const q of quays) m.set(q.id, q);
    return m;
  }, [quays]);

  // Init map once
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      const map = L.map(mapRef.current, { zoomControl: false }).setView([64.5, 12.0], 5);
      mapInstanceRef.current = map;
      L.control.zoom({ position: "bottomright" }).addTo(map);
      pinsLayerRef.current = L.layerGroup().addTo(map);
      overlayLayerRef.current = L.layerGroup().addTo(map);
    }
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      tileLayerRef.current = null;
      pinsLayerRef.current = null;
      overlayLayerRef.current = null;
      userMarkerRef.current = null;
    };
  }, []);

  // Theme-aware tiles (HERE when keyed, OSM fallback)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (tileLayerRef.current) tileLayerRef.current.remove();

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

  // Render all quay pins (rebuild only when the dataset changes)
  useEffect(() => {
    const layer = pinsLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    markersByIdRef.current.clear();

    for (const quay of quays) {
      if (!isValidCoord(quay.latitude) || !isValidCoord(quay.longitude)) continue;
      const marker = L.marker([quay.latitude, quay.longitude], {
        icon: quay.id === highlightedIdRef.current ? QUAY_PIN_SELECTED : QUAY_PIN,
        zIndexOffset: quay.id === highlightedIdRef.current ? 1000 : 0,
        title: quay.name,
      });
      marker.on("click", () => onSelectQuay(quay));
      marker.addTo(layer);
      markersByIdRef.current.set(quay.id, marker);
    }
  }, [quays, onSelectQuay]);

  // Reflect the selected quay (enlarged pin) — only touch the two markers that change.
  useEffect(() => {
    const markers = markersByIdRef.current;
    const prevId = highlightedIdRef.current;
    const nextId = selectedQuay?.id ?? null;
    if (prevId === nextId) return;
    const prev = prevId ? markers.get(prevId) : undefined;
    prev?.setIcon(QUAY_PIN).setZIndexOffset(0);
    const next = nextId ? markers.get(nextId) : undefined;
    next?.setIcon(QUAY_PIN_SELECTED).setZIndexOffset(1000);
    highlightedIdRef.current = nextId;
  }, [selectedQuay, quays]);

  // Draw drive route + dashed crossing lines for the selected quay
  useEffect(() => {
    const layer = overlayLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!selectedQuay) return;

    if (route?.geometry?.length) {
      L.polyline(
        route.geometry.map(([lat, lng]) => [lat, lng] as [number, number]),
        { color: "#3b82f6", weight: 4, opacity: 0.9 },
      ).addTo(layer);
    }

    for (const relId of selectedQuay.relatedQuayIds) {
      const rel = quaysById.get(relId);
      if (!rel || !isValidCoord(rel.latitude) || !isValidCoord(rel.longitude)) continue;
      L.polyline(
        [
          [selectedQuay.latitude, selectedQuay.longitude],
          [rel.latitude, rel.longitude],
        ],
        { color: "#0ea5e9", weight: 3, dashArray: "8 6", opacity: 0.85 },
      ).addTo(layer);
    }
  }, [selectedQuay, route, quaysById]);

  // User marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(userLocation);
    } else {
      userMarkerRef.current = L.marker(userLocation, { icon: createUserMarker() }).addTo(map);
    }
  }, [userLocation]);

  // Fit to user + selected quay (+ drive route once it arrives)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedQuay) return;

    const pts: [number, number][] = [[selectedQuay.latitude, selectedQuay.longitude]];
    if (userLocation) pts.push(userLocation);
    if (route?.geometry?.length) {
      for (const [lat, lng] of route.geometry) pts.push([lat, lng]);
    }
    if (pts.length < 2) {
      map.setView([selectedQuay.latitude, selectedQuay.longitude], 12, { animate: true });
      return;
    }
    map.fitBounds(L.latLngBounds(pts.map(([lat, lng]) => L.latLng(lat, lng))), {
      padding: [80, 80],
      animate: true,
    });
  // userLocation is deliberately omitted: a position update shouldn't yank the viewport.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQuay, route]);

  return <div ref={mapRef} className="w-full h-full" style={{ zIndex: 0 }} />;
}
