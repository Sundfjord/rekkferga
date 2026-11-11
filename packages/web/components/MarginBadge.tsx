"use client";

import type { DepartureOption } from "@shared/types";
import { formatTime, marginTier, formatMarginLabel } from "@shared/utils";
import { useTranslation } from "@/hooks/useTranslation";

const tierStyles = {
  safe: { bg: "var(--color-margin-safe-surface)", text: "var(--color-margin-safe-text)" },
  tight: { bg: "var(--color-margin-tight-surface)", text: "var(--color-margin-tight-text)" },
  missed: { bg: "var(--color-margin-missed-surface)", text: "var(--color-margin-missed-text)" },
  // No arrival estimate (no position / routing failed): neutral card, time only.
  none: { bg: "var(--surface-variant)", text: "var(--text-primary)" },
} as const;

const LABEL_CLS = "text-xs font-medium uppercase tracking-wide";
const VALUE_CLS = "text-xl font-bold tabular-nums leading-snug";

export default function MarginBadge({ departure }: { departure: DepartureOption }) {
  const t = useTranslation();
  const { marginMinutes, destinationName, viaNames, expectedDepartureTime } = departure;
  const hasMargin = marginMinutes !== null;
  const { bg, text } = tierStyles[hasMargin ? marginTier(marginMinutes) : "none"];
  const margin = hasMargin ? formatMarginLabel(marginMinutes) : null;

  return (
    <div className="rounded-xl px-4 py-3 flex flex-col gap-2" style={{ backgroundColor: bg, color: text }}>
      {destinationName && (
        <div className="min-w-0" style={{ fontFamily: "var(--font-dm-sans)" }}>
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.64l-3.2-2.96a.75.75 0 1 1 1.02-1.1l4.5 4.17a.75.75 0 0 1 0 1.1l-4.5 4.17a.75.75 0 1 1-1.02-1.1l3.2-2.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
            </svg>
            <span className="truncate">{destinationName}</span>
          </div>
          {viaNames && viaNames.length > 0 && (
            <div className="text-xs truncate pl-[22px]" style={{ opacity: 0.7 }}>
              {t("via")} {viaNames.join(", ")}
            </div>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-x-5">
        <span className={LABEL_CLS} style={{ opacity: 0.6, fontFamily: "var(--font-dm-sans)" }}>
          {t("departure")}
        </span>
        <span className={LABEL_CLS} style={{ opacity: 0.6, fontFamily: "var(--font-dm-sans)" }}>
          {hasMargin && t("margin")}
        </span>
        <span className={VALUE_CLS} style={{ fontFamily: "var(--font-mono)" }}>
          {formatTime(expectedDepartureTime)}
        </span>
        <span className={VALUE_CLS} style={{ fontFamily: "var(--font-mono)" }}>
          {margin && `${margin.prefix}${margin.label}`}
        </span>
      </div>
    </div>
  );
}
