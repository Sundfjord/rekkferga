"use client";

import type { DepartureOption } from "@shared/types";
import { formatTime } from "@shared/utils";
import { useTranslation } from "@/hooks/useTranslation";

/**
 * A departure's time. When realtime data has moved it off the timetable (to the minute), the
 * timetable time comes first, struck through in normal weight and dimmed, then the new time. Inherits
 * the surrounding text style, so the new time looks like any other departure time.
 */
export default function DepartureTime({ departure }: { departure: DepartureOption }) {
  const t = useTranslation();
  const time = formatTime(departure.expectedDepartureTime);
  const aimed = departure.realtime && departure.aimedDepartureTime ? formatTime(departure.aimedDepartureTime) : null;
  if (!aimed || aimed === time) return <>{time}</>;
  return (
    <>
      <span className="sr-only">{t("general.scheduled")} </span>
      <s className="font-normal opacity-70">{aimed}</s> <span className="sr-only">{t("general.newTime")} </span>
      {time}
    </>
  );
}
