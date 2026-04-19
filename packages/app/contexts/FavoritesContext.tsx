import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SavedDestination, SearchResult } from "@shared/types";
import {
  FAVORITES_STORAGE_KEY,
  parseFavorites,
  toggleFavorite as toggle,
  isFavorite as checkFavorite,
  toDestination,
} from "@shared/utils";

interface FavoritesContextType {
  favorites: SavedDestination[];
  toggleFavorite: (result: SearchResult) => void;
  isFavorite: (id: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  toggleFavorite: () => {},
  isFavorite: () => false,
});

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<SavedDestination[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_STORAGE_KEY).then((saved) => {
      setFavorites(parseFavorites(saved));
    });
  }, []);

  const handleToggle = async (result: SearchResult) => {
    const updated = toggle(favorites, toDestination(result));
    setFavorites(updated);
    await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
  };

  const handleCheck = (id: string) => checkFavorite(favorites, id);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite: handleToggle, isFavorite: handleCheck }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
