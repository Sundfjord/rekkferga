"use client";

const LINE_W = 4; // every marker is the same vertical line
const LINE_H = 28;
const GAP = 4; // between a label row and the line

export interface TimelineMarker {
  key: string;
  /** Position along the track, 0 (left edge) – 1 (right edge). */
  at: number;
  color: string;
  /** Shown above the marker (normal weight). */
  action: string;
  /** Shown below the marker (bold). */
  time: string;
  /** Higher wins when labels would collide; the loser's labels fade out. */
  priority: number;
}

export interface TimelineSegment {
  key: string;
  from: number;
  to: number;
  color: string;
}

// Every moving part animates position/size changes (each clock tick or poll moves things),
// except for users who prefer reduced motion.
const MOTION = "transition-[left,width,transform,opacity] duration-700 ease-out motion-reduce:transition-none";

// Centre of a marker line, keeping the whole line inside the track at both ends.
const centre = (f: number) => `calc((100% - ${LINE_W}px) * ${f.toFixed(4)} + ${LINE_W / 2}px)`;

// Labels are always positioned with `left` + `transform` (both animatable): centred on the
// marker, but pulled inwards near the edges so they never spill outside the track.
const labelShift = (f: number) =>
  f < 0.12 ? `translateX(-${LINE_W / 2}px)` : f > 0.88 ? `translateX(calc(-100% + ${LINE_W / 2}px))` : "translateX(-50%)";

/** Keys whose labels are shown: closer than `gap` to a higher-priority marker → hidden. */
function visibleLabels(markers: TimelineMarker[], gap: number): Set<string> {
  const shown: TimelineMarker[] = [];
  for (const m of [...markers].sort((a, b) => b.priority - a.priority)) {
    if (shown.every((s) => Math.abs(s.at - m.at) >= gap)) shown.push(m);
  }
  return new Set(shown.map((m) => m.key));
}

/**
 * Full-width horizontal timeline: coloured track segments and equal vertical line markers,
 * each with its action above and time below. Positions animate as the values change.
 */
export default function TimelineTrack({
  markers,
  segments,
  trackColor,
  textColor,
  labelSize = 13,
  labelGap = 0.2,
  ariaLabel,
}: {
  markers: TimelineMarker[];
  segments: TimelineSegment[];
  trackColor: string;
  textColor: string;
  labelSize?: number;
  /** Minimum distance (fraction of the width) between two markers' labels. */
  labelGap?: number;
  ariaLabel: string;
}) {
  const row = Math.round(labelSize * 1.3);
  const lineTop = row + GAP;
  const trackTop = lineTop + LINE_H / 2 - 3;
  const labeled = visibleLabels(markers, labelGap);
  // Higher-priority markers draw last, so they sit on top when they overlap.
  const ordered = [...markers].sort((a, b) => a.priority - b.priority);

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className="relative w-full flex-shrink-0"
      style={{ height: lineTop + LINE_H + GAP + row, color: textColor, fontSize: labelSize }}
    >
      <div className="absolute inset-x-0 h-1.5 rounded-full" style={{ top: trackTop, backgroundColor: trackColor }} />
      {segments.map((s) => (
        <div
          key={s.key}
          className={`absolute h-1.5 rounded-full ${MOTION}`}
          style={{
            top: trackTop,
            left: `${Math.min(s.from, s.to) * 100}%`,
            width: `${Math.abs(s.to - s.from) * 100}%`,
            backgroundColor: s.color,
          }}
        />
      ))}
      {ordered.map((m) => {
        const label = { left: centre(m.at), transform: labelShift(m.at), opacity: labeled.has(m.key) ? 1 : 0 };
        return (
          <div key={m.key} aria-hidden>
            <span className={`absolute top-0 whitespace-nowrap leading-none ${MOTION}`} style={label}>
              {m.action}
            </span>
            <span
              className={`absolute rounded-full shadow-sm ${MOTION}`}
              style={{ top: lineTop, left: centre(m.at), width: LINE_W, height: LINE_H, marginLeft: -LINE_W / 2, backgroundColor: m.color }}
            />
            <span
              className={`absolute whitespace-nowrap font-bold leading-none tabular-nums ${MOTION}`}
              style={{ top: lineTop + LINE_H + GAP, fontFamily: "var(--font-mono)", ...label }}
            >
              {m.time}
            </span>
          </div>
        );
      })}
    </div>
  );
}
