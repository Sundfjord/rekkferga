"use client";

import type { DepartureOption } from "@shared/types";
import { formatTime } from "@shared/utils";
import DestinationName from "@/components/DestinationName";

/**
 * Destination (with "via …") with the departure time below it. The same block tops a
 * departure card in the overview and the hero in drive mode.
 */
export default function DepartureHeading({ departure, className = "" }: { departure: DepartureOption; className?: string }) {
  return (
    <span className={`flex min-w-0 flex-col gap-0.5 ${className}`}>
      <span className="truncate text-[21px] font-bold leading-tight">
        <DestinationName departure={departure} />
      </span>
      <span className="text-[26px] font-bold leading-tight tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
        {formatTime(departure.expectedDepartureTime)}
      </span>
    </span>
  );
}
