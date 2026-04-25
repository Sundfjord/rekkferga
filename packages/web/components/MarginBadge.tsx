"use client";

import type { DepartureOption } from "@shared/types";
import { formatTime, marginTier, formatMarginLabel } from "@shared/utils";
import { useTranslation } from "@/hooks/useTranslation";

interface MarginBadgeProps {
  departure: DepartureOption;
  className?: string;
}

const marginStyles: Record<string, { bg: string; text: string }> = {
  safe:   { bg: "var(--color-margin-safe-surface)",   text: "var(--color-margin-safe-text)" },
  tight:  { bg: "var(--color-margin-tight-surface)",  text: "var(--color-margin-tight-text)" },
  missed: { bg: "var(--color-margin-missed-surface)", text: "var(--color-margin-missed-text)" },
};

export default function MarginBadge({ departure, className = "" }: MarginBadgeProps) {
  const t = useTranslation();

  if (departure.marginMinutes === null) return null;

  const tier = marginTier(departure.marginMinutes);
  const { prefix, label } = formatMarginLabel(departure.marginMinutes);
  const { bg, text } = marginStyles[tier];

  return (
    <div
      className={`grid grid-cols-2 gap-x-5 rounded-xl px-4 py-3 ${className}`}
      style={{ backgroundColor: bg }}
    >
      <span
        className="text-xs font-medium uppercase tracking-wide"
        style={{ color: text, opacity: 0.6, fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
      >
        {t("departure")}
      </span>
      <span
        className="text-xs font-medium uppercase tracking-wide"
        style={{ color: text, opacity: 0.6, fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
      >
        {t("margin")}
      </span>
      <span
        className="text-xl font-bold tabular-nums leading-snug"
        style={{ color: text, fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)" }}
      >
        {formatTime(departure.expectedDepartureTime)}
      </span>
      <span
        className="text-xl font-bold tabular-nums leading-snug"
        style={{ color: text, fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)" }}
      >
        {prefix}{label}
      </span>
    </div>
  );
}
