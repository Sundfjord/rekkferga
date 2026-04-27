import { useEffect } from "react";
import type { JourneyResult, FerryLeg, DepartureOption } from "@shared/types";

interface SimulatorConfig {
  journey: JourneyResult | null;
  injectPosition: (lat: number, lng: number) => void;
  updateJourneyDepartures: (legIndex: number, departures: DepartureOption[]) => void;
  journeyRef: { current: JourneyResult | null };
  currentLegIndexRef: { current: number };
  userLocationRef: { current: [number, number] | null };
}

export function useTripSimulator(config: SimulatorConfig): void {
  const { journey, injectPosition, updateJourneyDepartures, journeyRef, currentLegIndexRef, userLocationRef } = config;

  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || !journey) return;

    const waypoints: Array<{ label: string; lat: number; lng: number }> = [];
    const userPos = userLocationRef.current;
    if (userPos) waypoints.push({ label: "📍 Your position", lat: userPos[0], lng: userPos[1] });

    for (const leg of journey.legs) {
      if (leg.fromPlace.latitude == null || leg.fromPlace.longitude == null) continue;
      const icon = leg.mode === "water" ? "⛴" : "🚗";
      waypoints.push({ label: `${icon} ${leg.fromPlace.name}`, lat: leg.fromPlace.latitude, lng: leg.fromPlace.longitude });
    }
    const lastLeg = journey.legs[journey.legs.length - 1];
    if (lastLeg?.toPlace.latitude != null && lastLeg?.toPlace.longitude != null) {
      waypoints.push({ label: `🏁 ${lastLeg.toPlace.name}`, lat: lastLeg.toPlace.latitude, lng: lastLeg.toPlace.longitude });
    }

    let playId: ReturnType<typeof setInterval> | null = null;

    const sim = {
      waypoints,
      pos: (lat: number, lng: number) => {
        console.log(`[sim] pos(${lat.toFixed(5)}, ${lng.toFixed(5)})`);
        injectPosition(lat, lng);
      },
      jump: (i: number) => {
        const wp = waypoints[i];
        if (!wp) { console.warn(`[sim] No waypoint ${i}. Range: 0–${waypoints.length - 1}`); return; }
        console.log(`[sim] jump(${i}) → ${wp.label}`);
        injectPosition(wp.lat, wp.lng);
      },
      play: (intervalMs = 2000) => {
        let i = 0;
        console.log(`[sim] Playing ${waypoints.length} waypoints every ${intervalMs}ms. Call __sim.stop() to halt.`);
        if (playId) clearInterval(playId);
        const tick = () => {
          if (i >= waypoints.length) { clearInterval(playId!); playId = null; console.log("[sim] Done."); return; }
          sim.jump(i++);
        };
        tick();
        playId = setInterval(tick, intervalMs);
      },
      stop: () => { if (playId) { clearInterval(playId); playId = null; } console.log("[sim] Stopped."); },
      skipWait: () => {
        const j = journeyRef.current;
        if (!j) { console.warn("[sim] No journey"); return; }
        for (let idx = currentLegIndexRef.current; idx < j.legs.length; idx++) {
          const leg = j.legs[idx];
          if (leg.mode !== "water") continue;
          const ferryLeg = leg as FerryLeg;
          const patched = (ferryLeg.departures ?? []).map((d) => ({
            ...d,
            expectedDepartureTime: new Date(Date.now() - 60_000).toISOString(),
          }));
          updateJourneyDepartures(idx, patched);
          const pos = userLocationRef.current;
          if (pos) injectPosition(pos[0], pos[1]);
          console.log(`[sim] Ferry leg ${idx} departure patched to 1 min ago → should transition to crossing.`);
          return;
        }
        console.warn("[sim] No upcoming ferry leg found.");
      },
    };

    (window as unknown as Record<string, unknown>).__sim = sim;
    console.log(
      "%c🚢 Rekkferga trip simulator ready",
      "font-weight:bold;color:#2569A3",
      "\n\n__sim.waypoints        list all waypoints",
      "\n__sim.jump(i)          teleport to waypoint i",
      "\n__sim.play(ms=2000)    step through waypoints automatically",
      "\n__sim.stop()           halt playback",
      "\n__sim.skipWait()       patch next ferry departure to past (unlocks crossing)",
      "\n__sim.pos(lat,lng)     teleport to any coordinate",
    );

    return () => {
      delete (window as unknown as Record<string, unknown>).__sim;
      if (playId) clearInterval(playId);
    };
  }, [journey, injectPosition, updateJourneyDepartures, journeyRef, currentLegIndexRef, userLocationRef]);
}
