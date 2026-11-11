"use client";

import type { DepartureOption } from "@shared/types";
import { formatTime } from "@shared/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { TIER_COLOR, departureKey, minutesUntil, tierOf } from "@/lib/departures";
import TimelineTrack, { type TimelineMarker } from "@/components/TimelineTrack";

const MIN_RANGE_MIN = 30;

/**
 * Overview strip from now (left) to just past the last departure: you (now), your arrival
 * at the quay, and every departure in its tier colour.
 */
export default function DepartureTimeline({
  departures,
  arrivalAt,
  now,
}: {
  departures: DepartureOption[];
  arrivalAt: Date | null;
  now: number;
}) {
  const t = useTranslation();
  if (departures.length === 0) return null;

  const arrivalMin = arrivalAt ? Math.max(0, minutesUntil(arrivalAt, now)) : null;
  const lastMin = Math.max(...departures.map((d) => minutesUntil(d.expectedDepartureTime, now)));
  const range = Math.max(MIN_RANGE_MIN, Math.max(lastMin, arrivalMin ?? 0) * 1.08);
  const frac = (min: number) => Math.min(1, Math.max(0, min / range));
  const arrivalTime = arrivalAt ? formatTime(arrivalAt.toISOString()) : "";

  // Drawn in order, so the arrival marker (last) sits on top of a departure at the same spot.
  const markers: TimelineMarker[] = [
    { key: "now", at: 0, color: "var(--water-light)", action: t("now"), time: formatTime(new Date(now).toISOString()) },
    ...departures.map((d) => ({
      key: departureKey(d),
      at: frac(minutesUntil(d.expectedDepartureTime, now)),
      color: TIER_COLOR[tierOf(d)],
      action: t("departure"),
      time: formatTime(d.expectedDepartureTime),
    })),
  ];
  if (arrivalMin !== null) {
    markers.push({ key: "arrival", at: frac(arrivalMin), color: "var(--text-primary)", action: t("arrive"), time: arrivalTime });
  }

  return (
    <TimelineTrack
      markers={markers}
      segments={arrivalMin === null ? [] : [{ key: "drive", from: 0, to: frac(arrivalMin), color: "var(--water-light)" }]}
      trackColor="var(--timeline-track)"
      tooltipBg="var(--text-primary)"
      tooltipText="var(--surface)"
      ariaLabel={t("timelineAria", { arrival: arrivalTime || "–", times: departures.map((d) => formatTime(d.expectedDepartureTime)).join(", ") })}
    />
  );
}
