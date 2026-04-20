"use client";

import type { JourneyResult, FerryLeg, DepartureOption, ResultItem, TripState } from "@shared/types";
import { formatTime, formatDuration, nextReachable, marginTier, formatMarginLabel } from "@shared/utils";
import { useTranslation } from "@/hooks/useTranslation";

function MarginBadge({ minutes }: { minutes: number | null }) {
  if (minutes === null) return null;
  const tier = marginTier(minutes);
  const { prefix, label } = formatMarginLabel(minutes);
  const isTight = tier === "tight";

  const styles: Record<string, { bg: string; text: string }> = {
    safe:   { bg: "var(--color-margin-safe-surface)",  text: "var(--color-margin-safe-text)" },
    tight:  { bg: "var(--color-margin-tight-surface)", text: "var(--color-margin-tight-text)" },
    missed: { bg: "var(--color-margin-missed-surface)",text: "var(--color-margin-missed-text)" },
  };
  const { bg, text } = styles[tier];

  return (
    <div
      className={`flex items-baseline gap-1.5 px-5 py-3 rounded-lg ${isTight ? "animate-pulse-subtle" : ""}`}
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

function DriveLeg({ toName, duration, isActive, t }: { toName: string; duration: number; isActive: boolean; t: (key: string) => string }) {
  const displayName = toName === "Destination" ? t("destination") : toName;
  return (
    <div
      className="px-5 py-3 flex items-center gap-3"
      style={{ opacity: isActive ? 1 : 0.65 }}
    >
      <span
        className="text-sm"
        style={{ color: "var(--text-primary)", fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
      >
        {t("car")} → {displayName}
      </span>
      <span
        className="text-sm flex-shrink-0 ml-auto"
        style={{ color: "var(--text-secondary)", fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)" }}
      >
        {formatDuration(duration)}
      </span>
    </div>
  );
}

function FerrySection({ ferryLeg, isActive, t }: { ferryLeg: FerryLeg; isActive: boolean; t: (key: string) => string }) {
  const dep = nextReachable(ferryLeg.departures);
  const isTight = dep?.marginMinutes !== null && dep?.marginMinutes !== undefined && dep.marginMinutes < 10;

  // Find next departure after the first reachable one (for tight margins)
  let nextDep: DepartureOption | undefined;
  if (isTight && dep && ferryLeg.departures) {
    const depIndex = ferryLeg.departures.indexOf(dep);
    nextDep = ferryLeg.departures.slice(depIndex + 1).find(
      (d) => d.marginMinutes !== null && d.marginMinutes >= 0
    );
  }

  return (
    <div style={{ opacity: isActive ? 1 : 0.7 }}>
      {/* Margin badge as section divider */}
      {dep && (
        <div className="px-5 py-3 flex justify-center" style={{ borderTop: "1px solid var(--border)" }}>
          <MarginBadge minutes={dep.marginMinutes} />
        </div>
      )}

      {/* Ferry info */}
      <div className="px-5 py-3" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: "var(--water)" }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
          >
            {ferryLeg.fromPlace.name} → {ferryLeg.toPlace.name}
          </span>
        </div>
        {dep ? (
          <div className="pl-5 flex items-baseline gap-3">
            <span
              className="text-sm"
              style={{ color: "var(--text-secondary)", fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)" }}
            >
              {t("departures")} {formatTime(dep.expectedDepartureTime)}
            </span>
            <span
              className="text-xs"
              style={{ color: "var(--text-secondary)", fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
            >
              {formatDuration(ferryLeg.duration)}
            </span>
          </div>
        ) : (
          <div className="pl-5 text-sm" style={{ color: "var(--text-disabled)" }}>
            {t("unavailable")}
          </div>
        )}
        {/* Show next departure if current is tight */}
        {nextDep && (
          <div className="pl-5 mt-1.5 flex items-baseline gap-2">
            <span
              className="text-xs"
              style={{ color: "var(--text-secondary)", opacity: 0.7, fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
            >
              {t("nextDeparture")}
            </span>
            <span
              className="text-xs"
              style={{ color: "var(--text-secondary)", fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)" }}
            >
              {formatTime(nextDep.expectedDepartureTime)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface JourneyDetailsProps {
  journey: JourneyResult;
  destination: ResultItem;
  currentLegIndex: number;
  tripState: TripState;
  stalePosition?: boolean;
  onRefreshPosition?: () => void;
}

export default function JourneyDetails({
  journey,
  destination,
  currentLegIndex,
  tripState,
  stalePosition,
  onRefreshPosition,
}: JourneyDetailsProps) {
  const t = useTranslation();
  const remainingLegs = journey.legs.slice(currentLegIndex);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {stalePosition && (
        <div
          className="px-5 py-2.5 text-sm flex items-center gap-2 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          style={{ backgroundColor: "#FFFBEB", borderBottom: "1px solid #FDE68A", color: "#92400E" }}
          onClick={onRefreshPosition}
        >
          <span>⚠</span>
          <span style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}>{t("stalePosition")}</span>
        </div>
      )}

      {/* Legs */}
      <div className="overflow-y-auto flex-1">
        {tripState === 'arrived' ? (
          <div
            className="px-5 py-5 text-sm text-center"
            style={{ color: "var(--text-secondary)", fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
          >
            {t("arriveAt", { place: destination.name })}
          </div>
        ) : (
          remainingLegs.map((leg, i) => {
            const isActive = i === 0;
            const legGlobalIndex = currentLegIndex + i;

            if (leg.mode === "water") {
              return (
                <FerrySection
                  key={legGlobalIndex}
                  ferryLeg={leg as FerryLeg}
                  isActive={isActive}
                  t={t}
                />
              );
            }

            return (
              <DriveLeg
                key={legGlobalIndex}
                toName={leg.toPlace.name}
                duration={leg.duration}
                isActive={isActive}
                t={t}
              />
            );
          })
        )}
      </div>

      {/* Arrival footer */}
      <div
        className="px-5 py-3 flex items-center gap-1.5 flex-shrink-0"
        style={{ borderTop: "1px solid var(--border)", color: "var(--text-secondary)" }}
      >
        <span style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}>
          {t("arrivalTime")}
        </span>
        <span style={{ fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)" }}>
          {formatTime(journey.expectedEndTime)}
        </span>
      </div>
    </div>
  );
}
