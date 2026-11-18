import { useId } from "react";

/**
 * Subtle maritime backdrop behind the ferry board: a distant mountain line, a headland with a
 * lighthouse, a ferry on the horizon and layered waves along the bottom edge. Low-contrast
 * `--deco-*` tokens keep it in the background; on the start page it fills the empty space,
 * in the quay view and drive mode the cards mostly cover it. Each piece is positioned on its
 * own so the scene works at any width (waves tile, the rest is anchored).
 */
export default function SeaBackground() {
  // Pattern/gradient ids per instance (see CoastScene for why).
  const uid = useId();
  const far = `${uid}-far`, mid = `${uid}-mid`, near = `${uid}-near`, beam = `${uid}-beam`;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Distant mountains: one wide strip, cropped to the middle on narrow screens */}
      <svg
        className="absolute inset-x-0 bottom-[66px] h-[120px] w-full lg:bottom-[72px] lg:h-[160px]"
        viewBox="0 0 1200 120"
        preserveAspectRatio="xMidYMax slice"
      >
        <path
          d="M0 120 L0 64 Q30 52 60 46 L110 58 Q150 30 180 26 Q210 34 240 52 L300 42 L360 60 Q400 36 430 32 Q470 44 500 54 L560 46 L640 66 Q670 44 700 38 Q740 48 780 58 Q820 32 850 30 Q890 44 920 54 L990 42 L1060 62 Q1100 42 1130 38 Q1170 46 1200 56 L1200 120 Z"
          fill="var(--deco-far)"
        />
      </svg>

      {/* Ferry on the horizon */}
      <svg className="absolute bottom-[92px] left-[14%] w-[64px] lg:bottom-[106px] lg:left-[40%] lg:w-[84px]" viewBox="0 0 64 34">
        <g className="scene-bob">
          <rect x="30" y="2" width="5" height="6" fill="var(--deco-funnel)" />
          <rect x="22" y="7" width="18" height="8" rx="1.5" fill="var(--deco-shape)" />
          <rect x="12" y="14" width="40" height="10" rx="1.5" fill="var(--deco-shape)" />
          <g fill="var(--deco-window)">
            <rect x="24" y="9" width="14" height="2.5" rx="0.6" />
            <rect x="15" y="17" width="4" height="3" rx="0.5" />
            <rect x="21" y="17" width="4" height="3" rx="0.5" />
            <rect x="27" y="17" width="4" height="3" rx="0.5" />
            <rect x="33" y="17" width="4" height="3" rx="0.5" />
            <rect x="39" y="17" width="4" height="3" rx="0.5" />
            <rect x="45" y="17" width="4" height="3" rx="0.5" />
          </g>
          <path d="M0 24 L64 24 L58 34 L6 34 Z" fill="var(--deco-shape)" />
        </g>
      </svg>

      {/* Headland with lighthouse and boathouse, anchored right */}
      <svg className="absolute -right-4 bottom-[90px] w-[250px] lg:bottom-[104px] lg:w-[360px]" viewBox="0 0 260 130">
        <defs>
          <linearGradient id={beam} x1="1" y1="0" x2="0" y2="0">
            <stop offset="0" stopColor="var(--deco-beam)" />
            <stop offset="1" stopColor="var(--deco-beam)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon className="deco-beam" points="200,28 40,6 40,62 200,34" fill={`url(#${beam})`} />
        <path d="M0 130 Q40 106 90 102 Q130 98 160 80 Q190 64 222 70 Q246 76 260 88 V130 Z" fill="var(--deco-land)" />
        <rect x="112" y="88" width="16" height="11" fill="var(--deco-shape)" />
        <polygon points="110,88 130,88 120,80" fill="var(--deco-shape)" />
        <polygon points="193,71 207,71 204.5,32 195.5,32" fill="var(--deco-shape)" />
        <rect x="192" y="29" width="16" height="3" rx="0.5" fill="var(--deco-shape)" />
        <rect x="195" y="21" width="10" height="8" fill="var(--deco-lamp)" />
        <polygon points="193,21 207,21 200,14" fill="var(--deco-shape)" />
      </svg>

      {/* Gulls */}
      <svg
        className="absolute bottom-[210px] right-[38%] w-[44px] lg:bottom-[250px] lg:w-[56px]"
        viewBox="0 0 44 20"
        fill="none"
        stroke="var(--deco-gull)"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        <path d="M2 12 q5 -5 10 0 q5 -5 10 0" />
        <path d="M26 5 q4 -4 8 0 q4 -4 8 0" />
      </svg>

      {/* Waves: three tiled layers, back to front */}
      <svg className="absolute inset-x-0 bottom-0 h-[112px] w-full lg:h-[128px]">
        <defs>
          <pattern id={far} width="240" height="200" patternUnits="userSpaceOnUse">
            <path d="M0 16 Q60 4 120 16 T240 16 V200 H0 Z" fill="var(--deco-wave-1)" />
          </pattern>
          <pattern id={mid} x="70" width="180" height="200" patternUnits="userSpaceOnUse">
            <path d="M0 46 Q45 34 90 46 T180 46 V200 H0 Z" fill="var(--deco-wave-2)" />
          </pattern>
          <pattern id={near} x="20" width="140" height="200" patternUnits="userSpaceOnUse">
            <path d="M0 78 Q35 68 70 78 T140 78 V200 H0 Z" fill="var(--deco-wave-3)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${far})`} />
        <rect width="100%" height="100%" fill={`url(#${mid})`} />
        <rect width="100%" height="100%" fill={`url(#${near})`} />
      </svg>
    </div>
  );
}
