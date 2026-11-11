"use client";

import { useEffect, useState } from "react";
import type { QuayNext } from "@shared/types";
import { fetchQuaysNext } from "@shared/services/quay";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const REFRESH_MS = 120_000;

export interface FavoriteNext {
  byId: Map<string, QuayNext>;
  /** True once a load has finished (even a failed one), so cards can stop showing a placeholder. */
  loaded: boolean;
}

/** Next reachable departure per favourite quay, keyed by quay id; refreshed every 2 min. */
export function useFavoriteNext(quayIds: string[], userLocation: [number, number] | null): FavoriteNext {
  const [state, setState] = useState<FavoriteNext>({ byId: new Map(), loaded: false });
  const key = quayIds.join(",");

  useEffect(() => {
    if (!API_URL || !key) {
      setState({ byId: new Map(), loaded: true });
      return;
    }
    const apiUrl = API_URL;
    let cancelled = false;
    const load = async () => {
      const rows = await fetchQuaysNext(apiUrl, key.split(","), userLocation);
      if (!cancelled) setState({ byId: new Map(rows.map((r) => [r.quayId, r])), loaded: true });
    };
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [key, userLocation]);

  return state;
}
