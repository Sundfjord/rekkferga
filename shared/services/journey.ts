import type { JourneyResult, FerryLeg, CarLeg, DepartureOption } from '../types';
import { calculateDistance } from '../utils';

export function estimateRemainingSeconds(leg: CarLeg, currentLat: number, currentLng: number): number {
  const geometry = leg.geometry;
  if (!geometry || geometry.length < 2) {
    const totalKm = leg.distance / 1000;
    const remainingKm = calculateDistance(currentLat, currentLng, leg.toPlace.latitude ?? 0, leg.toPlace.longitude ?? 0);
    return totalKm > 0 ? leg.duration * Math.min(1, remainingKm / totalKm) : leg.duration;
  }
  let nearestIdx = 0;
  let nearestDist = Infinity;
  for (let i = 0; i < geometry.length; i++) {
    const d = calculateDistance(currentLat, currentLng, geometry[i][0], geometry[i][1]);
    if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
  }
  let remainingKm = 0;
  let totalKm = 0;
  for (let i = 0; i < geometry.length - 1; i++) {
    const d = calculateDistance(geometry[i][0], geometry[i][1], geometry[i + 1][0], geometry[i + 1][1]);
    totalKm += d;
    if (i >= nearestIdx) remainingKm += d;
  }
  return totalKm > 0 ? leg.duration * (remainingKm / totalKm) : leg.duration;
}

export async function fetchJourney(apiUrl: string, fromLat: number, fromLng: number, toLat: number, toLng: number): Promise<JourneyResult[]> {
  const res = await fetch(`${apiUrl}/journey?from=${fromLat},${fromLng}&to=${toLat},${toLng}`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchDeparturesForLeg(apiUrl: string, ferryLeg: FerryLeg, arrivalTime: string): Promise<DepartureOption[]> {
  if (!ferryLeg.fromQuayId || !ferryLeg.toQuayId) return [];
  try {
    const res = await fetch(
      `${apiUrl}/quay/departures?quayId=${ferryLeg.fromQuayId}&toQuayId=${ferryLeg.toQuayId}&arrivalTime=${encodeURIComponent(arrivalTime)}`
    );
    if (!res.ok) return [];
    const data: DepartureOption[] | Record<string, DepartureOption[]> = await res.json();
    if (Array.isArray(data)) return data;

    const destName = ferryLeg.toPlace.name;
    const key =
      Object.keys(data).find((k) => k === destName) ??
      Object.keys(data).find((k) => k.toLowerCase() === destName.toLowerCase()) ??
      Object.keys(data)[0];
    return key ? (data[key] ?? []) : [];
  } catch {
    return [];
  }
}
