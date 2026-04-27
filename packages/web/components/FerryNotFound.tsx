"use client";

import { useTranslation } from "@/hooks/useTranslation";

export default function FerryNotFound() {
  const t = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-6 px-8 py-12">
      <div className="animate-ferry-bob" style={{ color: "var(--water-light)" }}>
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden>
          {/* Funnel */}
          <rect x="32" y="18" width="8" height="12" rx="2" fill="currentColor" opacity="0.7" />
          {/* Superstructure */}
          <rect x="20" y="28" width="32" height="14" rx="3" fill="currentColor" />
          {/* Windows */}
          <rect x="25" y="33" width="7" height="5" rx="1.5" fill="white" opacity="0.45" />
          <rect x="40" y="33" width="7" height="5" rx="1.5" fill="white" opacity="0.45" />
          {/* Hull */}
          <path d="M10 42 H62 L56 56 H16 Z" fill="currentColor" />
          {/* Waterline waves */}
          <path
            d="M4 62 Q13 57 22 62 Q31 67 40 62 Q49 57 58 62 Q64 65 68 62"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.5"
          />
        </svg>
      </div>

      <p
        className="text-sm text-center max-w-xs leading-relaxed"
        style={{ color: "var(--text-secondary)", fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
      >
        {t("noRouteDocks")}
      </p>
    </div>
  );
}
