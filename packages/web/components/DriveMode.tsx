"use client";

import type { DepartureOption } from "@shared/types";
import { formatTime } from "@shared/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { TIER_COLOR, departureKey, minutesUntil, planB, splitMargin, tierOf } from "@/lib/departures";
import { transitionName } from "@/lib/viewTransition";
// import { rushMessage } from "@/lib/rushMessages"; // rush messages temporarily disabled
import DepartureHeading from "@/components/DepartureHeading";
import DepartureTime from "@/components/DepartureTime";
import DestinationName from "@/components/DestinationName";
import { ChevronRightIcon, CloseIcon } from "@/components/icons";
import TimelineTrack from "@/components/TimelineTrack";


/**
 * Glanceable view of one departure for a driver: the same heading as its card (destination,
 * time), then the margin, big, on the tier colour; a bar
 * with the car pinned at "now" showing only what's ahead (drive left → quay → slack or
 * overrun → ferry); and a Plan B when the margin is tight or missed.
 */
export default function DriveMode({
  departure,
  departures,
  arrivalAt,
  now,
  onSelect,
  onClose,
  closeLabel,
}: {
  departure: DepartureOption;
  departures: DepartureOption[];
  arrivalAt: Date | null;
  now: number;
  onSelect: (d: DepartureOption) => void;
  /** Back to the quay's departure overview. */
  onClose: () => void;
  closeLabel: string;
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
        className="flex flex-1 flex-col gap-[18px] rounded-[18px] px-4 py-3.5 text-white"
        style={{ backgroundColor: color, fontFamily: "var(--font-dm-sans)" }}
      >
        {/* Same padding and radius as DepartureCard, so the heading stays put when a card opens.
            Drive time and arrival sit above (QuayPanel), as in the overview. */}
        <div className="flex items-start gap-3">
          <DepartureHeading departure={departure} className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="-mr-2 -mt-2 flex h-11 w-11 flex-shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-white/15"
          >
            <CloseIcon />
          </button>
        </div>

        {margin && tier !== "none" && (
            <div className="flex flex-col gap-1 rounded-[14px] bg-white/15 px-3.5 py-3">
            <span className="text-[19px] leading-snug">{t("drive.marginOnArrival")}</span>
            {/* Self-sized (not full width) so it morphs cleanly from the card's margin. */}
            <span
              className="self-start text-[clamp(64px,24vw,112px)] font-bold leading-[0.95] tracking-[-0.05em] tabular-nums [view-transition-class:morph]"
              style={{ fontFamily: "var(--font-mono)", viewTransitionName: transitionName("margin", departureKey(departure)) }}
            >
              {margin.value}
              {margin.unit && <span className="text-[30px] tracking-normal"> {margin.unit}</span>}
            </span>
            {/* Rush messages temporarily disabled — restore this line and the rushMessage import.
            <span className="mt-1.5 text-[19px] font-semibold leading-snug">{rushMessage(t.list, departure.marginMinutes ?? 0, departureKey(departure))}</span>
            */}
          </div>
        )}

        {/* What's ahead: car (now) → quay → slack/overrun → ferry — in the same box as the figures.
            Inside the lightened box, the unfilled track is a dark tint (not faint white) and the
            slack a stronger white, so neither drowns in the box background. */}
        <div className="flex flex-col gap-2 rounded-[14px] bg-white/15 px-3.5 pb-3 pt-3">
          <span className="text-[19px] leading-snug">{t("drive.timelineTitle")}</span>
          <TimelineTrack
            markers={[
              { key: "now", at: 0, color: "#fff", action: t("general.now"), time: formatTime(new Date(now).toISOString()), priority: 3 },
              { key: "arrival", at: arr, color: "var(--water-dark)", action: t("general.arrive"), time: arrTime, priority: 2 },
              { key: "ferry", at: dep, color: "#fff", action: t("general.departure"), time: depTime, priority: 2.5 },
            ]}
            segments={[
              { key: "road", from: 0, to: Math.min(arr, dep), color: "#fff" },
              { key: "slack", from: Math.min(arr, dep), to: Math.max(arr, dep), color: "rgba(255,255,255,0.55)" },
            ]}
            trackColor="rgba(1,22,56,0.3)"
            textColor="#fff"
            ariaLabel={t("drive.progressAria", { minutes: Math.round(toQuay), arrival: arrTime, departure: depTime })}
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
            <span className="text-[13px]">{t("drive.planB")}</span>
            <span className="truncate text-[17px] font-bold">
              <DestinationName departure={alt} />{" "}
              <span style={{ fontFamily: "var(--font-mono)" }}><DepartureTime departure={alt} /></span>
            </span>
          </span>
          <span
            className="text-[22px] font-bold tabular-nums [view-transition-class:morph]"
            style={{ fontFamily: "var(--font-mono)", viewTransitionName: transitionName("margin", departureKey(alt)) }}
          >
            {altMargin.value}
          </span>
          <ChevronRightIcon size={20} />
        </button>
      )}
    </div>
  );
}
