"use client";

import type { DepartureOption } from "@shared/types";
import DepartureTime from "@/components/DepartureTime";
import DestinationName from "@/components/DestinationName";

/**
 * Destination (with "via …") with the departure time below it. The same block tops a
 * departure card in the overview and the hero in drive mode.
 */
export default function DepartureHeading({ departure, className = "" }: { departure: DepartureOption; className?: string }) {
  return (
    <span className={`flex min-w-0 flex-col gap-0.5 ${className}`}>
      <span className="truncate text-[18px] font-bold leading-tight sm:text-[21px]">
        <DestinationName departure={departure} />
      </span>
      <span className="font-mono text-[22px] font-bold leading-tight tabular-nums sm:text-[26px]">
        <DepartureTime departure={departure} />
      </span>
    </span>
  );
}
