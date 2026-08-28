/**
 * use-admin-pinned-favorites.ts — Chekeo V3
 *
 * Hook para gestionar y persistir los accesos rápidos fijados (Favoritos ⭐)
 * en localStorage del Panel de Control de Admin.
 */

import { useState, useEffect, useCallback } from 'react';
import type { AdminPinnedFavorite } from '../types/admin.types';
import { DEFAULT_PINNED_FAVORITES } from '../constants/admin-navigation.constants';

const STORAGE_KEY = 'chekeo_admin_pinned_favorites';

export function useAdminPinnedFavorites() {
  const [favorites, setFavorites] = useState<AdminPinnedFavorite[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_PINNED_FAVORITES;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return DEFAULT_PINNED_FAVORITES;
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PINNED_FAVORITES;
    } catch {
      return DEFAULT_PINNED_FAVORITES;
    }
  });

  const saveFavorites = useCallback((newFavs: AdminPinnedFavorite[]) => {
    setFavorites(newFavs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavs));
    } catch {
      // localStorage quota or private mode fallback
    }
  }, []);

  const isPinned = useCallback(
    (id: string) => {
      return favorites.some((f) => f.id === id);
    },
    [favorites]
  );

  const togglePin = useCallback(
    (item: AdminPinnedFavorite) => {
      const exists = favorites.some((f) => f.id === item.id);
      if (exists) {
        saveFavorites(favorites.filter((f) => f.id !== item.id));
      } else {
        saveFavorites([...favorites, item]);
      }
    },
    [favorites, saveFavorites]
  );

  const pin = useCallback(
    (item: AdminPinnedFavorite) => {
      if (!favorites.some((f) => f.id === item.id)) {
        saveFavorites([...favorites, item]);
      }
    },
    [favorites, saveFavorites]
  );

  const unpin = useCallback(
    (id: string) => {
      saveFavorites(favorites.filter((f) => f.id !== id));
    },
    [favorites, saveFavorites]
  );

  return {
    favorites,
    isPinned,
    togglePin,
    pin,
    unpin,
  };
}
