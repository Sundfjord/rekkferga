"use client";

import type { JourneyResult, FerryLeg, SearchResult } from "@shared/types";
import { formatTime, formatDuration, firstReachable } from "@shared/utils";
import { useTranslation } from "@/hooks/useTranslation";

export type TripState = 'driving_to_quay' | 'at_quay' | 'crossing' | 'crossing_complete' | 'arrived';

function marginTier(minutes: number): "safe" | "tight" | "missed" {
  if (minutes > 10) return "safe";
  if (minutes >= 0) return "tight";
  return "missed";
}

function MarginBadge({ minutes }: { minutes: number | null }) {
  if (minutes === null) return null;
  const tier = marginTier(minutes);
  const abs = Math.abs(minutes);
  const label = abs >= 60 ? `${Math.floor(abs / 60)}h ${abs % 60}m` : `${abs}m`;
  const prefix = minutes > 0 ? "+" : minutes < 0 ? "−" : "";

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

  const STATE_LABELS: Record<TripState, string> = {
    driving_to_quay: t("tripStateDrivingToQuay"),
    at_quay: t("tripStateAtQuay"),
    crossing: t("tripStateCrossing"),
    crossing_complete: t("tripStateCrossingComplete"),
    arrived: t("tripStateArrived"),
  };

  const panelContent = (
    <>
      {/* Drag handle — overlay only */}
      {!sidebar && (
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-8 h-1 rounded-full" style={{ backgroundColor: "var(--border)", opacity: 0.5 }} />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex-1 mr-4 min-w-0">
          <div
            className="text-xs font-semibold tracking-widest uppercase mb-0.5"
            style={{ color: "var(--water)", fontFamily: "var(--font-syne, 'Syne', sans-serif)" }}
          >
            {STATE_LABELS[tripState]}
          </div>
          <div
            className="text-base font-bold truncate"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-syne, 'Syne', sans-serif)" }}
          >
            {destination.name}
          </div>
        </div>
        <button
          onClick={onExit}
          className="flex-shrink-0 px-3 py-1.5 text-sm rounded-lg border transition-colors hover:bg-gray-50"
          style={{
            borderColor: "var(--border)",
            color: "var(--text-secondary)",
            fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
          }}
        >
          {t("back")}
        </button>
      </div>

      {/* Legs — all remaining, ferry always with badge */}
      <div
        className={sidebar ? "overflow-y-auto flex-1" : "overflow-y-auto max-h-[45vh]"}
      >
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
              const dep = firstReachable(ferryLeg.departures);
              return (
                <div
                  key={legGlobalIndex}
                  className="px-5 py-4"
                  style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
                >
                  {/* Route row */}
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
                  {/* Badge + time — always shown for all ferry legs */}
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
                    <div
                      className="pl-7 text-sm"
                      style={{ color: "var(--text-disabled)" }}
                    >
                      {t("unavailable")}
                    </div>
                  )}
                </div>
              );
            }

            // Car leg
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

      <div className="h-4" />
    </>
  );

  // Sidebar variant (wide screen) — static, no backdrop
  if (sidebar) {
    return (
      <div
        className="h-full flex flex-col border-r overflow-hidden"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        {stalePosition && (
          <div
            className="px-5 py-2.5 text-sm border-b flex items-center gap-2 flex-shrink-0"
            style={{ backgroundColor: "#FFFBEB", borderColor: "#FDE68A", color: "#92400E" }}
          >
            <span>⚠</span>
            <span style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}>{t("stalePosition")}</span>
          </div>
        )}
        {panelContent}
      </div>
    );
  }

  // Overlay variant (mobile / narrow screen)
  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col">
      {stalePosition && (
        <div
          className="w-full px-4 py-2.5 text-sm border-t flex items-center gap-2"
          style={{ backgroundColor: "#FFFBEB", borderColor: "#FDE68A", color: "#92400E" }}
        >
          <span>⚠</span>
          <span style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}>{t("stalePosition")}</span>
        </div>
      )}
      <div
        className="rounded-t-2xl overflow-hidden"
        style={{
          backgroundColor: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: "0 -4px 32px rgba(0,0,0,0.12)",
        }}
      >
        {panelContent}
      </div>
    </div>
  );
}
