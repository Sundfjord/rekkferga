// Shared constants for Rekkferga platform

export const API_ENDPOINTS = {
  JOURNEY: '/journey',
  QUAY_DEPARTURES: '/quay/departures',
  SEARCH: '/search',
} as const;

export const TRANSPORT_MODES = {
  WATER: 'water',
  BUS: 'bus',
  TRAIN: 'train',
  CAR: 'car',
  WALK: 'foot'
} as const;

export const REGIONS = {
  VESTLAND: 'Vestland',
  ROGALAND: 'Rogaland',
  MØRE_OG_ROMSDAL: 'Møre og Romsdal',
  TRØNDELAG: 'Trøndelag',
  NORDLAND: 'Nordland',
  TROMS_OG_FINNMARK: 'Troms og Finnmark'
} as const;

export const DEFAULT_LIMITS = {
  SEARCH_RESULTS: 30,
  NEARBY_QUAYS: 10,
  FAVORITES: 20
} as const;

export const CACHE_DURATIONS = {
  QUAY_LIST: 300, // 5 minutes
  DEPARTURES: 60, // 1 minute
  ROUTES: 600, // 10 minutes
  SEARCH: 3600 // 1 hour
} as const;
