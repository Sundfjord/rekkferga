"use client";

import type { DepartureOption } from "@shared/types";
import { formatDuration, selectDeparturesForDisplay } from "@shared/utils";
import { useTranslation } from "@/hooks/useTranslation";
import MarginBadge from "@/components/MarginBadge";

export interface QuayCardProps {
  driveDuration: number;
  fromQuayName: string;
  toQuayName: string;
  departures: DepartureOption[];
  selectedDeparture: DepartureOption | null;
  onViewFullJourney: () => void;
}

export default function QuayCard({
  driveDuration,
  fromQuayName,
  toQuayName,
  departures,
  onViewFullJourney,
}: QuayCardProps) {
  const t = useTranslation();
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
          <span>{t("driveToQuay")}</span>
          <span
            className="font-semibold tabular-nums"
            style={{ fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)" }}
          >
            {formatDuration(driveDuration)}
          </span>
        </div>
      </div>

      {/* Margin badges */}
      <div className="flex gap-3">
        {displayDepartures.length > 0 ? (
          displayDepartures.map((dep, i) => (
            <MarginBadge key={`${dep.expectedDepartureTime}-${i}`} departure={dep} className="flex-1 max-w-96" />
          ))
        ) : (
          <div
            className="text-sm"
            style={{ color: "var(--text-disabled)", fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
          >
            {t("noDepartures")}
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
        {t("viewFullJourney")}
      </button>

    </div>
  );
}
