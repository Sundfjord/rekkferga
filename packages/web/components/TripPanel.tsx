"use client";

import type { JourneyResult, FerryLeg, SearchResult, TripState } from "@shared/types";
import { formatTime, formatDuration, nextReachable, marginTier, formatMarginLabel } from "@shared/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useFavorites } from "@/contexts/FavoritesContext";

function MarginBadge({ minutes }: { minutes: number | null }) {
  if (minutes === null) return null;
  const tier = marginTier(minutes);
  const { prefix, label } = formatMarginLabel(minutes);

  const styles: Record<string, { bg: string; text: string }> = {
    safe:   { bg: "var(--color-margin-safe-surface)",  text: "var(--color-margin-safe-text)" },
    tight:  { bg: "var(--color-margin-tight-surface)", text: "var(--color-margin-tight-text)" },
    missed: { bg: "var(--color-margin-missed-surface)",text: "var(--color-margin-missed-text)" },
  };
  const { bg, text } = styles[tier];

  return (
    <div
      className="inline-flex items-baseline gap-1 px-4 py-2.5 rounded-lg"
      style={{ backgroundColor: bg }}
    >
      <span
        className="text-xl font-bold leading-none"
        style={{ color: text, fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)" }}
      >
        {prefix}{label}
      </span>
      <span
        className="text-xs font-medium"
        style={{ color: text, opacity: 0.75, fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
      >
        margin
      </span>
    </div>
  );
}

interface TripPanelProps {
  journey: JourneyResult;
  destination: SearchResult;
  currentLegIndex: number;
  tripState: TripState;
  onExit: () => void;
  stalePosition?: boolean;
  onRefreshPosition?: () => void;
  sidebar?: boolean;
}

export default function TripPanel({
  journey,
  destination,
  currentLegIndex,
  tripState,
  onExit,
  stalePosition,
  onRefreshPosition,
  sidebar = false,
}: TripPanelProps) {
  const t = useTranslation();
  const { toggleFavorite, isFavorite } = useFavorites();
  const isFav = isFavorite(destination.id);
  const remainingLegs = journey.legs.slice(currentLegIndex);

  const staleBanner = stalePosition && (
    <div
      className="px-5 py-2.5 text-sm flex items-center gap-2 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
      style={{ backgroundColor: "#FFFBEB", borderBottom: "1px solid #FDE68A", color: "#92400E" }}
      onClick={onRefreshPosition}
    >
      <span>⚠</span>
      <span style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}>{t("stalePosition")}</span>
    </div>
  );

  const header = (
    <div className="flex items-center justify-between px-5 pt-4 pb-3">
      <div className="flex-1 mr-4 min-w-0">
        <div
          className="text-base font-bold truncate"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne, 'Syne', sans-serif)" }}
        >
          {destination.name}
        </div>
        <div
          className="text-sm mt-0.5 flex items-center gap-1.5"
          style={{ color: "var(--text-secondary)" }}
        >
          <span style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}>
            {t("arrivalTime")}
          </span>
          <span style={{ fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)" }}>
            {formatTime(journey.expectedEndTime)}
          </span>
        </div>
      </div>
      <button
        onClick={() => toggleFavorite(destination)}
        aria-label={isFav ? t("removeFavorite") : t("addFavorite")}
        className="flex-shrink-0 p-1 transition-colors cursor-pointer"
        style={{ color: isFav ? "#ef4444" : "var(--text-secondary)" }}
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isFav ? 0 : 1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      </button>
      <button
        onClick={onExit}
        aria-label={t("close") ?? "Close"}
        className="flex-shrink-0 p-1 ml-1 transition-colors cursor-pointer"
        style={{ color: "var(--text-secondary)" }}
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );

  const legs = (
    <div className={sidebar ? "overflow-y-auto flex-1" : "overflow-y-auto max-h-[40vh]"}>
      {tripState === 'arrived' ? (
        <div
          className="px-5 pb-5 text-sm text-center"
          style={{ color: "var(--text-secondary)", fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
        >
          {t("arriveAt", { place: destination.name })}
        </div>
      ) : (
        remainingLegs.map((leg, i) => {
          const isActive = i === 0;
          const legGlobalIndex = currentLegIndex + i;

          if (leg.mode === "water") {
            const ferryLeg = leg as FerryLeg;
            const dep = nextReachable(ferryLeg.departures);
            return (
              <div
                key={legGlobalIndex}
                className="px-5 py-4"
                style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: "var(--water)", opacity: isActive ? 1 : 0.5 }}
                  />
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
                      opacity: isActive ? 1 : 0.7,
                    }}
                  >
                    {ferryLeg.fromPlace.name} → {ferryLeg.toPlace.name}
                  </span>
                </div>
                {dep ? (
                  <div className="pl-7 flex flex-col gap-1.5">
                    <MarginBadge minutes={dep.marginMinutes} />
                    <span
                      className="text-xs"
                      style={{
                        color: "var(--text-secondary)",
                        fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)",
                      }}
                    >
                      {t("departures")} {formatTime(dep.expectedDepartureTime)}
                    </span>
                  </div>
                ) : (
                  <div className="pl-7 text-sm" style={{ color: "var(--text-disabled)" }}>
                    {t("unavailable")}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div
              key={legGlobalIndex}
              className="px-5 py-3 flex items-center gap-3"
              style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
            >
              <div
                className="w-3.5 h-3.5 rounded-full flex-shrink-0 border"
                style={{
                  backgroundColor: "var(--surface-variant)",
                  borderColor: "var(--water-light)",
                  opacity: isActive ? 1 : 0.55,
                }}
              />
              <div className="flex-1 flex items-center justify-between gap-4">
                <span
                  className="text-sm"
                  style={{
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
                    opacity: isActive ? 1 : 0.65,
                  }}
                >
                  {t("car")} → {leg.toPlace.name == "Destination" ? t("destination") : leg.toPlace.name}
                </span>
                <span
                  className="text-sm flex-shrink-0"
                  style={{
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)",
                  }}
                >
                  {formatDuration(leg.duration)}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  // Sidebar variant — fills its rounded card wrapper
  if (sidebar) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        {staleBanner}
        {header}
        {legs}
        <div className="h-4" />
      </div>
    );
  }

  // Default card variant — sits at top of flex-col layout
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "var(--surface)", boxShadow: "0 4px 24px rgba(1,22,56,0.18)" }}
    >
      {staleBanner}
      {header}
      {legs}
      <div className="h-3" />
    </div>
  );
}
