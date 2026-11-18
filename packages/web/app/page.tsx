"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { useQuays } from "@/hooks/useQuays";
import { estimateArrival, useDriveTimes } from "@/hooks/useDriveTimes";
import { usePosition } from "@/hooks/usePosition";
import { useNow } from "@/hooks/useNow";
import { useQuayDepartures } from "@/hooks/useQuayDepartures";
import { useFavoriteNext } from "@/hooks/useFavoriteNext";
import { useDestinationSearch } from "@/hooks/useDestinationSearch";
import { useTranslation } from "@/hooks/useTranslation";
import { useFavorites } from "@/contexts/FavoritesContext";
import Band from "@/components/Band";
import HomeLists from "@/components/HomeLists";
import SearchResults from "@/components/SearchResults";
import QuayPanel from "@/components/QuayPanel";
import Spinner from "@/components/Spinner";
import ErrorNotice from "@/components/ErrorNotice";
import SeaBackground from "@/components/SeaBackground";
import { SearchIcon } from "@/components/icons";
import type { Quay, ResultItem, FerryLeg } from "@shared/types";
import { requestJourney } from "@shared/services/journey";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type DestinationStatus =
  | { kind: "resolving"; name: string }
  | { kind: "error"; messageKey: string } // an answer, e.g. no ferry on the route
  | { kind: "failed"; retry: () => void } // the request itself failed
  | null;
type Selection = { quay: Quay; destination: string | null } | null;

/**
 * Map-free ferry board. Two panes in one responsive layout: search/favourites, and the
 * selected quay. On a phone only one pane shows at a time; from `lg` they sit side by side.
 */
export default function Home() {
  const t = useTranslation();
  const { quays, error: quaysError, retry: retryQuays } = useQuays();
  const { favorites } = useFavorites();
  const [selection, setSelection] = useState<Selection>(null);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [destinationStatus, setDestinationStatus] = useState<DestinationStatus>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Bumped on every selection so a slow destination lookup can't override a newer choice.
  const selectionTokenRef = useRef(0);

  // `position` follows every GPS fix; `userLocation` only moves after ~1 km (re-sorts and
  // re-fetches key off it), and polls read the latest fix through `getPosition`.
  const { position, location: userLocation, getPosition } = usePosition();

  const quaysById = useMemo(() => new Map(quays.map((q) => [q.id, q])), [quays]);
  const favoriteQuayIds = useMemo(() => favorites.filter((f) => quaysById.has(f.id)).map((f) => f.id), [favorites, quaysById]);
  // One drive time per quay and one clock for every view, so favourites and the quay
  // overview always show the same drive time and margin.
  const now = useNow();
  const driveTimes = useDriveTimes();
  const arrivalFor = useCallback((id: string) => estimateArrival(now, driveTimes.get(id), position), [now, driveTimes, position]);
  const favoriteNext = useFavoriteNext(favoriteQuayIds, userLocation, getPosition, driveTimes.put);
  const places = useDestinationSearch(searchOpen ? query : "", userLocation);

  const quay = selection?.quay ?? null;
  // Multi-crossing quays fetch more so each crossing still has departures when filtered.
  const departures = useQuayDepartures(
    quay,
    userLocation !== null,
    getPosition,
    quay && quay.relatedQuayIds.length > 1 ? 12 : 5,
    driveTimes.get,
    driveTimes.put,
  );

  const closeSearch = useCallback(() => {
    setQuery("");
    setSearchOpen(false);
    inputRef.current?.blur();
  }, []);

  const selectQuay = useCallback(
    (q: Quay, destination: string | null = null) => {
      selectionTokenRef.current++;
      setDestinationStatus(null);
      setSelection({ quay: q, destination });
      closeSearch();
    },
    [closeSearch],
  );

  // A place (search result or legacy saved place) → the FIRST ferry quay on the route there,
  // pre-filtered to the crossing that route takes.
  const selectPlace = useCallback(
    async (place: ResultItem) => {
      if (!API_URL) return;
      if (!userLocation) {
        setDestinationStatus({ kind: "error", messageKey: "search.locationRequired" });
        return;
      }
      const token = ++selectionTokenRef.current;
      setDestinationStatus({ kind: "resolving", name: place.name });
      let journeys;
      try {
        journeys = await requestJourney(API_URL, userLocation[0], userLocation[1], place.latitude, place.longitude);
      } catch {
        // The request failed — say so (with a retry), rather than "no ferry on this route".
        if (token === selectionTokenRef.current) setDestinationStatus({ kind: "failed", retry: () => selectPlace(place) });
        return;
      }
      if (token !== selectionTokenRef.current) return;
      for (const journey of journeys) {
        const ferry = journey.legs.find((l): l is FerryLeg => l.mode === "water" && !!l.fromQuayId);
        const q = ferry?.fromQuayId ? quaysById.get(ferry.fromQuayId) : undefined;
        if (q) return selectQuay(q, ferry?.toQuayId ?? null);
      }
      setDestinationStatus({ kind: "error", messageKey: "search.noRouteQuays" });
    },
    [userLocation, quaysById, selectQuay],
  );

  const showResults = searchOpen && query.trim().length > 0;

  return (
    <div className="relative isolate flex h-full lg:gap-6 lg:px-6" style={{ backgroundColor: "var(--surface-tint)" }}>
      <SeaBackground />

      {/* Search pane */}
      <div className={`${selection ? "hidden lg:flex" : "flex"} relative min-h-0 w-full flex-col lg:w-[400px] lg:flex-none`}>
        <Band>
          <div className="flex items-center gap-2.5">
            <label
              className="flex h-[54px] min-w-0 flex-1 items-center gap-2.5 rounded-[18px] px-4 shadow-[0_2px_10px_rgba(1,22,56,0.18)]"
              style={{ backgroundColor: "var(--surface)", color: "var(--text-secondary)" }}
            >
              <SearchIcon />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={(e) => e.key === "Escape" && closeSearch()}
                aria-label={t("search.placeholder")}
                placeholder={t("search.placeholder")}
                className="min-w-0 flex-1 bg-transparent text-[17px] outline-none"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-dm-sans)" }}
              />
              {places.isSearching && <Spinner className="h-5 w-5" />}
            </label>
            {searchOpen && (
              <button type="button" onClick={closeSearch} className="h-11 cursor-pointer px-1 text-[15px]">
                {t("general.cancel")}
              </button>
            )}
          </div>
        </Band>

        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-3.5 pb-4 pt-[18px] lg:px-0">
          {quaysError && <ErrorNotice message={t("search.quaysError")} onRetry={retryQuays} />}
          {destinationStatus?.kind === "failed" && <ErrorNotice message={t("general.loadError")} onRetry={destinationStatus.retry} />}
          {destinationStatus && destinationStatus.kind !== "failed" && (
            <div
              role="status"
              aria-live="polite"
              className="mx-1 flex items-center gap-2 text-sm"
              style={{ color: destinationStatus.kind === "error" ? "var(--error)" : "var(--text-secondary)" }}
            >
              {destinationStatus.kind === "resolving" ? (
                <>
                  <Spinner />
                  <span className="truncate">{t("search.findingQuay", { place: destinationStatus.name })}</span>
                </>
              ) : (
                <span>{t(destinationStatus.messageKey)}</span>
              )}
            </div>
          )}
          {showResults ? (
            <SearchResults
              query={query}
              quays={quays}
              quaysById={quaysById}
              places={places.results}
              placesSettled={places.settled}
              placesError={places.error}
              onRetryPlaces={places.retry}
              onSelectQuay={selectQuay}
              onSelectPlace={selectPlace}
            />
          ) : (
            <HomeLists
              favorites={favorites}
              quaysById={quaysById}
              favoriteNext={favoriteNext}
              arrivalFor={arrivalFor}
              now={now}
              onSelectQuay={selectQuay}
              onSelectPlace={selectPlace}
            />
          )}
        </div>
      </div>

      {/* Quay pane */}
      <div className={`${selection ? "flex" : "hidden lg:flex"} relative min-h-0 w-full min-w-0 flex-1 flex-col`}>
        {selection && (
          <QuayPanel
            key={`${selection.quay.id}|${selection.destination ?? ""}`}
            quay={selection.quay}
            quaysById={quaysById}
            initialDestination={selection.destination}
            onBack={() => setSelection(null)}
            {...departures}
            drive={driveTimes.get(selection.quay.id) ?? null}
            arrivalAt={arrivalFor(selection.quay.id)}
            now={now}
          />
        )}
      </div>
    </div>
  );
}
