// Shared types for Rekkferga platform

export interface QuayDetails {
  id: string;
  name: string;
  municipality: string;
  region: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

export interface Departure {
  destination: string;
  departureTime: string;
  expectedDepartureTime: string;
  realTime: boolean;
  line?: string;
  transportMode?: string;
}

export interface Route {
  duration: number;
  distance: number;
  expectedEndTime?: string;
  legs: RouteLeg[];
}

export interface RouteLeg {
  mode: string;
  fromPlace: Place;
  toPlace: Place;
  line?: Line;
  duration: number;
  distance: number;
}

export interface Place {
  name: string;
  latitude: number;
  longitude: number;
  quay?: QuayDetails;
}

export interface Line {
  id: string;
  name: string;
  transportMode: string;
}

export interface SearchResult {
  id: string;
  name: string;
  sub_name?: string;
  latitude: number;
  longitude: number;
  type: 'quay' | 'location';
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  timestamp: string;
}
