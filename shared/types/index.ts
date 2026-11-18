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
// Quays (quay-centric model)
// ---------------------------------------------------------------------------

export interface Quay {
  id: string; // EnTur NSR stop-place id
  name: string;
  latitude: number;
  longitude: number;
  relatedQuayIds: string[]; // NSR ids of connected (destination) quays
  subName?: string;
}

export interface QuayRoute {
  durationSeconds: number; // traffic-aware drive time to the quay
  typicalDurationSeconds: number | null; // with the traffic usual for this weekday and time
}

/** Next few departures + drive time for one quay (favourites), from GET /quays/next. */
export interface QuayNext {
  quayId: string;
  driveSeconds: number | null;
  typicalDriveSeconds: number | null; // with usual traffic; null when unknown
  departures: DepartureOption[];
}

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
}

export interface FerryLeg extends BaseLeg {
  mode: 'water';
  fromQuayId: string; // NSR stop place ID
  toQuayId: string;
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
  expectedDepartureTime: string; // realtime estimate when `realtime`, else the timetable
  aimedDepartureTime?: string | null; // timetable time
  realtime: boolean;
  marginMinutes: number | null; // positive = buffer (will make it), negative = will miss; null = unavailable
  viaNames?: string[]; // stops called at between the departure quay and the end destination
  viaQuayIds?: string[]; // NSR ids of those stops (quay-centric API), for crossing filters
  destinationQuayId?: string; // quay-centric: the destination quay this departure serves
  destinationName?: string;
}

export interface QuayDepartures {
  departures: DepartureOption[];
  selectedDeparture: DepartureOption | null;
}
