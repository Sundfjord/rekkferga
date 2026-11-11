"use client";

import type { DepartureOption } from "@shared/types";
import { useTranslation } from "@/hooks/useTranslation";
import { destinationParts } from "@/lib/departures";

/** End destination, then "via …" in normal weight for any stops on the way. */
export default function DestinationName({ departure }: { departure: DepartureOption }) {
  const t = useTranslation();
  const { name, via } = destinationParts(departure);
  return (
    <>
      {name}
      {via.length > 0 && (
        <span className="font-normal">
          {" "}
          {t("via")} {via.join(", ")}
        </span>
      )}
    </>
  );
}
