import type { Quay, QuayRoute, QuayDepartures, QuayNext } from '../types';
import { getJson } from './api';

// All functions throw ApiError (./api) when the request fails, so the UI can show an error
// instead of presenting a failure as "no results".

export async function fetchQuays(apiUrl: string): Promise<Quay[]> {
  const data = await getJson<Quay[]>(`${apiUrl}/quays`);
  return Array.isArray(data) ? data : [];
}

export function fetchQuayRoute(apiUrl: string, fromLat: number, fromLng: number, quayId: string): Promise<QuayRoute> {
  return getJson<QuayRoute>(`${apiUrl}/quay/route?from=${fromLat},${fromLng}&quayId=${encodeURIComponent(quayId)}`);
}

/** `arrivalTime` omitted → departures without margins (e.g. no user location). */
export async function fetchQuayDepartures(
  apiUrl: string,
  quayId: string,
  arrivalTime?: string,
  limit = 4,
): Promise<QuayDepartures> {
  const arrival = arrivalTime ? `&arrivalTime=${encodeURIComponent(arrivalTime)}` : '';
  const data = await getJson<Partial<QuayDepartures>>(
    `${apiUrl}/quay/departures?quayId=${encodeURIComponent(quayId)}${arrival}&limit=${limit}`,
  );
  return {
    departures: Array.isArray(data.departures) ? data.departures : [],
    selectedDeparture: data.selectedDeparture ?? null,
  };
}

/** Next few departures + drive time for each quay, in one request. `from` enables drive times. */
export async function fetchQuaysNext(
  apiUrl: string,
  quayIds: string[],
  from: [number, number] | null,
): Promise<QuayNext[]> {
  if (quayIds.length === 0) return [];
  const origin = from ? `&from=${from[0]},${from[1]}` : '';
  const data = await getJson<QuayNext[]>(`${apiUrl}/quays/next?ids=${quayIds.map(encodeURIComponent).join(',')}${origin}`);
  return Array.isArray(data) ? data : [];
}
