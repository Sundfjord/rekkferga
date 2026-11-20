"use client";

import { useEffect, useId, useState } from "react";
import type { DepartureOption, Quay, ResultItem } from "@shared/types";
import { formatDuration, formatTime, trafficLevel } from "@shared/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import type { QuayDeparturesState } from "@/hooks/useQuayDepartures";
import { departureKey, servesQuay, withLiveMargins } from "@/lib/departures";
import { secondsUntil, type DriveTime } from "@/hooks/useDriveTimes";
import LiveStatus from "@/components/LiveStatus";
import { withViewTransition } from "@/lib/viewTransition";
// import { shortQuayName } from "@/lib/quays"; // with the crossing filter
import DepartureCard from "@/components/DepartureCard";
import DriveMode from "@/components/DriveMode";
import Spinner from "@/components/Spinner";
import ErrorNotice from "@/components/ErrorNotice";
import { ChevronLeftIcon, HeartIcon } from "@/components/icons";

const VISIBLE_DEPARTURES = 5;
const HEADER_BUTTON =
  "flex h-11 w-11 flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface shadow-raised transition-colors hover:bg-surface-variant";

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
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Spinner />
        <span>{label}</span>
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="h-[92px] animate-pulse rounded-[18px] bg-surface-variant" />
      ))}
    </div>
  );
}

/** Label + big value on a card, the same in the overview and in drive mode. */
function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-[18px] bg-surface px-4 py-3 shadow-raised">
      <span className="text-[15px] leading-snug text-text-secondary">{label}</span>
      <span className="font-mono text-[30px] font-bold leading-tight tabular-nums" style={{ color: color ?? "var(--text-primary)" }}>
        {value}
      </span>
    </div>
  );
}

/**
 * A selected quay: a header (back, name, favourite), then cards with the drive time
 * and arrival at the quay; below it the departure cards. Tapping a card switches the same
 * surface to Drive mode, which keeps the header and the figures.
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
  const titleId = useId();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  // A place search can still pre-select a crossing; the filter buttons are commented out below.
  const [destination] = useState<string | null>(initialDestination);

  // Crossings this quay serves; a filter only makes sense with more than one.
  // (Crossing filter buttons temporarily disabled — restore with setDestination and shortQuayName.)
  // const crossings = quay.relatedQuayIds
  //   .map((id) => ({ id, name: quaysById.get(id)?.name }))
  //   .filter((c): c is { id: string; name: string } => !!c.name);
  const traffic = drive ? trafficLevel(drive.seconds, drive.typicalSeconds) : null;
  // Margins are recomputed from the shared drive time and clock, so they match the
  // favourites and tick with the clock rather than jumping at each poll.
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

  // When the view's data last changed: departures or the drive time, whichever is newer.
  const updatedAt =
    lastRefreshAt && !loading
      ? new Date(Math.max(lastRefreshAt.getTime(), drive?.at ?? 0))
      : null;

  return (
    <section aria-labelledby={titleId} className="flex min-h-0 flex-1 flex-col">
      {/* Page header: back, the quay's name, favourite. It stays in drive mode too; drive mode
          closes from its own hero. */}
      <div className="flex flex-shrink-0 items-center gap-1.5 px-4 pt-4 text-text-primary">
        <button type="button" onClick={onBack} aria-label={t("general.back")} className={HEADER_BUTTON}>
          <ChevronLeftIcon />
        </button>
        <h1 id={titleId} className="ml-1.5 min-w-0 flex-1 truncate text-[23px] font-bold leading-tight">
          {quay.name}
        </h1>
        <button
          type="button"
          onClick={() => toggleFavorite(favoritePayload)}
          aria-label={isFav ? t("favorites.remove") : t("favorites.add")}
          aria-pressed={isFav}
          className={`${HEADER_BUTTON} ${isFav ? "text-favorite" : ""}`}
        >
          <HeartIcon filled={isFav} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4 pb-4 pt-3.5">
        {/* Drive time and arrival at the quay, in overview and drive mode alike. */}
        {arrivalAt && (
          <div className="grid grid-cols-2 gap-2.5">
            {/* Time left to the quay, from the same arrival estimate the margins use. It takes
                the traffic colour, as in map apps. */}
            <Stat
              label={t("quay.driveTime")}
              value={formatDuration(secondsUntil(arrivalAt, now), language)}
              color={traffic ? `var(--traffic-${traffic})` : undefined}
            />
            <Stat label={t("quay.arrivalAtQuay")} value={formatTime(arrivalAt.toISOString())} />
          </div>
        )}
        {/* How live this is: traffic vs usual and when it was last updated, in one line. */}
        {updatedAt && (
          <LiveStatus
            traffic={drive && traffic ? { level: traffic, delaySeconds: drive.seconds - (drive.typicalSeconds ?? drive.seconds) } : null}
            updatedAt={updatedAt}
            refreshing={isRefreshing}
          />
        )}
        {/* A failed refresh keeps the last good departures, so say they may be stale. */}
        {departuresError && departures.length > 0 && <ErrorNotice message={t("quay.departuresStale")} onRetry={retry} />}
        {selected ? (
          // Re-keyed per departure so a Plan B pick mounts a fresh hero.
          <DriveMode
            key={selectedKey}
            departure={selected}
            departures={filtered}
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
              <div className="px-1 py-2 text-sm text-text-secondary">
                {t("quay.noDepartures")}
              </div>
            ) : (
              <div className="grid gap-2.5">
                {visible.map((d) => (
                  <DepartureCard key={departureKey(d)} departure={d} onSelect={() => select(d)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
