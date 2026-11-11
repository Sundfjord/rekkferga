import type { Quay, QuayRoute, QuayDepartures } from '../types';

const EMPTY_DEPARTURES: QuayDepartures = { departures: [], selectedDeparture: null };

// Network failures resolve to the empty value instead of throwing, so callers can always
// leave their loading state.
async function getJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url);
    return res.ok ? ((await res.json()) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function fetchQuays(apiUrl: string): Promise<Quay[]> {
  const data = await getJson<Quay[]>(`${apiUrl}/quays`, []);
  return Array.isArray(data) ? data : [];
}

export function fetchQuayRoute(
  apiUrl: string,
  fromLat: number,
  fromLng: number,
  quayId: string,
): Promise<QuayRoute | null> {
  return getJson<QuayRoute | null>(
    `${apiUrl}/quay/route?from=${fromLat},${fromLng}&quayId=${encodeURIComponent(quayId)}`,
    null,
  );
}

/** `arrivalTime` omitted → departures without margins (e.g. no user location). */
export async function fetchQuayDepartures(
  apiUrl: string,
  quayId: string,
  arrivalTime?: string,
): Promise<QuayDepartures> {
  const arrival = arrivalTime ? `&arrivalTime=${encodeURIComponent(arrivalTime)}` : '';
  const data = await getJson<Partial<QuayDepartures>>(
    `${apiUrl}/quay/departures?quayId=${encodeURIComponent(quayId)}${arrival}`,
    EMPTY_DEPARTURES,
  );
  return {
    departures: Array.isArray(data.departures) ? data.departures : [],
    selectedDeparture: data.selectedDeparture ?? null,
  };
}
