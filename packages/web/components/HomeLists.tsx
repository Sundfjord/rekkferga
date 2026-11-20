"use client";

import type { Quay, QuayNext, SavedDestination } from "@shared/types";
import type { FavoriteNext } from "@/hooks/useFavoriteNext";
import { secondsUntil } from "@/hooks/useDriveTimes";
import { formatDuration } from "@shared/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { TIER_COLOR, destinationText, nextReachable, splitMargin, tierOf, withLiveMargins } from "@/lib/departures";
import { shortQuayName } from "@/lib/quays";
import { PlaceIcon } from "@/components/icons";
import { IconTile, ROW, ROW_SUB, RowText, SectionTitle } from "@/components/List";
import DepartureTime from "@/components/DepartureTime";
import ErrorNotice from "@/components/ErrorNotice";

/**
 * A favourite quay as a compact card: name and drive time on the left; on the right a
 * tier-coloured end cap with the next departure (time and destination) above the margin, the
 * same figure as on a departure card. Margins come from the shared drive time and clock, as
 * in the quay view.
 */
function FavoriteCard({
  quay,
  next,
  loaded,
  failed,
  arrivalAt,
  now,
  onSelect,
}: {
  quay: Quay;
  next: QuayNext | undefined;
  loaded: boolean;
  /** The favourites request failed and there is no earlier data for this quay. */
  failed: boolean;
  arrivalAt: Date | null;
  now: number;
  onSelect: () => void;
}) {
  const t = useTranslation();
  const { language } = useLanguage();
  const dep = next ? nextReachable(withLiveMargins(next.departures, arrivalAt)) : null;
  const margin = dep && dep.marginMinutes !== null ? splitMargin(dep.marginMinutes, language) : null;
  const drive = arrivalAt ? secondsUntil(arrivalAt, now) : null;
  const pending = !next && !loaded;

  // The cap fills the list's shared second column (see HomeLists), so every favourite's cap
  // is as wide as the widest one.
  const cap = "flex min-w-[116px] flex-col items-end justify-center gap-0.5 px-3.5 py-2";
  let end: React.ReactNode;
  if (pending) {
    end = <span className={`${cap} min-h-[64px] animate-pulse bg-surface-variant`} />;
  } else if (!dep) {
    end = (
      <span className={`${cap} bg-surface-variant text-[13px] text-text-secondary`}>
        {t(failed ? "general.unavailable" : "home.noNextDeparture")}
      </span>
    );
  } else {
    end = (
      <span className={`${cap} text-white`} style={{ backgroundColor: TIER_COLOR[tierOf(dep)] }}>
        <span className="max-w-full truncate text-[13px] leading-tight">
          {/* Without a position there's no margin; the time then takes the big figure below. */}
          {margin && (
            <>
              {/* The space stays outside the mono span: a mono space reads as a double one. */}
              <b className="font-mono tabular-nums">
                <DepartureTime departure={dep} />
              </b>{" "}
            </>
          )}
          {destinationText(dep, t("general.via"))}
        </span>
        <span className="font-mono text-[30px] font-bold leading-none tracking-tight tabular-nums">
          {margin ? margin.value : <DepartureTime departure={dep} />}
          {margin?.unit && <span className="text-[15px] tracking-normal"> {margin.unit}</span>}
        </span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className="col-span-2 grid cursor-pointer grid-cols-subgrid items-stretch overflow-hidden rounded-[18px] bg-surface text-left text-text-primary shadow-raised transition-transform active:scale-[0.99]"
    >
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-2 pl-4 pr-3">
        <span className="truncate text-[19px] font-bold leading-tight">{shortQuayName(quay.name)}</span>
        {drive != null && <span className={ROW_SUB}>{t("home.driveAway", { time: formatDuration(drive, language) })}</span>}
      </span>
      {end}
    </button>
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
  if (favorites.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5">
      <SectionTitle>{t("favorites.title")}</SectionTitle>
      {favoriteNext.error && <ErrorNotice message={t("home.favoritesError")} onRetry={favoriteNext.retry} />}
      {/* One grid for all favourites: each card spans both columns (subgrid), so the end caps
          share the second column and are all as wide as the widest destination, capped at 60%
          of the list. */}
      <div className="grid grid-cols-[minmax(0,1fr)_fit-content(60%)] gap-y-2.5">
        {favorites.map((f) => {
          const quay = quaysById.get(f.id);
          if (!quay) {
            // A saved place from before the quay-centric redesign: resolve it like a search.
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onSelectPlace(f)}
                className={`${ROW} col-span-2 rounded-[18px] bg-surface shadow-raised`}
              >
                <IconTile>
                  <PlaceIcon />
                </IconTile>
                <RowText name={f.name} sub={f.subName} />
              </button>
            );
          }
          const next = favoriteNext.byId.get(quay.id);
          return (
            <FavoriteCard
              key={f.id}
              quay={quay}
              next={next}
              loaded={favoriteNext.loaded}
              failed={favoriteNext.error && !next}
              arrivalAt={arrivalFor(quay.id)}
              now={now}
              onSelect={() => onSelectQuay(quay)}
            />
          );
        })}
      </div>
    </div>
  );
}
