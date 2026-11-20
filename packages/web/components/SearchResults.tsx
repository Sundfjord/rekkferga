"use client";

import type { Quay, SearchResult } from "@shared/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useFavorites } from "@/contexts/FavoritesContext";
import { destinationNames } from "@/lib/quays";
import { FerryIcon, HeartIcon, PlaceIcon } from "@/components/icons";
import { IconTile, ListCard, ROW, RowText, SectionTitle } from "@/components/List";
import ErrorNotice from "@/components/ErrorNotice";

const MAX_QUAY_HITS = 8;

function Highlight({ text, query }: { text: string; query: string }) {
  const i = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      {/* Names are bold already, so the match stands out by colour. */}
      <span className="text-water-light">{text.slice(i, i + query.length)}</span>
      {text.slice(i + query.length)}
    </>
  );
}

/** One field, two kinds of result: quays (local, instant) and places (/search, debounced). */
export default function SearchResults({
  query,
  quays,
  quaysById,
  places,
  placesSettled,
  placesError,
  onRetryPlaces,
  onSelectQuay,
  onSelectPlace,
}: {
  query: string;
  quays: Quay[];
  quaysById: Map<string, Quay>;
  places: SearchResult[];
  placesSettled: boolean;
  /** The place search request failed — shown as an error, never as "no results". */
  placesError: boolean;
  onRetryPlaces: () => void;
  onSelectQuay: (quay: Quay) => void;
  onSelectPlace: (place: SearchResult) => void;
}) {
  const t = useTranslation();
  const { isFavorite } = useFavorites();
  const q = query.trim();
  if (!q) return null;

  const ql = q.toLowerCase();
  const quayHits = quays
    .filter((quay) => quay.name.toLowerCase().includes(ql) || quay.subName?.toLowerCase().includes(ql))
    .sort((a, b) => Number(isFavorite(b.id)) - Number(isFavorite(a.id)))
    .slice(0, MAX_QUAY_HITS);
  const noResults = quayHits.length === 0 && places.length === 0 && placesSettled && !placesError;

  return (
    <div className="flex flex-col gap-2.5">
      {quayHits.length > 0 && (
        <>
          <SectionTitle>{t("search.ferryQuays")}</SectionTitle>
          <ListCard>
            {quayHits.map((quay) => {
              const dests = destinationNames(quay, quaysById);
              return (
                <button
                  key={quay.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onSelectQuay(quay)}
                  className={ROW}
                >
                  <IconTile>
                    <FerryIcon />
                  </IconTile>
                  <RowText
                    name={<Highlight text={quay.name} query={q} />}
                    sub={dests.length > 0 ? t("home.toDestinations", { destinations: dests.join(", ") }) : undefined}
                  />
                  {isFavorite(quay.id) && <HeartIcon filled size={18} className="text-favorite" />}
                </button>
              );
            })}
          </ListCard>
        </>
      )}

      {places.length > 0 && (
        <>
          <SectionTitle>{t("search.places")}</SectionTitle>
          <ListCard>
            {places.map((place) => (
              <button
                key={place.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelectPlace(place)}
                className={ROW}
              >
                <IconTile>
                  <PlaceIcon />
                </IconTile>
                <RowText name={<Highlight text={place.name} query={q} />} sub={place.subName} />
              </button>
            ))}
          </ListCard>
        </>
      )}

      {placesError && <ErrorNotice message={t("search.placesError")} onRetry={onRetryPlaces} />}

      {noResults && (
        <p role="status" className="mx-1 text-[15px] text-text-secondary">
          {t("search.noResults", { query: q })}
        </p>
      )}
    </div>
  );
}
