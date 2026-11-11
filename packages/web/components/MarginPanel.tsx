"use client";

import { useEffect, useState } from "react";
import type { DepartureOption, Quay, ResultItem } from "@shared/types";
import { formatDuration, formatTime } from "@shared/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useNow } from "@/hooks/useNow";
import type { QuayDeparturesState } from "@/hooks/useQuayDepartures";
import { departureKey } from "@/lib/departures";
import DepartureCard from "@/components/DepartureCard";
import DepartureTimeline from "@/components/DepartureTimeline";
import DriveMode from "@/components/DriveMode";
import Spinner from "@/components/Spinner";
import { ChevronLeftIcon, CloseIcon, HeartIcon } from "@/components/icons";

export interface MarginPanelProps extends QuayDeparturesState {
  quay: Quay;
  onClose: () => void;
}

const ICON_BUTTON = "flex h-11 w-11 flex-shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors";

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

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: "var(--surface-variant)" }}>
      {children}
    </div>
  );
}

/**
 * Quay panel with two modes in one container: an Overview (drive time, next-hour timeline,
 * departure cards) and a Drive mode for one departure, entered by tapping a card. The
 * container grows to full height on entering Drive mode rather than swapping views.
 */
export default function MarginPanel({
  quay,
  route,
  departures,
  loading,
  onClose,
  lastRefreshAt,
  isRefreshing,
  arrivalAt,
}: MarginPanelProps) {
  const t = useTranslation();
  const { language } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();
  const now = useNow();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Departures are re-fetched on a poll, so track the pick by identity, not index.
  const selected = selectedKey ? departures.find((d) => departureKey(d) === selectedKey) : undefined;
  const isDrive = !!selected;

  // The picked departure dropped out of the list (it left): fall back to the overview.
  useEffect(() => {
    if (selectedKey && !loading && !selected) setSelectedKey(null);
  }, [selectedKey, loading, selected]);

  const select = (d: DepartureOption) => setSelectedKey(departureKey(d));
  const isFav = isFavorite(quay.id);
  const favoritePayload: ResultItem = {
    id: quay.id,
    name: quay.name,
    subName: quay.subName,
    latitude: quay.latitude,
    longitude: quay.longitude,
    type: "location",
  };

  const favButton = (
    <button
      type="button"
      onClick={() => toggleFavorite(favoritePayload)}
      aria-label={isFav ? t("removeFavorite") : t("addFavorite")}
      aria-pressed={isFav}
      className={ICON_BUTTON}
      style={{ color: isFav ? "#DC2626" : "var(--text-secondary)" }}
    >
      <HeartIcon filled={isFav} />
    </button>
  );

  const updated = lastRefreshAt && !loading && (
    <div className="flex items-center justify-center gap-2 text-[13px]" style={{ color: "var(--text-secondary)" }}>
      {isRefreshing ? <Spinner className="h-2.5 w-2.5" /> : <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--margin-safe)" }} />}
      <span>{t("updatedAt", { time: formatTime(lastRefreshAt.toISOString()) })}</span>
    </div>
  );

  return (
    // Full-height track; the card sits at the bottom (phone) / top (desktop) and grows into it.
    <div className="pointer-events-none absolute inset-4 z-[1000] flex flex-col justify-end sm:right-auto sm:w-[24rem] sm:justify-start">
      <section
        aria-label={quay.name}
        className={`panel-morph pointer-events-auto flex flex-col overflow-hidden rounded-[26px] ${isDrive ? "h-full max-h-full" : "h-auto max-h-[92%] sm:max-h-full"}`}
        style={{ backgroundColor: "var(--surface)", boxShadow: "var(--shadow-elevated)", fontFamily: "var(--font-dm-sans)" }}
      >
        {isDrive && selected ? (
          <>
            <div className="flex items-center py-2.5 pl-1.5 pr-2">
              <button
                type="button"
                onClick={() => setSelectedKey(null)}
                className="flex h-11 cursor-pointer items-center gap-1 rounded-full pl-2 pr-3.5 text-[15px] font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                <ChevronLeftIcon />
                {t("allDepartures")}
              </button>
            </div>
            {/* Re-keyed per departure so the hero's grow animation replays on every pick (incl. Plan B). */}
            <DriveMode
              key={selectedKey}
              departure={selected}
              departures={departures}
              arrivalAt={arrivalAt}
              now={now}
              onSelect={select}
            />
            <div className="px-2.5 pb-3 pt-2.5">{updated}</div>
          </>
        ) : (
          <>
            <div className="mx-auto mt-2 h-1 w-10 flex-shrink-0 rounded-full sm:hidden" style={{ backgroundColor: "var(--surface-variant)" }} />
            <header
              className="flex flex-shrink-0 flex-col gap-[18px] pb-4 pl-5 pr-2.5 pt-3"
              style={{ borderBottom: "1px solid var(--surface-variant)" }}
            >
              <div className="flex items-center gap-0.5">
                <h2
                  className="min-w-0 flex-1 py-1 text-[19px] font-bold leading-tight"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
                >
                  {quay.name}
                </h2>
                {favButton}
                <button type="button" onClick={onClose} aria-label={t("close")} className={ICON_BUTTON} style={{ color: "var(--text-secondary)" }}>
                  <CloseIcon />
                </button>
              </div>

              {route && (
                <div className="flex flex-wrap gap-2 pr-2.5">
                  <Chip>
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{t("driveTime")}</span>
                    <span className="text-[15px] font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                      {formatDuration(route.durationSeconds, language)}
                    </span>
                  </Chip>
                  {arrivalAt && (
                    <Chip>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{t("arrive")}</span>
                      <span className="text-[15px] font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                        {formatTime(arrivalAt.toISOString())}
                      </span>
                    </Chip>
                  )}
                </div>
              )}

              {!loading && (
                <div className="pr-2.5">
                  <DepartureTimeline departures={departures} arrivalAt={arrivalAt} now={now} />
                </div>
              )}
            </header>

            <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-3 pb-1 pt-3">
              {loading ? (
                <LoadingState label={t("loadingDepartures")} />
              ) : departures.length === 0 ? (
                <div className="px-1 py-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {t("noDepartures")}
                </div>
              ) : (
                departures.map((d) => <DepartureCard key={departureKey(d)} departure={d} onSelect={() => select(d)} />)
              )}
            </div>

            <div className="flex-shrink-0 px-5 pb-3.5 pt-2.5">{updated}</div>
          </>
        )}
      </section>
    </div>
  );
}
