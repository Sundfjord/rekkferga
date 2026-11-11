import type { Quay, QuayRoute, QuayDepartures, QuayNext } from '../types';

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
  limit = 4,
): Promise<QuayDepartures> {
  const arrival = arrivalTime ? `&arrivalTime=${encodeURIComponent(arrivalTime)}` : '';
  const data = await getJson<Partial<QuayDepartures>>(
    `${apiUrl}/quay/departures?quayId=${encodeURIComponent(quayId)}${arrival}&limit=${limit}`,
    EMPTY_DEPARTURES,
  );
  return {
    departures: Array.isArray(data.departures) ? data.departures : [],
    selectedDeparture: data.selectedDeparture ?? null,
  };
}

/** Next reachable departure for each quay, in one request. `from` enables margins. */
export async function fetchQuaysNext(
  apiUrl: string,
  quayIds: string[],
  from: [number, number] | null,
): Promise<QuayNext[]> {
  if (quayIds.length === 0) return [];
  const origin = from ? `&from=${from[0]},${from[1]}` : '';
  const data = await getJson<QuayNext[]>(
    `${apiUrl}/quays/next?ids=${quayIds.map(encodeURIComponent).join(',')}${origin}`,
    [],
  );
  return Array.isArray(data) ? data : [];
}
