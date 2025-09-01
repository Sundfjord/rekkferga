// Base types for the Rekkferga application
// Adapted from fergo project types for Next.js/TypeScript

// Search and location types
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

// Journey and departure types
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

// Route and leg types
export type Leg = {
  duration: number;
  distance: number;
  via: string[];
  expectedEndTime: string;
  expectedStartTime: string;
  fromPlace: { name: string; quay: null };
  toPlace: { name: string; quay: null };
  mode: string;
  realtime: boolean;
  // Additional fields for map integration
  steps?: RouteStep[];
  geometry?: RouteGeometry;
};

export type Route = {
  duration: number;
  distance: number;
  expectedEndTime: string;
  legs: Leg[];
};

// Quay types
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

// Map and route visualization types
export type RouteStep = {
  latitude: number;
  longitude: number;
  mode?: string;
  name?: string;
  duration?: number;
  distance?: number;
};

export type RouteGeometry = {
  type: "LineString";
  coordinates: [number, number][]; // [longitude, latitude]
};

export type RouteSegment = {
  coordinates: [number, number][];
  mode: string;
  color: string;
  duration?: number;
  distance?: number;
};

// API response types
export type ApiResponse<T> = {
  data: T;
  status: "success" | "error";
  message?: string;
  timestamp: string;
};

export type EnTurJourneyResponse = {
  data?: {
    plan?: {
      itineraries?: EnTurItinerary[];
    };
  };
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
  }>;
};

export type EnTurItinerary = {
  startTime: string;
  endTime: string;
  duration: number;
  legs: EnTurLeg[];
};

export type EnTurLeg = {
  mode: string;
  from: EnTurPlace;
  to: EnTurPlace;
  distance: number;
  duration: number;
  steps?: EnTurStep[];
  geometry?: EnTurGeometry;
  coordinates?: EnTurCoordinate[];
  encodedGeometry?: string;
  waypoints?: EnTurCoordinate[];
};

export type EnTurPlace = {
  name: string;
  place?: {
    lat: number;
    lon: number;
  };
};

export type EnTurStep = {
  latitude: number;
  longitude: number;
  mode?: string;
  duration?: number;
  distance?: number;
};

export type EnTurGeometry = {
  points?: EnTurCoordinate[];
};

export type EnTurCoordinate = {
  lat: number;
  lon: number;
};

// Theme and UI types
export type ThemeMode = "light" | "dark" | "system";

export type ThemeColors = {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryText: string;
  textOnPrimary: string;
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  secondaryText: string;
  textOnSecondary: string;
  surface: string;
  surfaceVariant: string;
  background: string;
  textPrimary: string;
  textSecondary: string;
  textDisabled: string;
  border: string;
  borderVariant: string;
  error: string;
  errorText: string;
  success: string;
  successText: string;
};

// Component prop types
export type HeaderProps = {
  onToggleSettings?: () => void;
  showSettings?: boolean;
};

export type ThemeProviderProps = {
  children: React.ReactNode;
  [key: string]: any;
};

export type ThemeWrapperProps = {
  children: React.ReactNode;
};

export type RouteMapProps = {
  routeData: {
    legs: Array<{
      mode: string;
      steps: RouteStep[];
      duration?: number;
      distance?: number;
      from?: { name: string; place?: { lat: number; lon: number } };
      to?: { name: string; place?: { lat: number; lon: number } };
    }>;
  };
  center?: [number, number];
  zoom?: number;
};

export type RouteDisplayProps = {
  routeData: EnTurJourneyResponse;
  onRouteSelect?: (routeIndex: number) => void;
};

// Utility types
export type Coordinates = [number, number]; // [latitude, longitude]
export type MapBounds = [[number, number], [number, number]]; // [[south, west], [north, east]]

// Language and internationalization
export type Language = "en" | "no" | "nn";

export type Translations = {
  [key: string]: string;
};

// Date and time utilities
export type DateInput = string | Date | number;
export type TimeFormat = "12h" | "24h";
