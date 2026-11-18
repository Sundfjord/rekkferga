"use client";

import { useEffect, useState } from "react";
import type { DepartureOption, Quay, ResultItem } from "@shared/types";
import { formatDuration, formatTime, trafficLevel } from "@shared/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import type { QuayDeparturesState } from "@/hooks/useQuayDepartures";
import { departureKey, servesQuay, withLiveMargins } from "@/lib/departures";
import type { DriveTime } from "@/hooks/useDriveTimes";
import TrafficStatus from "@/components/TrafficStatus";
import { withViewTransition } from "@/lib/viewTransition";
// import { shortQuayName } from "@/lib/quays"; // with the crossing filter
import Band from "@/components/Band";
import DepartureCard from "@/components/DepartureCard";
import DriveMode from "@/components/DriveMode";
import Spinner from "@/components/Spinner";
import ErrorNotice from "@/components/ErrorNotice";
import { ChevronLeftIcon, HeartIcon } from "@/components/icons";

const VISIBLE_DEPARTURES = 5;
const BAND_BUTTON = "flex h-11 flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25";

export interface QuayPanelProps extends QuayDeparturesState {
  /** Shared drive time for this quay (useDriveTimes); null when unknown. */
  drive: DriveTime | null;
  /** Estimated arrival at the quay (estimateArrival); null without a drive time. */
  arrivalAt: Date | null;
  /** Shared clock, so margins match the favourites exactly. */
  now: number;
  quay: Quay;
  quaysById: Map<string, Quay>;
  /** Pre-selected crossing (destination quay id), e.g. from a place search. */
  initialDestination: string | null;
  onBack: () => void;
}

function LoadingState({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
        <Spinner />
        <span>{label}</span>
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="h-[92px] animate-pulse rounded-[18px]" style={{ backgroundColor: "var(--surface-variant)" }} />
      ))}
    </div>
  );
}

/** Label + big value on the band, the same in the overview and in drive mode. */
function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-[14px] bg-white/15 px-3.5 py-3">
      <span className="text-[15px] leading-snug">{label}</span>
      <span className="text-[30px] font-bold leading-tight tabular-nums" style={{ fontFamily: "var(--font-mono)", color }}>
        {value}
      </span>
    </div>
  );
}

/**
 * A selected quay: the band becomes its header (back, name, favourite) with the drive time
 * and arrival at the quay; below it the departure cards. Tapping a card switches the same
 * surface to Drive mode, which keeps the band and its figures.
 */
export default function QuayPanel({
  quay,
  // quaysById, // with the crossing filter
  initialDestination,
  onBack,
  drive,
  arrivalAt,
  now,
  departures,
  loading,
  lastRefreshAt,
  isRefreshing,
  departuresError,
  routeError,
  retry,
}: QuayPanelProps) {
  const t = useTranslation();
  const { language } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  // A place search can still pre-select a crossing; the filter buttons are commented out below.
  const [destination] = useState<string | null>(initialDestination);

  // Crossings this quay serves; a filter only makes sense with more than one.
  // (Crossing filter buttons temporarily disabled — restore with setDestination and shortQuayName.)
  // const crossings = quay.relatedQuayIds
  //   .map((id) => ({ id, name: quaysById.get(id)?.name }))
  //   .filter((c): c is { id: string; name: string } => !!c.name);
  // Margins are recomputed from the shared drive time and clock, so they match the
  // favourites and tick with the clock rather than jumping at each poll.
  // Time left to the quay, from the same arrival estimate the margins use.
  const remainingSeconds = arrivalAt ? Math.max(0, (arrivalAt.getTime() - now) / 1000) : null;
  const traffic = drive ? trafficLevel(drive.seconds, drive.typicalSeconds) : null;
  const live = withLiveMargins(departures, arrivalAt);
  // A crossing filter keeps departures that end there or call there on the way.
  const filtered = destination ? live.filter((d) => servesQuay(d, destination)) : live;
  const visible = filtered.slice(0, VISIBLE_DEPARTURES);

  // Departures are re-fetched on a poll, so track the pick by identity, not index.
  const selected = selectedKey ? filtered.find((d) => departureKey(d) === selectedKey) : undefined;
  useEffect(() => {
    // The picked departure dropped out of the list (it left): back to the overview.
    if (selectedKey && !loading && !selected) setSelectedKey(null);
  }, [selectedKey, loading, selected]);

  // Card ↔ drive mode (and Plan B) as a View Transition: only the margin morphs.
  const select = (d: DepartureOption) => withViewTransition(() => setSelectedKey(departureKey(d)));
  const backToOverview = () => withViewTransition(() => setSelectedKey(null));
  const isFav = isFavorite(quay.id);
  const favoritePayload: ResultItem = {
    id: quay.id,
    name: quay.name,
    subName: quay.subName,
    latitude: quay.latitude,
    longitude: quay.longitude,
    type: "location",
  };

  const updated = lastRefreshAt && !loading && (
    <div className="flex items-center justify-center gap-2 pt-1 text-[13px]" style={{ color: "var(--text-secondary)" }}>
      {isRefreshing ? <Spinner className="h-2.5 w-2.5" /> : <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--margin-safe)" }} />}
      <span>{t("general.updatedAt", { time: formatTime(lastRefreshAt.toISOString()) })}</span>
    </div>
  );

  return (
    <section aria-label={quay.name} className="flex min-h-0 flex-1 flex-col" style={{ fontFamily: "var(--font-dm-sans)" }}>
      <Band>
        {/* The quay header stays in drive mode too; drive mode closes from its own hero. */}
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={onBack} aria-label={t("general.back")} className={`${BAND_BUTTON} w-11`}>
            <ChevronLeftIcon />
          </button>
          <h1 className="ml-1.5 min-w-0 flex-1 truncate text-[19px] font-bold leading-tight">{quay.name}</h1>
          <button
            type="button"
            onClick={() => toggleFavorite(favoritePayload)}
            aria-label={isFav ? t("favorites.remove") : t("favorites.add")}
            aria-pressed={isFav}
            className="flex h-11 w-11 flex-shrink-0 cursor-pointer items-center justify-center rounded-full"
          >
            <HeartIcon filled={isFav} />
          </button>
        </div>
        {/* Drive time and arrival at the quay hang off the header, in overview and drive mode alike. */}
        {remainingSeconds != null && arrivalAt && (
          <>
            <div className="mt-3.5 grid grid-cols-2 gap-2.5">
              {/* The drive time takes the traffic colour, as in map apps. */}
              <Stat
                label={t("quay.driveTime")}
                value={formatDuration(remainingSeconds, language)}
                color={traffic ? `var(--traffic-${traffic})` : undefined}
              />
              <Stat label={t("quay.arrivalAtQuay")} value={formatTime(arrivalAt.toISOString())} />
            </div>
            {drive && traffic && <TrafficStatus level={traffic} delaySeconds={drive.seconds - (drive.typicalSeconds ?? drive.seconds)} />}
          </>
        )}
      </Band>

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-3.5 pb-4 pt-[18px] lg:px-0">
        {/* A failed refresh keeps the last good departures, so say they may be stale. */}
        {departuresError && departures.length > 0 && <ErrorNotice message={t("quay.departuresStale")} onRetry={retry} />}
        {selected ? (
          // Re-keyed per departure so a Plan B pick mounts a fresh hero.
          <DriveMode
            key={selectedKey}
            departure={selected}
            departures={filtered}
            arrivalAt={arrivalAt}
            now={now}
            onSelect={select}
            onClose={backToOverview}
            closeLabel={t("drive.allDepartures", { quay: quay.name })}
          />
        ) : (
          <>
            {routeError && <ErrorNotice message={t("quay.routeError")} onRetry={retry} />}

            {/* Crossing filter temporarily disabled.
            {crossings.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label={t("quay.showDeparturesTo")}>
                {[{ id: null, name: t("quay.allDestinations") }, ...crossings.map((c) => ({ id: c.id as string | null, name: shortQuayName(c.name) }))].map(
                  (c) => {
                    const on = destination === c.id;
                    return (
                      <button
                        key={c.id ?? "all"}
                        type="button"
                        onClick={() => setDestination(c.id)}
                        aria-pressed={on}
                        className="h-[38px] flex-shrink-0 cursor-pointer rounded-full border-[1.5px] px-4 text-sm"
                        style={
                          on
                            ? { backgroundColor: "var(--text-primary)", borderColor: "var(--text-primary)", color: "var(--surface)" }
                            : { backgroundColor: "var(--surface)", borderColor: "var(--surface-variant)", color: "var(--text-primary)" }
                        }
                      >
                        {c.name}
                      </button>
                    );
                  },
                )}
              </div>
            )}
            */}

            {loading ? (
              <LoadingState label={t("quay.loading")} />
            ) : departuresError && departures.length === 0 ? (
              <ErrorNotice message={t("quay.departuresError")} onRetry={retry} />
            ) : visible.length === 0 ? (
              <div className="px-1 py-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                {t("quay.noDepartures")}
              </div>
            ) : (
              <div className="grid gap-2.5 xl:grid-cols-2">
                {visible.map((d) => (
                  <DepartureCard key={departureKey(d)} departure={d} onSelect={() => select(d)} />
                ))}
              </div>
            )}
          </>
        )}
        {updated}
      </div>
    </section>
  );
}
