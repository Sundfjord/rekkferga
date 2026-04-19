"use client";

import type { JourneyResult, FerryLeg, SearchResult, TripState } from "@shared/types";
import { formatTime, formatDuration, nextReachable, marginTier, formatMarginLabel } from "@shared/utils";
import { useTranslation } from "@/hooks/useTranslation";

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
  sidebar?: boolean;
}

export default function TripPanel({
  journey,
  destination,
  currentLegIndex,
  tripState,
  onExit,
  stalePosition,
  sidebar = false,
}: TripPanelProps) {
  const t = useTranslation();
  const remainingLegs = journey.legs.slice(currentLegIndex);

  const staleBanner = stalePosition && (
    <div
      className="px-5 py-2.5 text-sm flex items-center gap-2 flex-shrink-0"
      style={{ backgroundColor: "#FFFBEB", borderBottom: "1px solid #FDE68A", color: "#92400E" }}
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
          className="text-sm mt-0.5"
          style={{ color: "var(--text-secondary)", fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)" }}
        >
          {formatTime(journey.expectedEndTime)}
        </div>
      </div>
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
                  {t("car")} → {leg.toPlace.name}
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
