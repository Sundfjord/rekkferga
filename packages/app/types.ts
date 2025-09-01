export type SearchResult = {
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

export type JourneyCall = {
  time: string;
  realtime: boolean;
  stopPlaceName: string;
};

export type Departure = {
  expectedDepartureTime: string;
  realtime: boolean;
  relevant: boolean;
  journey: JourneyCall[];
  isFirstReachableDeparture: boolean;
};

export type Leg = {
  duration: number;
  distance: number;
  via: string[];
  expectedEndTime: string;
  expectedStartTime: string;
  fromPlace: { name: string; quay: null };
  mode: string;
  realtime: boolean;
  toPlace: { name: string; quay: null };
};

type Route = {
  duration: number;
  distance: number;
  expectedEndTime: string;
  legs: Leg[];
};

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
