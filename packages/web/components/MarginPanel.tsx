"use client";

import type { Quay, ResultItem } from "@shared/types";
import { formatDuration } from "@shared/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import MarginBadge from "@/components/MarginBadge";
import Spinner from "@/components/Spinner";
import type { QuayDeparturesState } from "@/hooks/useQuayDepartures";

export interface MarginPanelProps extends QuayDeparturesState {
  quay: Quay;
  onClose: () => void;
}

function LoadingState({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-dm-sans)" }}>
        <Spinner />
        <span>{label}</span>
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="h-[92px] rounded-xl animate-pulse" style={{ backgroundColor: "var(--surface-variant)" }} />
      ))}
    </div>
  );
}

export default function MarginPanel({
  quay,
  route,
  departures,
  loading,
  onClose,
  lastRefreshAt,
  isRefreshing,
}: MarginPanelProps) {
  const t = useTranslation();
  const { language } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(quay.id);

  const favoritePayload: ResultItem = {
    id: quay.id,
    name: quay.name,
    subName: quay.subName,
    latitude: quay.latitude,
    longitude: quay.longitude,
    type: "location",
  };

  return (
    <div className="absolute z-[1000] left-4 right-4 bottom-4 sm:right-auto sm:bottom-auto sm:left-4 sm:top-32 sm:w-[22rem]">
      <div className="rounded-2xl overflow-hidden flex flex-col max-h-[60vh]" style={{ backgroundColor: "var(--surface)", boxShadow: "var(--shadow-card)" }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3" style={{ borderBottom: "1px solid var(--surface-variant)" }}>
          <span className="flex-1 min-w-0 text-lg font-bold truncate" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
            {quay.name}
          </span>
          <button
            onClick={() => toggleFavorite(favoritePayload)}
            aria-label={isFav ? t("removeFavorite") : t("addFavorite")}
            className="flex-shrink-0 p-1 cursor-pointer transition-colors"
            style={{ color: isFav ? "#ef4444" : "var(--text-secondary)" }}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isFav ? 0 : 1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
          <button
            onClick={onClose}
            aria-label={t("close")}
            className="flex-shrink-0 p-1 cursor-pointer transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {/* Drive time */}
          {route && (
            <div className="flex items-baseline gap-2 text-sm" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-dm-sans)" }}>
              <span>{t("driveToQuay")}</span>
              <span className="font-semibold" style={{ fontFamily: "var(--font-mono)" }}>
                {formatDuration(route.durationSeconds, language)}
              </span>
            </div>
          )}

          {loading ? (
            <LoadingState label={t("loadingDepartures")} />
          ) : departures.length === 0 ? (
            <div className="text-sm py-2" style={{ color: "var(--text-disabled)", fontFamily: "var(--font-dm-sans)" }}>
              {t("noDepartures")}
            </div>
          ) : (
            departures.map((dep, i) => <MarginBadge key={`${dep.expectedDepartureTime}-${i}`} departure={dep} />)
          )}

          {/* Refresh indicator */}
          {lastRefreshAt && !loading && (
            <div className="flex items-center gap-1.5 text-xs pt-1" style={{ color: "var(--text-disabled)", fontFamily: "var(--font-dm-sans)" }}>
              <svg className={isRefreshing ? "animate-spin" : ""} style={{ width: 12, height: 12, flexShrink: 0 }} aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{t("updatedAt", { time: lastRefreshAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
