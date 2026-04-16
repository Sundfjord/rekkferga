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

export interface SavedDestination {
  destination: Destination;
  savedAt: string; // ISO timestamp
}

export interface SearchResult {
  id: string;
  name: string;
  subName?: string;
  latitude: number;
  longitude: number;
  type: 'location';
}

// ---------------------------------------------------------------------------
// Journey & legs
// ---------------------------------------------------------------------------

export interface JourneyResult {
  expectedStartTime: string;
  expectedEndTime: string;
  duration: number; // seconds
  distance: number; // metres
  legs: JourneyLeg[];
  trafficDataAvailable?: boolean;
}

export type JourneyLeg =
  | CarLeg
  | FerryLeg;

interface BaseLeg {
  expectedStartTime: string;
  expectedEndTime: string;
  duration: number; // seconds
  distance: number; // metres
  fromPlace: LegPlace;
  toPlace: LegPlace;
}

export interface CarLeg extends BaseLeg {
  mode: 'car';
  geometry?: [number, number][];                                    // road-snapped [[lat, lng], ...]
  alternatives?: Array<{ geometry: [number, number][]; duration: number }>; // HERE alternatives
}

export interface FerryLeg extends BaseLeg {
  mode: 'water';
  fromQuayId: string; // NSR stop place ID
  toQuayId: string;
  departures?: DepartureOption[];
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
  isFirstReachable: boolean;
  relevant: boolean;
  journey: JourneyCall[];
}

export interface JourneyCall {
  time: string;
  realtime: boolean;
  stopPlaceName: string;
}

// ---------------------------------------------------------------------------
// Generic
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  data: T;
  error?: string;
  timestamp: string;
}
