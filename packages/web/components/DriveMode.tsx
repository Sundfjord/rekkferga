"use client";

import type { DepartureOption } from "@shared/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { TIER_COLOR, departureKey, planB, splitMargin, tierOf } from "@/lib/departures";
import { transitionName } from "@/lib/viewTransition";
// import { rushMessage } from "@/lib/rushMessages"; // rush messages temporarily disabled
import DepartureHeading from "@/components/DepartureHeading";
import DepartureTime from "@/components/DepartureTime";
import DestinationName from "@/components/DestinationName";
import { ChevronRightIcon, CloseIcon } from "@/components/icons";

/**
 * Glanceable view of one departure for a driver: the same heading as its card (destination,
 * time), then the margin, big, on the tier colour, and a Plan B when the margin is tight or
 * missed. Drive time and arrival sit above it in the quay view.
 */
export default function DriveMode({
  departure,
  departures,
  onSelect,
  onClose,
  closeLabel,
}: {
  departure: DepartureOption;
  departures: DepartureOption[];
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
  const alt = planB(departures, departure);
  const altMargin = alt?.marginMinutes != null ? splitMargin(alt.marginMinutes, language) : null;
  const altTier = alt ? tierOf(alt) : "none";

  return (
    <div className="flex flex-1 flex-col">
      <div
        className="flex flex-1 flex-col gap-3.5 rounded-[18px] px-3.5 py-2.5 text-white sm:gap-[18px] sm:px-4 sm:py-3.5"
        style={{ backgroundColor: color }}
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
          <div className="flex flex-col gap-1 rounded-[14px] bg-white/15 px-3.5 py-2.5 sm:py-3">
            <span className="text-[17px] leading-snug sm:text-[19px]">{t("drive.marginOnArrival")}</span>
            {/* Self-sized (not full width) so it morphs cleanly from the card's margin. */}
            <span
              className="self-start font-mono text-[clamp(56px,20vw,112px)] font-bold leading-[0.95] tracking-[-0.05em] tabular-nums [view-transition-class:morph]"
              style={{ viewTransitionName: transitionName("margin", departureKey(departure)) }}
            >
              {margin.value}
              {margin.unit && <span className="text-[24px] tracking-normal sm:text-[30px]"> {margin.unit}</span>}
            </span>
            {/* Rush messages temporarily disabled — restore this line and the rushMessage import.
            <span className="mt-1.5 text-[19px] font-semibold leading-snug">{rushMessage(t.list, departure.marginMinutes ?? 0, departureKey(departure))}</span>
            */}
          </div>
        )}
      </div>

      {alt && altMargin && (
        <button
          type="button"
          onClick={() => onSelect(alt)}
          className="mt-2 flex min-h-14 cursor-pointer sm:mt-2.5 items-center gap-3 rounded-2xl py-2.5 pl-4 pr-3 text-left text-white"
          style={{ backgroundColor: TIER_COLOR[altTier] }}
        >
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[13px]">{t("drive.planB")}</span>
            <span className="truncate text-[16px] font-bold sm:text-[17px]">
              <DestinationName departure={alt} />{" "}
              <span className="font-mono"><DepartureTime departure={alt} /></span>
            </span>
          </span>
          <span
            className="font-mono text-[22px] font-bold tabular-nums [view-transition-class:morph]"
            style={{ viewTransitionName: transitionName("margin", departureKey(alt)) }}
          >
            {altMargin.value}
          </span>
          <ChevronRightIcon size={20} />
        </button>
      )}
    </div>
  );
}
