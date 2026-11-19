"use client";

import type { TrafficLevel } from "@shared/utils";
import { formatDuration, formatTime } from "@shared/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import Spinner from "@/components/Spinner";

/**
 * One line saying how live the quay view is: a pulsing dot in the traffic colour, how the drive
 * compares with usual traffic ("+6min" when slower), and when the data was last updated. The
 * dot turns into a spinner while a refresh runs; without traffic data it's a plain green dot.
 */
export default function LiveStatus({
  traffic,
  updatedAt,
  refreshing,
}: {
  /** Traffic vs usual and the delay over usual, or null when unknown (no position, no data). */
  traffic: { level: TrafficLevel; delaySeconds: number } | null;
  /** Latest of the drive-time and departure updates. */
  updatedAt: Date;
  refreshing: boolean;
}) {
  const t = useTranslation();
  const { language } = useLanguage();
  const color = traffic ? `var(--traffic-${traffic.level})` : "var(--margin-safe)";
  const trafficLabel = !traffic
    ? null
    : traffic.level === "normal"
      ? t("quay.traffic.normal")
      : t(`quay.traffic.${traffic.level}`, { delay: formatDuration(traffic.delaySeconds, language) });
  const updated = t("general.updatedAt", { time: formatTime(updatedAt.toISOString()) });

  return (
    <div className="flex items-center gap-2.5 px-1 text-[15px]" style={{ color: "var(--text-secondary)" }}>
      <span className="relative flex h-3 w-3 flex-shrink-0 items-center justify-center" aria-hidden>
        {refreshing ? (
          <Spinner className="h-3 w-3" />
        ) : (
          <>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 motion-reduce:animate-none" style={{ backgroundColor: color }} />
            <span className="relative inline-flex h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
          </>
        )}
      </span>
      <span className="min-w-0">
        {trafficLabel && (
          <>
            <span style={{ color: "var(--text-primary)" }}>{trafficLabel}</span> ·{" "}
          </>
        )}
        {updated}
      </span>
    </div>
  );
}
