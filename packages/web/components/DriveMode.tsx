"use client";

import type { DepartureOption } from "@shared/types";
import { formatDuration, formatTime } from "@shared/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { TIER_COLOR, departureKey, minutesUntil, planB, splitMargin, tierOf } from "@/lib/departures";
import { rushMessage } from "@/lib/rushMessages";
import DestinationName from "@/components/DestinationName";
import { ChevronRightIcon } from "@/components/icons";
import TimelineTrack from "@/components/TimelineTrack";


/**
 * Glanceable view of one departure for a driver: the margin, big, on the tier colour; a bar
 * with the car pinned at "now" showing only what's ahead (drive left → quay → slack or
 * overrun → ferry); and a Plan B when the margin is tight or missed.
 */
export default function DriveMode({
  departure,
  departures,
  arrivalAt,
  now,
  onSelect,
}: {
  departure: DepartureOption;
  departures: DepartureOption[];
  arrivalAt: Date | null;
  now: number;
  onSelect: (d: DepartureOption) => void;
}) {
  const t = useTranslation();
  const { language } = useLanguage();
  const tier = tierOf(departure);
  const color = TIER_COLOR[tier];
  const margin = departure.marginMinutes === null ? null : splitMargin(departure.marginMinutes, language);
  const depTime = formatTime(departure.expectedDepartureTime);
  const arrTime = arrivalAt ? formatTime(arrivalAt.toISOString()) : "–";

  const toQuay = arrivalAt ? Math.max(0, minutesUntil(arrivalAt, now)) : 0;
  const toDep = Math.max(0, minutesUntil(departure.expectedDepartureTime, now));
  const span = Math.max(toQuay, toDep, 1);
  const arr = toQuay / span;
  const dep = toDep / span;

  const alt = planB(departures, departure);
  const altMargin = alt?.marginMinutes != null ? splitMargin(alt.marginMinutes, language) : null;
  const altTier = alt ? tierOf(alt) : "none";

  return (
    <div className="flex flex-1 flex-col">
      <div
        className="animate-hero-grow flex flex-1 flex-col gap-[18px] rounded-[22px] p-5 text-white"
        style={{ backgroundColor: color, fontFamily: "var(--font-dm-sans)" }}
      >
        <span className="text-2xl font-bold leading-tight" style={{ fontFamily: "var(--font-display)" }}>
          <DestinationName departure={departure} />
        </span>

        <div className="grid flex-shrink-0 grid-cols-2 gap-2.5">
          {[
            { label: t("remainingDrive"), value: formatDuration(toQuay * 60, language) },
            { label: t("departure"), value: depTime },
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-0.5 rounded-[14px] bg-white/15 px-3.5 py-3">
              <span className="text-[13px]">{s.label}</span>
              <span className="text-[30px] font-bold tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
                {s.value}
              </span>
            </div>
          ))}
        </div>

        {margin && tier !== "none" && (
          <div className="flex flex-col gap-1">
            <span className="text-sm">{t("marginOnArrival")}</span>
            <span
              className="text-[clamp(64px,24vw,112px)] font-bold leading-[0.95] tracking-[-0.05em] tabular-nums"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {margin.value}
              {margin.unit && <span className="text-[30px] tracking-normal"> {margin.unit}</span>}
            </span>
            <span className="mt-1.5 text-[19px] font-semibold leading-snug">{rushMessage(t, departure.marginMinutes ?? 0, departureKey(departure))}</span>
          </div>
        )}

        {/* What's ahead: car (now) → quay → slack/overrun → ferry */}
        <div className="mt-auto">
          <TimelineTrack
            markers={[
              { key: "now", at: 0, color: "#fff", action: t("now"), time: formatTime(new Date(now).toISOString()) },
              { key: "arrival", at: arr, color: "var(--water-dark)", action: t("arrive"), time: arrTime },
              { key: "ferry", at: dep, color: "#fff", action: t("departure"), time: depTime },
            ]}
            segments={[
              { key: "road", from: 0, to: Math.min(arr, dep), color: "#fff" },
              { key: "slack", from: Math.min(arr, dep), to: Math.max(arr, dep), color: "rgba(255,255,255,0.6)" },
            ]}
            trackColor="rgba(255,255,255,0.25)"
            tooltipBg="#fff"
            tooltipText={color}
            ariaLabel={t("progressAria", { minutes: Math.round(toQuay), arrival: arrTime, departure: depTime })}
          />
        </div>
      </div>

      {alt && altMargin && (
        <button
          type="button"
          onClick={() => onSelect(alt)}
          className="mt-2.5 flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl py-2.5 pl-4 pr-3 text-left text-white"
          style={{ backgroundColor: TIER_COLOR[altTier], fontFamily: "var(--font-dm-sans)" }}
        >
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[13px]">{t("planB")}</span>
            <span className="truncate text-[17px] font-bold">
              <DestinationName departure={alt} />{" "}
              <span style={{ fontFamily: "var(--font-mono)" }}>{formatTime(alt.expectedDepartureTime)}</span>
            </span>
          </span>
          <span className="text-[22px] font-bold tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
            {altMargin.value}
          </span>
          <ChevronRightIcon size={20} />
        </button>
      )}
    </div>
  );
}
