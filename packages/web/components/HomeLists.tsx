"use client";

import type { Quay, QuayNext, SavedDestination } from "@shared/types";
import type { FavoriteNext } from "@/hooks/useFavoriteNext";
import { formatDuration, formatTime } from "@shared/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { TIER_COLOR, destinationLabel, splitMargin, tierOf } from "@/lib/departures";
import { destinationNames } from "@/lib/quays";
import { ChevronRightIcon, PlaceIcon } from "@/components/icons";

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mx-1 mt-1 text-[13px] font-normal" style={{ color: "var(--text-secondary)" }}>
      {children}
    </h2>
  );
}

export const LIST_CARD = "overflow-hidden rounded-[20px] shadow-[0_1px_3px_rgba(1,22,56,0.08)]";
export const ROW = "flex min-h-[60px] w-full cursor-pointer items-center gap-3 py-2.5 pl-4 pr-3 text-left transition-colors hover:bg-[var(--surface-tint)]";

/** The favourite's next reachable departure as a tier-coloured block. */
function NextBlock({ next, loaded }: { next: QuayNext | undefined; loaded: boolean }) {
  const t = useTranslation();
  const { language } = useLanguage();
  const base = "flex min-w-[132px] flex-shrink-0 flex-col rounded-[14px] px-3 py-2";

  if (!next && !loaded) {
    return <span className={`${base} h-[58px] animate-pulse`} style={{ backgroundColor: "var(--surface-variant)" }} />;
  }
  const dep = next?.departure;
  if (!dep) {
    return (
      <span className={`${base} justify-center text-[13px]`} style={{ backgroundColor: "var(--surface-variant)", color: "var(--text-secondary)" }}>
        {t("noNextDeparture")}
      </span>
    );
  }
  const margin = dep.marginMinutes === null ? null : splitMargin(dep.marginMinutes, language);
  const time = formatTime(dep.expectedDepartureTime);
  const dest = destinationLabel(dep);
  return (
    <span className={`${base} text-white`} style={{ backgroundColor: TIER_COLOR[tierOf(dep)] }}>
      <span className="text-[22px] font-bold leading-tight tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
        {margin ? margin.value : time}
        {margin?.unit && <span className="text-[13px]"> {margin.unit}</span>}
      </span>
      <span className="whitespace-nowrap text-xs">
        {margin && <b style={{ fontFamily: "var(--font-mono)" }}>{time} </b>}
        {dest}
      </span>
    </span>
  );
}

/**
 * Home: favourites with their next reachable departure (live), and the nearest quays
 * (ordered by straight-line distance, which is never shown).
 */
export default function HomeLists({
  favorites,
  quaysById,
  favoriteNext,
  nearby,
  onSelectQuay,
  onSelectPlace,
}: {
  favorites: SavedDestination[];
  quaysById: Map<string, Quay>;
  favoriteNext: FavoriteNext;
  nearby: Quay[];
  onSelectQuay: (quay: Quay) => void;
  onSelectPlace: (place: SavedDestination) => void;
}) {
  const t = useTranslation();
  const { language } = useLanguage();

  return (
    <div className="flex flex-col gap-2.5" style={{ fontFamily: "var(--font-dm-sans)" }}>
      {favorites.length > 0 && (
        <>
          <SectionTitle>{t("favorites")}</SectionTitle>
          {favorites.map((f) => {
            const quay = quaysById.get(f.id);
            if (!quay) {
              // A saved place from before the quay-centric redesign: resolve it like a search.
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onSelectPlace(f)}
                  className={`${ROW} rounded-[20px]`}
                  style={{ backgroundColor: "var(--surface)", color: "var(--text-primary)" }}
                >
                  <PlaceIcon className="text-[var(--water-light)]" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-base font-bold">{f.name}</span>
                    {f.subName && <span className="truncate text-[13px]" style={{ color: "var(--text-secondary)" }}>{f.subName}</span>}
                  </span>
                  <ChevronRightIcon size={20} className="text-[var(--text-secondary)]" />
                </button>
              );
            }
            const next = favoriteNext.byId.get(quay.id);
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onSelectQuay(quay)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-[20px] py-2.5 pl-4 pr-2.5 text-left shadow-[0_1px_3px_rgba(1,22,56,0.08)]"
                style={{ backgroundColor: "var(--surface)", color: "var(--text-primary)" }}
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-[17px] font-bold">{quay.name}</span>
                  {next?.driveSeconds != null && (
                    <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                      {t("driveAway", { time: formatDuration(next.driveSeconds, language) })}
                    </span>
                  )}
                </span>
                <NextBlock next={next} loaded={favoriteNext.loaded} />
              </button>
            );
          })}
        </>
      )}

      {nearby.length > 0 && (
        <>
          <SectionTitle>{t("nearbyQuays")}</SectionTitle>
          <div className={LIST_CARD} style={{ backgroundColor: "var(--surface)" }}>
            {nearby.map((quay, i) => {
              const dests = destinationNames(quay, quaysById);
              return (
                <button
                  key={quay.id}
                  type="button"
                  onClick={() => onSelectQuay(quay)}
                  className={ROW}
                  style={{ color: "var(--text-primary)", borderTop: i ? "1px solid var(--surface-variant)" : undefined }}
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-base font-bold">{quay.name}</span>
                    {dests.length > 0 && (
                      <span className="truncate text-[13px]" style={{ color: "var(--text-secondary)" }}>
                        {t("toDestinations", { destinations: dests.join(", ") })}
                      </span>
                    )}
                  </span>
                  <ChevronRightIcon size={20} className="text-[var(--text-secondary)]" />
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
