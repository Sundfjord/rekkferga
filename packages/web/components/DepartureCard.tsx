"use client";

import type { DepartureOption } from "@shared/types";
import { formatTime } from "@shared/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { TIER_COLOR, departureKey, destinationText, splitMargin, tierOf } from "@/lib/departures";
import { transitionName } from "@/lib/viewTransition";
import DepartureHeading from "@/components/DepartureHeading";

/**
 * One departure in the overview: the shared heading (destination, time below) on the left,
 * the margin on the right, on the tier's strong colour. Tappable (opens drive mode) only
 * when a margin exists; the margin then morphs into the big one in drive mode.
 */
export default function DepartureCard({ departure, onSelect }: { departure: DepartureOption; onSelect?: () => void }) {
  const t = useTranslation();
  const { language } = useLanguage();
  const key = departureKey(departure);
  const tier = tierOf(departure);
  const time = formatTime(departure.expectedDepartureTime);
  const destination = destinationText(departure, t("general.via"));
  const margin = departure.marginMinutes === null ? null : splitMargin(departure.marginMinutes, language);

  const body = (
    <>
      <DepartureHeading departure={departure} className="flex-1" />
      {margin && (
        <span
          className="flex-shrink-0 text-[34px] font-bold leading-none tracking-tight tabular-nums [view-transition-class:morph]"
          style={{ fontFamily: "var(--font-mono)", viewTransitionName: transitionName("margin", key) }}
        >
          {margin.value}
          {margin.unit && <span className="text-[15px] font-bold tracking-normal"> {margin.unit}</span>}
        </span>
      )}
    </>
  );

  const className = "flex w-full items-center gap-3 rounded-[18px] px-4 py-3.5 text-left text-white";
  const style = {
    backgroundColor: TIER_COLOR[tier],
    fontFamily: "var(--font-dm-sans)",
  };

  if (!onSelect || !margin) {
    return <div className={className} style={style}>{body}</div>;
  }
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={t("quay.departureAria", { destination, time, margin: margin.value })}
      className={`${className} cursor-pointer transition-transform active:scale-[0.99]`}
      style={style}
    >
      {body}
    </button>
  );
}
