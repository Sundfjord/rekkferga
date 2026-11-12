"use client";

import type { Quay, SearchResult } from "@shared/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useFavorites } from "@/contexts/FavoritesContext";
import { destinationNames } from "@/lib/quays";
import { HeartIcon, PlaceIcon } from "@/components/icons";
import { LIST_CARD, ROW, SectionTitle } from "@/components/HomeLists";

const MAX_QUAY_HITS = 8;

function Highlight({ text, query }: { text: string; query: string }) {
  const i = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <b>{text.slice(i, i + query.length)}</b>
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
  onSelectQuay,
  onSelectPlace,
}: {
  query: string;
  quays: Quay[];
  quaysById: Map<string, Quay>;
  places: SearchResult[];
  placesSettled: boolean;
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
  const noResults = quayHits.length === 0 && places.length === 0 && placesSettled;

  return (
    <div className="flex flex-col gap-2.5" style={{ fontFamily: "var(--font-dm-sans)" }}>
      {quayHits.length > 0 && (
        <>
          <SectionTitle>{t("search.ferryQuays")}</SectionTitle>
          <div className={LIST_CARD} style={{ backgroundColor: "var(--surface)" }}>
            {quayHits.map((quay, i) => {
              const dests = destinationNames(quay, quaysById);
              return (
                <button
                  key={quay.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onSelectQuay(quay)}
                  className={ROW}
                  style={{ color: "var(--text-primary)", borderTop: i ? "1px solid var(--surface-variant)" : undefined }}
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-base">
                      <Highlight text={quay.name} query={q} />
                    </span>
                    {dests.length > 0 && (
                      <span className="truncate text-[13px]" style={{ color: "var(--text-secondary)" }}>
                        {t("home.toDestinations", { destinations: dests.join(", ") })}
                      </span>
                    )}
                  </span>
                  {isFavorite(quay.id) && <HeartIcon filled size={18} className="text-[#DC2626]" />}
                </button>
              );
            })}
          </div>
        </>
      )}

      {places.length > 0 && (
        <>
          <SectionTitle>{t("search.places")}</SectionTitle>
          <div className={LIST_CARD} style={{ backgroundColor: "var(--surface)" }}>
            {places.map((place, i) => (
              <button
                key={place.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelectPlace(place)}
                className={ROW}
                style={{ color: "var(--text-primary)", borderTop: i ? "1px solid var(--surface-variant)" : undefined }}
              >
                <PlaceIcon className="text-[var(--water-light)]" />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-base">
                    <Highlight text={place.name} query={q} />
                  </span>
                  {place.subName && (
                    <span className="truncate text-[13px]" style={{ color: "var(--text-secondary)" }}>
                      {place.subName}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {noResults && (
        <p className="mx-1 text-[15px]" style={{ color: "var(--text-secondary)" }}>
          {t("search.noResults", { query: q })}
        </p>
      )}
    </div>
  );
}
