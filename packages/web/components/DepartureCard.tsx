"use client";

import type { DepartureOption } from "@shared/types";
import { formatTime } from "@shared/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { TIER_COLOR, destinationText, splitMargin, tierOf } from "@/lib/departures";
import DestinationName from "@/components/DestinationName";
import { ChevronRightIcon } from "@/components/icons";

/**
 * One departure in the overview: destination top-left, time top-right, margin below,
 * on the tier's strong colour. Tappable (opens drive mode) only when a margin exists.
 */
export default function DepartureCard({ departure, onSelect }: { departure: DepartureOption; onSelect?: () => void }) {
  const t = useTranslation();
  const { language } = useLanguage();
  const tier = tierOf(departure);
  const time = formatTime(departure.expectedDepartureTime);
  const destination = destinationText(departure, t("general.via"));
  const margin = departure.marginMinutes === null ? null : splitMargin(departure.marginMinutes, language);

  const body = (
    <>
      <span className="flex w-full items-baseline gap-3 pr-1.5">
        <span className="min-w-0 flex-1 truncate text-lg font-bold leading-tight">
          <DestinationName departure={departure} />
        </span>
        <span className="text-xl font-bold tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
          {time}
        </span>
      </span>
      {margin && (
        <span className="flex w-full items-center gap-2.5">
          <span
            className="min-w-0 flex-1 text-[34px] font-bold leading-none tracking-tight tabular-nums"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {margin.value}
            {margin.unit && <span className="text-[15px] font-bold tracking-normal"> {margin.unit}</span>}
          </span>
          <ChevronRightIcon />
        </span>
      )}
    </>
  );

  const className = "flex w-full flex-col gap-1 rounded-[18px] py-3 pl-4 pr-2.5 text-left text-white";
  const style = { backgroundColor: TIER_COLOR[tier], fontFamily: "var(--font-dm-sans)" };

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
