"use client";

import type { DepartureOption } from "@shared/types";
import { formatDuration, formatTime, marginTier, formatMarginLabel, selectDeparturesForDisplay } from "@shared/utils";

export interface QuayCardProps {
  driveDuration: number;
  fromQuayName: string;
  toQuayName: string;
  departures: DepartureOption[];
  selectedDeparture: DepartureOption | null;
  onViewFullJourney: () => void;
}

const marginStyles: Record<string, { bg: string; text: string }> = {
  safe:   { bg: "var(--color-margin-safe-surface)",   text: "var(--color-margin-safe-text)" },
  tight:  { bg: "var(--color-margin-tight-surface)",  text: "var(--color-margin-tight-text)" },
  missed: { bg: "var(--color-margin-missed-surface)", text: "var(--color-margin-missed-text)" },
};

function DepartureBadge({ dep }: { dep: DepartureOption }) {
  if (dep.marginMinutes === null) return null;
  const tier = marginTier(dep.marginMinutes);
  const { prefix, label } = formatMarginLabel(dep.marginMinutes);
  const { bg, text } = marginStyles[tier];

  return (
    <div
      className="flex flex-col gap-2 rounded-2xl px-6 py-5 flex-1"
      style={{ backgroundColor: bg }}
    >
      <span
        className="text-sm font-medium tabular-nums"
        style={{ color: text, opacity: 0.7, fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)" }}
      >
        {formatTime(dep.expectedDepartureTime)}
      </span>
      <span
        className="text-5xl font-bold leading-none"
        style={{ color: text, fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)" }}
      >
        {prefix}{label}
      </span>
      <span
        className="text-xs font-medium uppercase tracking-wide"
        style={{ color: text, opacity: 0.55, fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
      >
        margin
      </span>
    </div>
  );
}

export default function QuayCard({
  driveDuration,
  fromQuayName,
  toQuayName,
  departures,
  onViewFullJourney,
}: QuayCardProps) {
  const displayDepartures = selectDeparturesForDisplay(departures);

  return (
    <div className="flex flex-col w-full h-full p-5 gap-6">

      {/* Route + drive time */}
      <div className="flex flex-col gap-1">
        <div
          className="text-xl font-semibold"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
        >
          {fromQuayName} → {toQuayName}
        </div>
        <div
          className="flex items-baseline gap-2 text-sm"
          style={{ color: "var(--text-secondary)", fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
        >
          <span>Drive to quay</span>
          <span
            className="font-semibold tabular-nums"
            style={{ fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)" }}
          >
            {formatDuration(driveDuration)}
          </span>
        </div>
      </div>

      {/* Margin badges */}
      <div className="flex gap-3 flex-1 items-stretch">
        {displayDepartures.length > 0 ? (
          displayDepartures.map((dep, i) => (
            <DepartureBadge key={`${dep.expectedDepartureTime}-${i}`} dep={dep} />
          ))
        ) : (
          <div
            className="text-sm"
            style={{ color: "var(--text-disabled)", fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
          >
            No departures available
          </div>
        )}
      </div>

      {/* Toggle */}
      <button
        onClick={onViewFullJourney}
        className="w-full py-3 rounded-xl text-sm font-semibold cursor-pointer transition-colors"
        style={{
          backgroundColor: "var(--surface-variant)",
          border: "1px solid var(--border)",
          color: "var(--text-secondary)",
          fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
        }}
      >
        View full journey
      </button>

    </div>
  );
}
