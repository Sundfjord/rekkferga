// app/page.tsx
"use client";
import { useState, useEffect } from "react";
import QuayCard from "@/components/QuayCard";
import { Quay } from "@/types/quay";
import MapWrapper from "@/components/MapWrapper";
import Search from "@/components/Search";

async function fetchQuays(): Promise<Quay[]> {
  const url = process.env.NEXT_PUBLIC_API_URL;
  const response = await fetch(`${url}/quays`, {
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch quays");
  }
  const data: Quay[] = await response.json();
  return data;
}

export default function Home() {
  const [quays, setQuays] = useState<Quay[]>([]);
  const [selectedQuay, setSelectedQuay] = useState<Quay | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchQuays().then((data) => {
      setQuays(data);
      setIsLoading(false);
    });
  }, []);

  const handleQuaySelect = (quay: Quay) => {
    setSelectedQuay(quay);
  };

  const handleUserLocationChange = (coords: [number, number]) => {
    setUserLocation(coords);
  };

  if (isLoading) {
    return (
      <div className="relative flex flex-col h-screen w-screen">
        <div className="flex items-center justify-center h-full">
          <div className="text-lg">Loading quays...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-screen w-screen">
      <div className="absolute top-4 left-4 z-10 w-80">
        <Search onSelect={handleQuaySelect} />
      </div>

      <div className="flex-1 w-full">
        <MapWrapper
          quays={quays}
          position={[60.472, 8.468]}
          onQuaySelect={handleQuaySelect}
          onUserLocationChange={handleUserLocationChange}
        />
      </div>

      {selectedQuay && (
        <div className="absolute top-20 left-4 z-10">
          <QuayCard quay={selectedQuay} userLocation={userLocation} />
        </div>
      )}
    </div>
  );
}
