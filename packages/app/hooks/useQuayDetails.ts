import { useState } from "react";
import {
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
} from "expo-location";
import type { QuayDetails } from "@/types";

export function useQuayDetails(quayId: string) {
  const [loading, setLoading] = useState(false);
  const [quayDetails, setQuayDetails] = useState<QuayDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchQuayDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const { status } = await requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission denied");
        setLoading(false);
        return;
      }

      const { coords } = await getCurrentPositionAsync({});
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/quay/details?coords=${coords.longitude},${coords.latitude}&quayId=${quayId}`,
        { headers: { "ngrok-skip-browser-warning": "true" } }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setQuayDetails(data);
    } catch (err) {
      console.error("Failed to fetch dock details:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch dock details"
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    quayDetails,
    loading,
    error,
    fetchQuayDetails,
  };
}
