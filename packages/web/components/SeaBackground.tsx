import Image from "next/image";
import { memo, useId } from "react";

/**
 * Subtle maritime backdrop behind the ferry board: a distant mountain line, a headland with a
 * lighthouse, a ferry on the horizon and layered waves along the bottom edge. Low-contrast
 * `--deco-*` tokens keep it in the background; on the start page it fills the empty space,
 * in the quay view and drive mode the cards mostly cover it. Each piece is positioned on its
 * own so the scene works at any width (waves tile, the rest is anchored).
 */
function SeaBackground() {
  // SVG ids are document-global, so the pattern/gradient ids are made unique per instance.
  const uid = useId();
  const far = `${uid}-far`, mid = `${uid}-mid`, near = `${uid}-near`, beam = `${uid}-beam`;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Distant mountains: one wide strip, cropped to the middle on narrow screens */}
      <svg
        className="absolute inset-x-0 bottom-[50px] h-[120px] w-full lg:bottom-[52px] lg:h-[160px]"
        viewBox="0 0 1200 120"
        preserveAspectRatio="xMidYMax slice"
      >
        <path
          d="M0 120 L0 64 Q30 52 60 46 L110 58 Q150 30 180 26 Q210 34 240 52 L300 42 L360 60 Q400 36 430 32 Q470 44 500 54 L560 46 L640 66 Q670 44 700 38 Q740 48 780 58 Q820 32 850 30 Q890 44 920 54 L990 42 L1060 62 Q1100 42 1130 38 Q1170 46 1200 56 L1200 120 Z"
          fill="var(--deco-far)"
        />
      </svg>

      {/* Ferry on the horizon: the artwork in public/, one version per theme, faded into the scene.
          It crosses the sea and back on a loop (.ferry-sail), bobbing on the swell (.scene-bob);
          with reduced motion it stays parked at the left-* position below. */}
      <div className="ferry-sail absolute bottom-[75px] left-[16%] w-[96px] opacity-[0.55] lg:bottom-[90px] lg:left-[35%] lg:w-[124px]">
        <div className="scene-bob">
          <Image src="/ferge-light.svg" alt="" width={153} height={67} className="h-auto w-full dark:hidden" />
          <Image src="/ferge-dark.svg" alt="" width={153} height={67} className="hidden h-auto w-full dark:block" />
        </div>
      </div>

      {/* Headland with lighthouse and boathouse, anchored right */}
      <svg className="absolute -right-4 bottom-[74px] w-[250px] lg:bottom-[84px] lg:w-[360px]" viewBox="0 0 260 130">
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
        className="absolute bottom-[194px] right-[38%] w-[44px] lg:bottom-[230px] lg:w-[56px]"
        viewBox="0 0 44 20"
        fill="none"
        stroke="var(--deco-gull)"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        <path d="M2 12 q5 -5 10 0 q5 -5 10 0" />
        <path d="M26 5 q4 -4 8 0 q4 -4 8 0" />
      </svg>

      {/* Waves: three tiled layers, back to front. A gentle swell: the waterline (top of the
          back layer) sits 16px below the top, i.e. 80px up (lg: 92px); the scene sits on it. */}
      <svg className="absolute inset-x-0 bottom-0 h-[96px] w-full lg:h-[108px]">
        <defs>
          <pattern id={far} width="240" height="200" patternUnits="userSpaceOnUse">
            <path d="M0 16 Q60 11 120 16 T240 16 V200 H0 Z" fill="var(--deco-wave-1)" />
          </pattern>
          <pattern id={mid} x="70" width="180" height="200" patternUnits="userSpaceOnUse">
            <path d="M0 38 Q45 34 90 38 T180 38 V200 H0 Z" fill="var(--deco-wave-2)" />
          </pattern>
          <pattern id={near} x="20" width="140" height="200" patternUnits="userSpaceOnUse">
            <path d="M0 62 Q35 59 70 62 T140 62 V200 H0 Z" fill="var(--deco-wave-3)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${far})`} />
        <rect width="100%" height="100%" fill={`url(#${mid})`} />
        <rect width="100%" height="100%" fill={`url(#${near})`} />
      </svg>
    </div>
  );
}

// Static decoration: memoised so it doesn't re-render with the page on every GPS fix and clock tick.
export default memo(SeaBackground);
