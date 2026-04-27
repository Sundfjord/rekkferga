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
  lastRefreshAt?: Date | null;
  isRefreshing?: boolean;
}

export default function QuayCard({
  driveDuration,
  fromQuayName,
  toQuayName,
  departures,
  onViewFullJourney,
  lastRefreshAt,
  isRefreshing = false,
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
            <div key={`${dep.expectedDepartureTime}-${i}`} className="flex flex-col gap-1 flex-1 max-w-96">
              <MarginBadge departure={dep} />
              {dep.viaNames && dep.viaNames.length > 0 && (
                <span
                  className="text-xs"
                  style={{ color: "var(--text-disabled)", fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
                >
                  {t("via")} {dep.viaNames.join(", ")}
                </span>
              )}
            </div>
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

      {/* Refresh indicator */}
      {lastRefreshAt && (
        <div
          className="flex items-center gap-1.5 text-xs"
          style={{ color: "var(--text-disabled)", fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
        >
          <svg
            className={isRefreshing ? "animate-spin" : ""}
            style={{ width: 12, height: 12, flexShrink: 0 }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>
            {t("updatedAt", { time: lastRefreshAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })}
          </span>
        </div>
      )}

    </div>
  );
}
