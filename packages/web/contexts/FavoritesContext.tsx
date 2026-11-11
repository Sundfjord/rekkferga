"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { SavedDestination, ResultItem } from "@shared/types";
import {
  FAVORITES_STORAGE_KEY,
  parseFavorites,
  toggleFavorite as toggle,
  toDestination,
} from "@shared/utils";

interface FavoritesContextType {
  favorites: SavedDestination[];
  toggleFavorite: (result: ResultItem) => void;
  isFavorite: (id: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  toggleFavorite: () => {},
  isFavorite: () => false,
});

function readStored(): SavedDestination[] {
  try {
    return parseFavorites(localStorage.getItem(FAVORITES_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<SavedDestination[]>([]);

  useEffect(() => {
    setFavorites(readStored());
    // Keep other open tabs in sync.
    const onStorage = (e: StorageEvent) => {
      if (e.key === FAVORITES_STORAGE_KEY) setFavorites(parseFavorites(e.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggleFavorite = useCallback((result: ResultItem) => {
    setFavorites((current) => {
      const updated = toggle(current, toDestination(result));
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        /* storage unavailable — keep in memory */
      }
      return updated;
    });
  }, []);

  const value = useMemo(() => {
    const ids = new Set(favorites.map((f) => f.id));
    return { favorites, toggleFavorite, isFavorite: (id: string) => ids.has(id) };
  }, [favorites, toggleFavorite]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
