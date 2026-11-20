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
import HomeLists from "@/components/HomeLists";
import { SectionTitle } from "@/components/List";
import SearchResults from "@/components/SearchResults";
import QuayPanel from "@/components/QuayPanel";
import Spinner from "@/components/Spinner";
import ErrorNotice from "@/components/ErrorNotice";
import SeaBackground from "@/components/SeaBackground";
import { SearchIcon } from "@/components/icons";
import type { Quay, ResultItem, FerryLeg } from "@shared/types";
import { requestJourney } from "@shared/services/journey";
import { suggestQuays } from "@shared/utils";
import { shortQuayName } from "@/lib/quays";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type DestinationStatus =
  | { kind: "resolving"; name: string }
  | { kind: "error"; messageKey: string } // an answer, e.g. no ferry on the route
  | { kind: "failed"; retry: () => void } // the request itself failed
  | null;
type Selection = { quay: Quay; destination: string | null } | null;

/**
 * Map-free ferry board: the search/favourites pane or the selected quay, one at a time, in
 * one centred column (max-w-3xl) at every screen size.
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

  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.id)), [favorites]);
  // Quays already among the favourites aren't suggested again. They're excluded inside
  // suggestQuays, not filtered out first, so they still block the far end of their crossings.
  const suggestions = useMemo(
    () => (userLocation ? suggestQuays(quays, userLocation, 3, favoriteIds) : []),
    [quays, userLocation, favoriteIds],
  );

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

  // Load errors and the place → quay lookup status, above the lists.
  const notices = (
    <>
      {quaysError && <ErrorNotice message={t("search.quaysError")} onRetry={retryQuays} />}
      {destinationStatus?.kind === "failed" && <ErrorNotice message={t("general.loadError")} onRetry={destinationStatus.retry} />}
      {destinationStatus && destinationStatus.kind !== "failed" && (
        <div
          role="status"
          className={`mx-1 flex items-center gap-2 text-sm ${destinationStatus.kind === "error" ? "text-error" : "text-text-secondary"}`}
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
    </>
  );

  return (
    <div className="relative isolate h-full bg-surface-tint">
      <SeaBackground />

      {/* One centred column at every width: home, or the selected quay, never both. */}
      <div className="relative mx-auto flex h-full w-full max-w-3xl flex-col">
        {/* Search pane (kept mounted while a quay is open, so the search state survives) */}
        <div className={`${selection ? "hidden" : "flex"} min-h-0 w-full flex-1 flex-col`}>
          {/* Page header: the title, then the search field. */}
          <div className="flex-shrink-0 px-4 pt-5 text-text-primary">
            <h1 className="mb-3.5 text-balance text-[26px] font-bold leading-tight">{t("home.heroTitle")}</h1>
            <div className="flex items-center gap-2.5">
              <label className="flex h-[58px] min-w-0 flex-1 items-center gap-2.5 rounded-[18px] bg-surface px-4 text-text-secondary shadow-field">
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
                  className="min-w-0 flex-1 bg-transparent text-[18px] text-text-primary outline-none"
                />
                {places.isSearching && <Spinner className="h-5 w-5" />}
              </label>
              {searchOpen && (
                <button type="button" onClick={closeSearch} className="h-11 cursor-pointer px-1 text-[15px]">
                  {t("general.cancel")}
                </button>
              )}
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4 pb-4 pt-[18px]">
            {notices}
            {!showResults && suggestions.length > 0 && (
              <>
                <SectionTitle>{t("home.suggested")}</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => selectQuay(q)}
                      className="h-10 cursor-pointer rounded-full border-[1.5px] border-surface-variant bg-surface px-4 text-[15px] text-text-primary transition-colors hover:bg-surface-tint"
                    >
                      {shortQuayName(q.name)}
                    </button>
                  ))}
                </div>
              </>
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
        <div className={`${selection ? "flex" : "hidden"} min-h-0 w-full min-w-0 flex-1 flex-col`}>
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
    </div>
  );
}
