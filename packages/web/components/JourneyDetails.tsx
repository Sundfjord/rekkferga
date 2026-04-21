"use client";

import type { JourneyResult, FerryLeg, DepartureOption, ResultItem, TripState, JourneyLeg } from "@shared/types";
import { formatTime, formatDuration, marginTier, formatMarginLabel } from "@shared/utils";
import { useTranslation } from "@/hooks/useTranslation";

function MarginBadge({ minutes, departureTime }: { minutes: number | null; departureTime?: string }) {
  if (minutes === null) return null;
  const tier = marginTier(minutes);
  const { prefix, label } = formatMarginLabel(minutes);
  const isTight = tier === "tight";
  const departurePrefix = departureTime ? `${formatTime(departureTime)} ` : "";

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
        {departurePrefix}{prefix}{label}
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

type TimelineStep =
  | { kind: "label"; text: string; markerTone?: "default" | "water" }
  | { kind: "duration"; label: string; durationSeconds: number }
  | { kind: "ferryQuay"; quayName: string; departures: DepartureOption[]; markerTone: "water" };

type TimelineMarker = "dot" | "arrow" | "start" | "finish";

function ArrowMarker() {
  return (
    <svg
      className="absolute left-[1px] top-[3px] z-10 w-6 h-6"
      viewBox="0 0 16 16"
      aria-hidden
      style={{ color: "var(--border)" }}
    >
      <path
        d="M4.5 6.5L8 10l3.5-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StartMarker() {
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <div
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: "10px",
          height: "10px",
          background: "rgba(59,130,246,0.4)",
          animation: "user-location-pulse 2s ease-out infinite",
        }}
      />
      <div
        className="absolute left-[1px] rounded-full"
        style={{
          transform: "translate(-50%, -50%)",
          width: "14px",
          height: "14px",
          background: "#3b82f6",
          border: "2px solid white",
          boxShadow: "0 2px 10px rgba(59,130,246,0.45)",
        }}
      />
    </div>
  );
}

function FinishMarker() {
  return (
    <div
      className="absolute left-[14px] top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden"
      style={{
        width: "22px",
        height: "22px",
        border: "1.5px solid #011683",
        boxShadow: "0 1px 6px rgba(0,0,0,0.25)",
        backgroundColor: "#42a5f5",
      }}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 6 6"
        aria-hidden
        style={{ display: "block", marginLeft: "-2px", marginTop: "-2px" }}
      >
        <rect width="6" height="6" fill="white" />
        <rect width="1" height="1" x="0" y="0" fill="#011638" />
        <rect width="1" height="1" x="2" y="0" fill="#011638" />
        <rect width="1" height="1" x="4" y="0" fill="#011638" />
        <rect width="1" height="1" x="1" y="1" fill="#011638" />
        <rect width="1" height="1" x="3" y="1" fill="#011638" />
        <rect width="1" height="1" x="5" y="1" fill="#011638" />
        <rect width="1" height="1" x="0" y="2" fill="#011638" />
        <rect width="1" height="1" x="2" y="2" fill="#011638" />
        <rect width="1" height="1" x="4" y="2" fill="#011638" />
        <rect width="1" height="1" x="1" y="3" fill="#011638" />
        <rect width="1" height="1" x="3" y="3" fill="#011638" />
        <rect width="1" height="1" x="5" y="3" fill="#011638" />
        <rect width="1" height="1" x="0" y="4" fill="#011638" />
        <rect width="1" height="1" x="2" y="4" fill="#011638" />
        <rect width="1" height="1" x="4" y="4" fill="#011638" />
        <rect width="1" height="1" x="1" y="5" fill="#011638" />
        <rect width="1" height="1" x="3" y="5" fill="#011638" />
        <rect width="1" height="1" x="5" y="5" fill="#011638" />
      </svg>
    </div>
  );
}

function DotMarker({ tone = "default" }: { tone?: "default" | "water" }) {
  const style = tone === "water"
    ? { backgroundColor: "var(--water)", border: "2px solid var(--water)" }
    : { backgroundColor: "var(--surface)", border: "2px solid var(--border)" };

  return (
    <div
      className="absolute left-[12.5px] top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full w-4 h-4"
      style={style}
    />
  );
}

function TimelineRail({
  marker,
  markerTone,
  isFirst,
  isLast,
}: {
  marker?: TimelineMarker;
  markerTone?: "default" | "water";
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const renderMarker = () => {
    if (marker === "arrow") return <ArrowMarker />;
    if (marker === "start") return <StartMarker />;
    if (marker === "finish") return <FinishMarker />;
    return <DotMarker tone={markerTone} />;
  };

  return (
    <div className="relative w-6 flex-shrink-0">
      {isFirst && (
        <div
          className="absolute left-1/2 top-0 bottom-1/2 -translate-x-1/2 w-1"
          style={{ backgroundColor: "var(--surface)" }}
        />
      )}
      {isLast && (
        <div
          className="absolute left-1/2 top-1/2 bottom-0 -translate-x-1/2 w-1"
          style={{ backgroundColor: "var(--surface)" }}
        />
      )}
      {renderMarker()}
    </div>
  );
}

function FerryQuayStepContent({ step, t }: { step: Extract<TimelineStep, { kind: "ferryQuay" }>; t: (key: string) => string }) {
  return (
    <div className="flex-1 min-w-0 py-1">
      <div className="rounded-lg px-3 py-3" style={{ backgroundColor: "var(--surface-variant)" }}>
        <div
          className="text-base font-semibold truncate"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
        >
          {step.quayName}
        </div>
        {step.departures.length > 0 ? (
          <div className="mt-2 flex flex-col items-start gap-2">
            {step.departures.map((departure, index) => (
              <MarginBadge
                key={`${departure.expectedDepartureTime}-${index}`}
                minutes={departure.marginMinutes}
                departureTime={departure.expectedDepartureTime}
              />
            ))}
          </div>
        ) : (
          <div
            className="mt-2 text-sm"
            style={{ color: "var(--text-disabled)", fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
          >
            {t("unavailable")}
          </div>
        )}
      </div>
    </div>
  );
}

function DurationStepContent({ step }: { step: Extract<TimelineStep, { kind: "duration" }> }) {
  return (
    <div className="flex min-w-0 flex-1 py-1">
      <div className="flex w-full items-baseline justify-between gap-3">
        <span
          className="text-xs"
          style={{
            color: "var(--text-secondary)",
            fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
          }}
        >
          {step.label}
        </span>
        <span
          className="text-sm flex-shrink-0"
          style={{
            color: "var(--text-secondary)",
            fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)",
          }}
        >
          {formatDuration(step.durationSeconds)}
        </span>
      </div>
    </div>
  );
}

function LabelStepContent({ step }: { step: Extract<TimelineStep, { kind: "label" }> }) {
  return (
    <div className="flex min-w-0 flex-1 py-1">
      <span
        className="text-base font-semibold truncate"
        style={{
          color: "var(--text-primary)",
          fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
        }}
      >
        {step.text}
      </span>
    </div>
  );
}

function StepContent({ step, t }: { step: TimelineStep; t: (key: string) => string }) {
  if (step.kind === "ferryQuay") return <FerryQuayStepContent step={step} t={t} />;
  if (step.kind === "duration") return <DurationStepContent step={step} />;
  return <LabelStepContent step={step} />;
}

function TimelineStepRow({
  step,
  iconType,
  isFirst,
  isLast,
  t,
}: {
  step: TimelineStep;
  iconType?: "start" | "finish";
  isFirst: boolean;
  isLast: boolean;
  t: (key: string) => string;
}) {
  return (
    <div className={`px-5 ${isFirst ? "pb-2" : isLast ? "pt-2" : ""} ${!isFirst && !isLast ? "py-2" : ""} flex gap-3`}>
      <TimelineRail
        marker={step.kind === "duration" ? "arrow" : iconType ?? "dot"}
        markerTone={step.kind === "duration" ? "default" : step.markerTone ?? "default"}
        isFirst={isFirst}
        isLast={isLast}
      />
      <StepContent step={step} t={t} />
    </div>
  );
}

function normalizeLocationName(name: string, t: (key: string) => string): string {
  return name.trim().toLowerCase() === "origin" ? t("yourLocation") : name;
}

function buildTimelineSteps(legs: JourneyLeg[], destinationName: string, t: (key: string) => string): TimelineStep[] {
  const steps: TimelineStep[] = [];
  const pushLabelStep = (text: string, force = false, markerTone: "default" | "water" = "default") => {
    const normalizedText = normalizeLocationName(text, t);
    const previousStep = steps[steps.length - 1];
    if (
      !force &&
      previousStep &&
      previousStep.kind === "label" &&
      previousStep.text.trim().toLowerCase() === normalizedText.trim().toLowerCase()
    ) {
      return;
    }

    steps.push({ kind: "label", text: normalizedText, markerTone });
  };

  for (const leg of legs) {
    if (leg.mode === "car") {
      pushLabelStep(leg.fromPlace.name);
      steps.push({ kind: "duration", label: t("driveStep"), durationSeconds: leg.duration });
      continue;
    }

    const ferryLeg = leg as FerryLeg;
    const departures = (ferryLeg.departures ?? [])
      .filter((departure) => departure.marginMinutes !== null)
      .slice(0, 2);

    steps.push({
      kind: "ferryQuay",
      quayName: normalizeLocationName(ferryLeg.fromPlace.name, t),
      departures,
      markerTone: "water",
    });
    steps.push({ kind: "duration", label: t("ferryTripStep"), durationSeconds: ferryLeg.duration });
    pushLabelStep(ferryLeg.toPlace.name, false, "water");
  }

  pushLabelStep(destinationName, true);

  return steps;
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
  const timelineSteps = buildTimelineSteps(remainingLegs, destination.name, t);
  const locationStepIndices = timelineSteps
    .map((step, index) => ((step.kind === "label" || step.kind === "ferryQuay") ? index : -1))
    .filter((index) => index >= 0);
  const firstLocationStepIndex = locationStepIndices[0];
  const destinationStepIndex = timelineSteps.length - 1;

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
      <div className="overflow-y-auto flex-1 min-h-0">
        {tripState === 'arrived' ? (
          <div
            className="px-5 py-5 text-sm text-center"
            style={{ color: "var(--text-secondary)", fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
          >
            {t("arriveAt", { place: destination.name })}
          </div>
        ) : (
          <>
            <div className="relative">
              <div
                className="absolute top-0 bottom-0"
                style={{ left: "2rem", borderLeft: "2px solid var(--border)" }}
              />
              {timelineSteps.map((step, index) => (
                <TimelineStepRow
                  key={`${step.kind}-${index}`}
                  step={step}
                  isFirst={index === 0}
                  isLast={index === timelineSteps.length - 1}
                  iconType={
                    index === firstLocationStepIndex
                      ? "start"
                      : index === destinationStepIndex && step.kind === "label"
                        ? "finish"
                        : undefined
                  }
                  t={t}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Arrival footer */}
      <div
        className="px-5 py-3 flex items-center justify-between gap-4 flex-shrink-0"
        style={{ borderTop: "1px solid var(--border)", color: "var(--text-secondary)" }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}>
            {t("arrivalTime")}
          </span>
          <span style={{ fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)" }}>
            {formatTime(journey.expectedEndTime)}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
          <span
            className="text-sm"
            style={{ fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)" }}
          >
            {formatDuration(journey.duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
