// Shared types for Rekkferga platform

// ---------------------------------------------------------------------------
// Search & saved destinations
// ---------------------------------------------------------------------------

export interface Destination {
  id: string;
  name: string;
  subName?: string;
  latitude: number;
  longitude: number;
}

export interface SavedDestination extends Destination {
  savedAt: string; // ISO timestamp
  type: 'favorite';
}

export interface SearchResult {
  id: string;
  name: string;
  subName?: string;
  latitude: number;
  longitude: number;
  type: 'location';
}

export type ResultItem = SearchResult | SavedDestination;

// ---------------------------------------------------------------------------
// Journey & legs
// ---------------------------------------------------------------------------

export interface JourneyResult {
  expectedStartTime?: string;
  expectedEndTime: string;
  duration: number; // seconds
  travelDurationSeconds?: number; // sum of leg durations
  waitDurationSeconds?: number; // time spent waiting between legs
  totalDurationSeconds?: number; // travel + wait
  trafficDataAvailable?: boolean;
  legs: JourneyLeg[];
}

export type JourneyLeg =
  | CarLeg
  | FerryLeg;

interface BaseLeg {
  duration: number; // seconds
  distance: number; // metres
  fromPlace: LegPlace;
  toPlace: LegPlace;
}

export interface CarLeg extends BaseLeg {
  mode: 'car';
  geometry?: [number, number][];                                    // road-snapped [[lat, lng], ...]
}

export interface FerryLeg extends BaseLeg {
  mode: 'water';
  fromQuayId: string; // NSR stop place ID
  toQuayId: string;
  departures?: DepartureOption[];
  selectedDeparture?: DepartureOption; // server-selected departure for canonical timing
}

export interface LegPlace {
  name: string;
  latitude?: number;
  longitude?: number;
}

// ---------------------------------------------------------------------------
// Departures
// ---------------------------------------------------------------------------

export interface DepartureOption {
  expectedDepartureTime: string;
  realtime: boolean;
  marginMinutes: number | null; // positive = buffer (will make it), negative = will miss; null = unavailable
}

// ---------------------------------------------------------------------------
// Trip state
// ---------------------------------------------------------------------------

export type TripState = 'driving_to_quay' | 'at_quay' | 'crossing' | 'crossing_complete' | 'arrived';

// ---------------------------------------------------------------------------
// Generic
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  data: T;
  error?: string;
  timestamp: string;
}
