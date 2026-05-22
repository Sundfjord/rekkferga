import type { Quay, QuayRoute, QuayDepartures } from '../types';

export async function fetchQuays(apiUrl: string): Promise<Quay[]> {
  const res = await fetch(`${apiUrl}/quays`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchQuayRoute(
  apiUrl: string,
  fromLat: number,
  fromLng: number,
  quayId: string,
): Promise<QuayRoute | null> {
  const res = await fetch(
    `${apiUrl}/quay/route?from=${fromLat},${fromLng}&quayId=${encodeURIComponent(quayId)}`,
  );
  if (!res.ok) return null;
  return res.json();
}

export async function fetchQuayDepartures(
  apiUrl: string,
  quayId: string,
  arrivalTime: string,
): Promise<QuayDepartures> {
  try {
    const res = await fetch(
      `${apiUrl}/quay/departures?quayId=${encodeURIComponent(quayId)}&arrivalTime=${encodeURIComponent(arrivalTime)}`,
    );
    if (!res.ok) return { departures: [], selectedDeparture: null };
    const data = await res.json();
    return {
      departures: Array.isArray(data.departures) ? data.departures : [],
      selectedDeparture: data.selectedDeparture ?? null,
    };
  } catch {
    return { departures: [], selectedDeparture: null };
  }
}
