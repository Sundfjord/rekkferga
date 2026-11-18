"use client";

import type { Quay, QuayNext, SavedDestination } from "@shared/types";
import type { FavoriteNext } from "@/hooks/useFavoriteNext";
import { formatDuration } from "@shared/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { TIER_COLOR, destinationText, nextReachable, splitMargin, tierOf, withLiveMargins } from "@/lib/departures";
import { ChevronRightIcon, PlaceIcon } from "@/components/icons";
import DepartureTime from "@/components/DepartureTime";
import ErrorNotice from "@/components/ErrorNotice";

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mx-1 mt-1 text-[13px] font-normal" style={{ color: "var(--text-secondary)" }}>
      {children}
    </h2>
  );
}

export const LIST_CARD = "overflow-hidden rounded-[20px] shadow-[0_1px_3px_rgba(1,22,56,0.08)]";
export const ROW = "flex min-h-[60px] w-full cursor-pointer items-center gap-3 py-2.5 pl-4 pr-3 text-left transition-colors hover:bg-[var(--surface-tint)]";

/**
 * The favourite's next reachable departure as a tier-coloured block. The margin is computed
 * here from the shared drive time and clock — the same inputs the quay view uses.
 */
function NextBlock({
  next,
  loaded,
  failed,
  arrivalAt,
}: {
  next: QuayNext | undefined;
  loaded: boolean;
  /** The favourites request failed and there is no earlier data for this quay. */
  failed: boolean;
  arrivalAt: Date | null;
}) {
  const t = useTranslation();
  const { language } = useLanguage();
  const base = "flex min-w-[132px] flex-shrink-0 flex-col rounded-[14px] px-3 py-2";

  if (!next && !loaded) {
    return <span className={`${base} h-[58px] animate-pulse`} style={{ backgroundColor: "var(--surface-variant)" }} />;
  }
  const dep = next ? nextReachable(withLiveMargins(next.departures, arrivalAt)) : null;
  if (!dep) {
    return (
      <span className={`${base} justify-center text-[13px]`} style={{ backgroundColor: "var(--surface-variant)", color: "var(--text-secondary)" }}>
        {t(failed ? "general.unavailable" : "home.noNextDeparture")}
      </span>
    );
  }
  const margin = dep.marginMinutes === null ? null : splitMargin(dep.marginMinutes, language);
  const dest = destinationText(dep, t("general.via"));
  return (
    <span className={`${base} text-white`} style={{ backgroundColor: TIER_COLOR[tierOf(dep)] }}>
      <span className="text-[22px] font-bold leading-tight tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
        {margin ? margin.value : <DepartureTime departure={dep} />}
        {margin?.unit && <span className="text-[13px]"> {margin.unit}</span>}
      </span>
      <span className="max-w-[180px] truncate text-xs">
        {margin && <b style={{ fontFamily: "var(--font-mono)" }}><DepartureTime departure={dep} /> </b>}
        {dest}
      </span>
    </span>
  );
}

/**
 * Home: favourites with their next reachable departure (live).
 */
export default function HomeLists({
  favorites,
  quaysById,
  favoriteNext,
  arrivalFor,
  now,
  onSelectQuay,
  onSelectPlace,
}: {
  favorites: SavedDestination[];
  quaysById: Map<string, Quay>;
  favoriteNext: FavoriteNext;
  /** Estimated arrival per quay from the shared drive time (useDriveTimes); null when unknown. */
  arrivalFor: (quayId: string) => Date | null;
  /** Shared clock, so margins match the quay view exactly. */
  now: number;
  onSelectQuay: (quay: Quay) => void;
  onSelectPlace: (place: SavedDestination) => void;
}) {
  const t = useTranslation();
  const { language } = useLanguage();

  return (
    <div className="flex flex-col gap-2.5" style={{ fontFamily: "var(--font-dm-sans)" }}>
      {favorites.length > 0 && (
        <>
          <SectionTitle>{t("favorites.title")}</SectionTitle>
          {favoriteNext.error && <ErrorNotice message={t("home.favoritesError")} onRetry={favoriteNext.retry} />}
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
            const arrivalAt = arrivalFor(quay.id);
            const drive = arrivalAt ? Math.max(0, (arrivalAt.getTime() - now) / 1000) : null;
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
                  {drive != null && (
                    <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                      {t("home.driveAway", { time: formatDuration(drive, language) })}
                    </span>
                  )}
                </span>
                <NextBlock
                  next={next}
                  loaded={favoriteNext.loaded}
                  failed={favoriteNext.error && !next}
                  arrivalAt={arrivalAt}
                />
              </button>
            );
          })}
        </>
      )}
    </div>
  );
}
