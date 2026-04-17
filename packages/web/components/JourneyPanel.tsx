"use client";

import type { JourneyResult, FerryLeg, SearchResult } from "@shared/types";
import { formatTime, formatDuration, firstReachable } from "@shared/utils";
import { useTranslation } from "@/hooks/useTranslation";

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
        style={{
          color: text,
          fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)",
        }}
      >
        {prefix}{label}
      </span>
      <span
        className="text-xs font-medium"
        style={{
          color: text,
          fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
          opacity: 0.75,
        }}
      >
        {minutes === 0 ? "on the dot" : "margin"}
      </span>
    </div>
  );
}

interface JourneyPanelProps {
  journey: JourneyResult;
  destination: SearchResult;
  onClose: () => void;
  onStartTrip: () => void;
}

export default function JourneyPanel({ journey, destination, onClose, onStartTrip }: JourneyPanelProps) {
  const t = useTranslation();
  const msUntilArrival = new Date(journey.expectedEndTime).getTime() - Date.now();
  const durationToShow = msUntilArrival > 0 ? msUntilArrival / 1000 : journey.duration;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-5 pb-4">
        <div>
          <div
            className="text-lg font-bold leading-tight"
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-syne, 'Syne', sans-serif)",
            }}
          >
            {destination.name}
          </div>
          <div
            className="text-sm mt-0.5"
            style={{
              color: "var(--text-secondary)",
              fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
            }}
          >
            {formatDuration(durationToShow)} total
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 -mr-1 -mt-1 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
          aria-label="Close"
          style={{ color: "var(--text-disabled)" }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Timeline legs */}
      <div className="px-5 pb-4">
        <div className="relative">
          {/* Vertical rail */}
          <div
            className="absolute top-3 bottom-3 left-[7px] w-0.5 rounded-full"
            style={{ backgroundColor: "var(--water-light)", opacity: 0.35 }}
          />

          <div className="flex flex-col gap-5">
            {journey.legs.map((leg, i) => {
              const isLast = i === journey.legs.length - 1;
              if (leg.mode === "water") {
                const ferryLeg = leg as FerryLeg;
                const dep = firstReachable(ferryLeg.departures);
                return (
                  <div key={i} className="flex gap-4">
                    {/* Ferry node — larger, brand blue */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center z-10 mt-0.5"
                        style={{ backgroundColor: "var(--water)", boxShadow: "0 0 0 3px rgba(37,105,163,0.15)" }}
                      >
                        <span className="text-white leading-none" style={{ fontSize: 8 }}>⛴</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-sm font-semibold leading-snug"
                        style={{
                          color: "var(--text-primary)",
                          fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
                        }}
                      >
                        {ferryLeg.fromPlace.name} → {ferryLeg.toPlace.name}
                      </div>
                      {dep ? (
                        <div className="mt-2 flex flex-col gap-1.5">
                          <MarginBadge minutes={dep.marginMinutes} />
                          <div
                            className="text-xs"
                            style={{
                              color: "var(--text-secondary)",
                              fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)",
                            }}
                          >
                            {t("departures")} {formatTime(dep.expectedDepartureTime)}
                          </div>
                        </div>
                      ) : (
                        <div
                          className="text-sm mt-1"
                          style={{ color: "var(--text-disabled)" }}
                        >
                          {t("unavailable")}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              return (
                <div key={i} className="flex gap-4">
                  {/* Car node — smaller, muted */}
                  <div className="flex-shrink-0">
                    <div
                      className="w-3.5 h-3.5 rounded-full z-10 mt-0.5 flex items-center justify-center"
                      style={{ backgroundColor: "var(--surface-variant)", border: "1.5px solid var(--water-light)", opacity: 0.7 }}
                    />
                  </div>
                  <div className="flex-1 flex items-center justify-between gap-4">
                    <div
                      className="text-sm"
                      style={{
                        color: "var(--text-secondary)",
                        fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
                      }}
                    >
                      {t("car")} → {leg.toPlace.name}
                    </div>
                    <div
                      className="text-sm flex-shrink-0"
                      style={{
                        color: "var(--text-disabled)",
                        fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
                      }}
                    >
                      {formatDuration(leg.duration)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="px-5 py-4 flex items-center justify-between gap-4 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <div>
          <div
            className="text-xs mb-0.5 uppercase tracking-wider font-semibold"
            style={{
              color: "var(--text-secondary)",
              fontFamily: "var(--font-syne, 'Syne', sans-serif)",
            }}
          >
            {t("arriveAt", { place: "" }).trim()}
          </div>
          <div
            className="text-xl font-bold"
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)",
            }}
          >
            {formatTime(journey.expectedEndTime)}
          </div>
        </div>
        <button
          onClick={onStartTrip}
          className="px-5 py-2.5 text-sm font-semibold rounded-xl text-white transition-opacity hover:opacity-90 flex-shrink-0"
          style={{
            backgroundColor: "var(--water)",
            fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
          }}
        >
          {t("directions")} →
        </button>
      </div>
    </div>
  );
}
