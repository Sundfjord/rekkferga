// components/Map.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Quay } from "@/types/quay";
import { createQuayMarker, createUserMarker } from "./MapElements";

// Fix for broken default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapProps {
  quays: Quay[];
  position: [number, number];
  onQuaySelect: (quay: Quay) => void;
  onUserLocationChange?: (coords: [number, number]) => void; // Add this prop
}

export default function Map({
  quays,
  position,
  onQuaySelect,
  onUserLocationChange,
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize map (only once)
  useEffect(() => {
    console.log("doing things4");
    if (mapRef.current && !mapInstanceRef.current) {
      console.log("Initializing map..."); // Debug log

      const map = L.map(mapRef.current, { zoomControl: false }).setView(
        position,
        10
      );
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      L.control
        .zoom({
          position: "bottomright",
        })
        .addTo(map);

      console.log("Map initialized successfully"); // Debug log
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run once

  // Update markers when quays change
  useEffect(() => {
    console.log("doing things");
    if (!mapInstanceRef.current) return;

    console.log("Updating markers, count:", quays.length); // Debug log

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    quays.forEach((quay) => {
      const marker = L.marker([quay.latitude, quay.longitude], {
        icon: createQuayMarker(quay.name),
      });

      marker
        .bindPopup(quay.name, {
          className: "quay-popup",
          closeButton: false,
          autoClose: false,
          autoPan: false,
        })
        .on("click", () => {
          onQuaySelect(quay);
        })
        .addTo(mapInstanceRef.current!);

      markersRef.current.push(marker);
    });
  }, []);

  // Get user location
  useEffect(() => {
    console.log("doing things2");
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setUserLocation(coords);

          // Notify parent component of user location
          if (onUserLocationChange) {
            onUserLocationChange(coords);
          }

          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView(coords, 10);
          }
        },
        (error) => {
          console.error("Error getting user location:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  }, [onUserLocationChange]);

  // Update user marker
  useEffect(() => {
    console.log("doing things3");
    if (mapInstanceRef.current && userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng(userLocation);
      } else {
        userMarkerRef.current = L.marker(userLocation, {
          icon: createUserMarker(),
        })
          .bindPopup("Du er her")
          .addTo(mapInstanceRef.current);
      }
    }
  }, [userLocation]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full min-h-[600px]"
      style={{
        width: "100%",
        height: "100%",
        zIndex: 0,
      }}
    />
  );
}
