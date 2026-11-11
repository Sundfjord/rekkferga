"use client";

import { useEffect, useRef, useState } from "react";

const LINE_W = 4; // every marker is the same vertical line
const LINE_H = 28;
const HIT = 32; // invisible tap/hover target around each line

export interface TimelineMarker {
  key: string;
  /** Position along the track, 0 (left edge) – 1 (right edge). */
  at: number;
  color: string;
  /** Tooltip: the action (normal weight) and its time (bold). */
  action: string;
  time: string;
}

export interface TimelineSegment {
  key: string;
  from: number;
  to: number;
  color: string;
}

// Centre of a marker line, keeping the whole line inside the track at both ends.
const centre = (f: number) => `calc((100% - ${LINE_W}px) * ${f.toFixed(4)} + ${LINE_W / 2}px)`;

// Keep tooltips near the edges from spilling out of the track.
const tooltipPos = (f: number): React.CSSProperties =>
  f < 0.12 ? { left: HIT / 2 - LINE_W } : f > 0.88 ? { right: HIT / 2 - LINE_W } : { left: "50%", transform: "translateX(-50%)" };

/**
 * Full-width horizontal timeline: coloured track segments and equal vertical line markers.
 * Each marker's action + time shows in a tooltip on hover (pointer devices), keyboard focus,
 * or tap (touch; tap elsewhere to dismiss). Later markers draw on top of earlier ones.
 */
export default function TimelineTrack({
  markers,
  segments,
  trackColor,
  tooltipBg,
  tooltipText,
  ariaLabel,
}: {
  markers: TimelineMarker[];
  segments: TimelineSegment[];
  trackColor: string;
  tooltipBg: string;
  tooltipText: string;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);

  // A tapped tooltip stays until the next tap outside the timeline.
  useEffect(() => {
    if (!active) return;
    const dismiss = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setActive(null);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [active]);

  return (
    <div ref={ref} role="group" aria-label={ariaLabel} className="relative w-full flex-shrink-0" style={{ height: LINE_H }}>
      <div className="absolute inset-x-0 h-1.5 rounded-full" style={{ top: LINE_H / 2 - 3, backgroundColor: trackColor }} />
      {segments.map((s) => (
        <div
          key={s.key}
          className="absolute h-1.5 rounded-full"
          style={{
            top: LINE_H / 2 - 3,
            left: `${Math.min(s.from, s.to) * 100}%`,
            width: `${Math.abs(s.to - s.from) * 100}%`,
            backgroundColor: s.color,
          }}
        />
      ))}
      {markers.map((m) => {
        const isActive = active === m.key;
        return (
          <button
            key={m.key}
            type="button"
            aria-label={`${m.action} ${m.time}`}
            aria-expanded={isActive}
            onClick={() => setActive(isActive ? null : m.key)}
            className={`group absolute top-0 flex cursor-pointer justify-center rounded-sm outline-offset-2 hover:z-10 focus-visible:z-10 ${isActive ? "z-10" : ""}`}
            style={{ left: centre(m.at), width: HIT, height: LINE_H, marginLeft: -HIT / 2 }}
          >
            <span className="h-full rounded-full shadow-sm" style={{ width: LINE_W, backgroundColor: m.color }} />
            <span
              role="tooltip"
              className={`pointer-events-none absolute bottom-full mb-2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[13px] leading-none shadow-md transition-opacity duration-150 ${
                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
              }`}
              style={{ backgroundColor: tooltipBg, color: tooltipText, ...tooltipPos(m.at) }}
            >
              {m.action}{" "}
              <span className="font-bold tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
                {m.time}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
