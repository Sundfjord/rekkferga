import type { JourneyResult, SearchResult } from "@shared/types";

// Module-level store for passing trip data between screens.
// Lives in memory for the app session — no persistence needed.
let _journey: JourneyResult | null = null;
let _destination: SearchResult | null = null;

export function setTripData(journey: JourneyResult, destination: SearchResult) {
  _journey = journey;
  _destination = destination;
}

export function getTripData(): { journey: JourneyResult | null; destination: SearchResult | null } {
  return { journey: _journey, destination: _destination };
}

export function clearTripData() {
  _journey = null;
  _destination = null;
}
