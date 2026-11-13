import type { JourneyResult } from '../types';
import { getJson } from './api';

/** Journeys from → to. Throws ApiError when the request fails (used by the web app). */
export async function requestJourney(apiUrl: string, fromLat: number, fromLng: number, toLat: number, toLng: number): Promise<JourneyResult[]> {
  const data = await getJson<JourneyResult[]>(`${apiUrl}/journey?from=${fromLat},${fromLng}&to=${toLat},${toLng}`);
  return Array.isArray(data) ? data : [];
}
