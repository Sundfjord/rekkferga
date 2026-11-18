"use client";

import type { TrafficLevel } from "@shared/utils";
import { formatDuration } from "@shared/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Under the drive-time figures in the band: a pulsing dot in the traffic colour and how the
 * drive compares with usual traffic at this time ("+6min" when slower than usual).
 */
export default function TrafficStatus({ level, delaySeconds }: { level: TrafficLevel; delaySeconds: number }) {
  const t = useTranslation();
  const { language } = useLanguage();
  const color = `var(--traffic-${level})`;
  const label =
    level === "normal" ? t("quay.traffic.normal") : t(`quay.traffic.${level}`, { delay: formatDuration(delaySeconds, language) });

  return (
    <div className="mt-3 flex items-center justify-center gap-2.5 text-[15px]">
      <span className="relative flex h-3 w-3 flex-shrink-0" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 motion-reduce:animate-none" style={{ backgroundColor: color }} />
        <span className="relative inline-flex h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
      </span>
      <span>{label}</span>
    </div>
  );
}
