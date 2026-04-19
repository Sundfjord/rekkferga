import type { Destination, SavedDestination, SearchResult } from '../types';

export const MAX_FAVORITES = 20;
export const FAVORITES_STORAGE_KEY = 'rekkferga-favorites';

export function toDestination(result: SearchResult): Destination {
  return {
    id: result.id,
    name: result.name,
    subName: result.subName,
    latitude: result.latitude,
    longitude: result.longitude,
  };
}

export function isFavorite(favorites: SavedDestination[], id: string): boolean {
  return favorites.some(f => f.destination.id === id);
}

export function addFavorite(favorites: SavedDestination[], destination: Destination): SavedDestination[] {
  if (isFavorite(favorites, destination.id)) return favorites;
  const entry: SavedDestination = {
    destination,
    savedAt: new Date().toISOString(),
  };
  const updated = [entry, ...favorites];
  return updated.slice(0, MAX_FAVORITES);
}

export function removeFavorite(favorites: SavedDestination[], id: string): SavedDestination[] {
  return favorites.filter(f => f.destination.id !== id);
}

export function toggleFavorite(favorites: SavedDestination[], destination: Destination): SavedDestination[] {
  if (isFavorite(favorites, destination.id)) {
    return removeFavorite(favorites, destination.id);
  }
  return addFavorite(favorites, destination);
}

export function parseFavorites(json: string | null): SavedDestination[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}
