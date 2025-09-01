// components/QuayCard.tsx
"use client";

import { useState, useEffect } from "react";
import { Quay, QuayDetails } from "@/types/quay";

interface QuayCardProps {
  quay: Quay;
  userLocation: [number, number] | null;
}

export default function QuayCard({ quay, userLocation }: QuayCardProps) {
  const [details, setDetails] = useState<QuayDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuayDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Use passed user location or fallback to default
        let userCoords = "8.468,60.472"; // Default coordinates
        if (userLocation) {
          userCoords = `${userLocation[1]},${userLocation[0]}`; // longitude,latitude format
        }

        const url = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(
          `${url}/quay/details?coords=${userCoords}&quayId=${quay.id}`,
          {
            headers: {
              "ngrok-skip-browser-warning": "true",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch quay details");
        }

        const data: QuayDetails = await response.json();
        setDetails(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuayDetails();
  }, [quay.id]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 w-80">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 w-80">
        <div className="text-red-600 text-center">
          <p className="font-medium">Error loading quay details</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{quay.name}</h3>
        <button
          onClick={() => window.close()} // You'll need to implement close functionality
          className="text-gray-400 hover:text-gray-600"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {details && (
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {details.quay.municipality}, {details.quay.region}
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"
              />
            </svg>
            Coordinates: {details.quay.latitude}, {details.quay.longitude}
          </div>

          {/* Add more details from your API response here */}
        </div>
      )}
    </div>
  );
}
