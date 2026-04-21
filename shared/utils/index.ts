// Shared utilities for Rekkferga platform

import type { DepartureOption } from '../types';

export type Language = "en" | "no" | "nn";

export function translate(
  translations: Record<string, Record<string, string>>,
  language: Language,
  key: string,
  variables?: Record<string, string | number>
): string {
  let str = translations[language]?.[key];
  if (!str) {
    str = language === "nn"
      ? (translations["no"]?.[key] ?? translations["en"]?.[key])
      : translations["en"]?.[key];
  }
  if (!str) return key;
  if (variables) {
    for (const [k, v] of Object.entries(variables)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return str;
}

export const formatDuration = (seconds: number): string => {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
};

export const formatTime = (iso: string): string => {
  return new Date(iso).toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// ---------------------------------------------------------------------------
// Trip utilities
// ---------------------------------------------------------------------------

export const QUAY_PROXIMITY_KM = 0.2;
export const DESTINATION_PROXIMITY_KM = 0.2;
export const STALE_THRESHOLD_MS = 5 * 60 * 1000;

export function nextReachable(deps: DepartureOption[] | undefined): DepartureOption | undefined {
  if (!deps?.length) return undefined;
  return deps.find((d) => d.marginMinutes !== null && d.marginMinutes >= 0) ?? deps[0];
}

export function selectDeparturesForDisplay(deps: DepartureOption[] | undefined): DepartureOption[] {
  if (!deps?.length) return [];

  const departuresWithMargin = deps.filter((d) => d.marginMinutes !== null);
  if (!departuresWithMargin.length) return [];

  const firstReachable = departuresWithMargin.find((d) => (d.marginMinutes ?? -1) >= 0);
  if (firstReachable && (firstReachable.marginMinutes ?? -1) >= 10) {
    return [firstReachable];
  }

  return departuresWithMargin.slice(0, 2);
}

export function marginTier(minutes: number): "safe" | "tight" | "missed" {
  if (minutes > 10) return "safe";
  if (minutes >= 0) return "tight";
  return "missed";
}

export function formatMarginLabel(minutes: number): { prefix: string; label: string } {
  const abs = Math.abs(minutes);
  const label = abs >= 60 ? `${Math.floor(abs / 60)}h ${abs % 60}m` : `${abs}m`;
  const prefix = minutes > 0 ? "+" : minutes < 0 ? "−" : "";
  return { prefix, label };
}

// ---------------------------------------------------------------------------
// Favorites
// ---------------------------------------------------------------------------

export * from './favorites';
