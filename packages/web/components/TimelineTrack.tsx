"use client";

import { CarIcon, FerryIcon, PinIcon } from "@/components/icons";

const MARKER = 28; // every marker is the same circle
const R = MARKER / 2;
const ICON = 16;

export type MarkerKind = "car" | "quay" | "ferry";

export interface TimelineMarker {
  key: string;
  /** Position along the track, 0 (left) – 1 (right). */
  at: number;
  kind: MarkerKind;
  /** Circle fill and icon colour. */
  fill: string;
  ink: string;
  /** The action, shown above the marker (normal weight). */
  action: string;
  /** The time, shown below the marker (bold). */
  time: string;
  /** Higher wins when labels would collide; the loser's labels are hidden. */
  priority: number;
}

export interface TimelineSegment {
  key: string;
  from: number;
  to: number;
  color: string;
}

const ICONS: Record<MarkerKind, (p: { size: number }) => React.ReactNode> = {
  car: ({ size }) => <CarIcon size={size} />,
  quay: ({ size }) => <PinIcon size={size} />,
  ferry: ({ size }) => <FerryIcon size={size} />,
};

// Track runs between the centres of the first and last possible marker positions.
const x = (f: number) => `calc(${R}px + (100% - ${MARKER}px) * ${f.toFixed(4)})`;
const w = (f: number) => `calc((100% - ${MARKER}px) * ${f.toFixed(4)})`;

// Keep edge labels inside the track instead of centring them past the edge.
const labelPos = (f: number): React.CSSProperties =>
  f < 0.08 ? { left: 0 } : f > 0.92 ? { right: 0 } : { left: x(f), transform: "translateX(-50%)" };

/** Labels whose markers sit closer than `gap` lose to the higher-priority marker. */
function visibleLabels(markers: TimelineMarker[], gap: number): Set<string> {
  const shown: TimelineMarker[] = [];
  for (const m of [...markers].sort((a, b) => b.priority - a.priority)) {
    if (shown.every((s) => Math.abs(s.at - m.at) >= gap)) shown.push(m);
  }
  return new Set(shown.map((m) => m.key));
}

/**
 * A horizontal timeline: equal circular markers with an icon, the action above and the time
 * below each, over a track built from coloured segments.
 */
export default function TimelineTrack({
  markers,
  segments,
  trackColor,
  textColor,
  labelSize,
  labelGap,
  ariaLabel,
}: {
  markers: TimelineMarker[];
  segments: TimelineSegment[];
  trackColor: string;
  textColor: string;
  labelSize: number;
  labelGap: number;
  ariaLabel: string;
}) {
  const row = Math.round(labelSize * 1.4);
  const circleTop = row + 4;
  const lineTop = circleTop + R - 3;
  const labeled = visibleLabels(markers, labelGap);
  // Draw higher-priority markers last so they sit on top when they overlap.
  const ordered = [...markers].sort((a, b) => a.priority - b.priority);

  return (
    <div
      className="relative flex-shrink-0"
      style={{ height: circleTop + MARKER + 4 + row, color: textColor, fontSize: labelSize }}
      role="img"
      aria-label={ariaLabel}
    >
      <div className="absolute h-1.5 rounded-full" style={{ top: lineTop, left: R, right: R, backgroundColor: trackColor }} />
      {segments.map((s) => (
        <div
          key={s.key}
          className="absolute h-1.5 rounded-full"
          style={{ top: lineTop, left: x(Math.min(s.from, s.to)), width: w(Math.abs(s.to - s.from)), backgroundColor: s.color }}
        />
      ))}
      {ordered.map((m) => (
        <div key={m.key}>
          {labeled.has(m.key) && (
            <div className="absolute top-0 whitespace-nowrap leading-none" style={labelPos(m.at)}>
              {m.action}
            </div>
          )}
          <div
            className="absolute flex items-center justify-center rounded-full shadow-sm"
            style={{ top: circleTop, left: x(m.at), width: MARKER, height: MARKER, marginLeft: -R, backgroundColor: m.fill, color: m.ink }}
          >
            {ICONS[m.kind]({ size: ICON })}
          </div>
          {labeled.has(m.key) && (
            <div
              className="absolute whitespace-nowrap font-bold leading-none tabular-nums"
              style={{ top: circleTop + MARKER + 4, fontFamily: "var(--font-mono)", ...labelPos(m.at) }}
            >
              {m.time}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
