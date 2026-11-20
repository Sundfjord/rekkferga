import type { Quay } from "../types";
import { calculateDistance } from "./geo";

/** How much a crossing's road class counts: the trunk routes people plan around come first. */
const ROAD_WEIGHT: Record<string, number> = { E: 1, R: 0.8, F: 0.6, K: 0.5 };
const OTHER_ROAD_WEIGHT = 0.5;
/** Departures per day at which a crossing counts as fully frequent (E39 runs ~55–65). */
const FULL_FREQUENCY = 60;
/** Distance (km) at which proximity has halved the score. */
const HALF_DISTANCE_KM = 60;
/** Never suggest quays further away than this (km, straight line). */
const MAX_DISTANCE_KM = 130;
/** Below this score a quay isn't worth a chip, so remote areas may get fewer or none. */
const MIN_SCORE = 0.08;

/**
 * 0–1: how much traffic a crossing carries. Frequency is squared so that the big trunk
 * crossings (~60 departures/day) clearly outrank small local ferries (~10–30), and the road
 * class tips the balance towards European and national roads.
 */
export function quayPopularity(quay: Pick<Quay, "dailyDepartures" | "roadCategory">): number {
  const frequency = Math.min(1, (quay.dailyDepartures ?? 0) / FULL_FREQUENCY);
  const road = (quay.roadCategory ? ROAD_WEIGHT[quay.roadCategory] : undefined) ?? OTHER_ROAD_WEIGHT;
  return frequency ** 2 * road;
}

/**
 * Quays worth suggesting from a position, best first: popular crossings that are reasonably
 * near. A quay is left out when a quay at the other end of one of its crossings is nearer —
 * you'd depart from that one (in Bergen, Oppedal is suggested and Lavik is not).
 *
 * Pass the full quay list and put quays not to suggest (e.g. favourites) in `exclude`: they
 * still count as the near end of their crossings, so excluding Oppedal never promotes Lavik.
 */
export function suggestQuays(quays: Quay[], from: [number, number], count = 3, exclude?: ReadonlySet<string>): Quay[] {
  const byId = new Map(quays.map((q) => [q.id, q]));
  const distanceTo = (q: Quay) => calculateDistance(from[0], from[1], q.latitude, q.longitude);

  return quays
    .map((quay) => ({ quay, km: distanceTo(quay) }))
    .filter(({ quay, km }) => km <= MAX_DISTANCE_KM && !exclude?.has(quay.id))
    .filter(({ quay, km }) =>
      quay.relatedQuayIds.every((id) => {
        const other = byId.get(id);
        return !other || distanceTo(other) >= km;
      }),
    )
    .map(({ quay, km }) => ({ quay, score: quayPopularity(quay) / (1 + (km / HALF_DISTANCE_KM) ** 2) }))
    .filter(({ score }) => score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(({ quay }) => quay);
}
