import { Departure, Route } from "./index";

// Quay-specific types
export type Quay = {
  id: string;
  name: string;
  municipality: string;
  region: string;
  latitude: number;
  longitude: number;
  distance?: number;
  departures?: Departure[];
  route?: Route;
};

export type QuayDetails = {
  quay: Quay;
  route: Route;
  departuresByDestination?: Record<string, Departure[]>;
};

export type QuaySearchResult = {
  id: string;
  name: string;
  sub_name: string;
  latitude: number;
  longitude: number;
  distance?: number;
  departures?: Departure[];
  route?: Route;
  type: "quay" | "location";
};

// Re-export from index
export type { Departure, Route } from "./index";
