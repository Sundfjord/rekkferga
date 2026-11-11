import type { Quay } from "@shared/types";
import { calculateDistance } from "@shared/utils";

const QUAY_SUFFIX = /\s+(ferjekai|fergekai|ferjeleie|fergeleie)$/i;

/** "Hareid ferjekai" → "Hareid", for compact destination lists. */
export const shortQuayName = (name: string) => name.replace(QUAY_SUFFIX, "");

/** The places a quay sails to, from the snapshot (no network). */
export function destinationNames(quay: Quay, quaysById: Map<string, Quay>): string[] {
  return quay.relatedQuayIds.map((id) => quaysById.get(id)?.name).filter((n): n is string => !!n).map(shortQuayName);
}

/** Quays closest to a position by straight-line distance — used only for ordering, never shown. */
export function nearestQuays(quays: Quay[], from: [number, number], count: number): Quay[] {
  return quays
    .map((q) => ({ q, d: calculateDistance(from[0], from[1], q.latitude, q.longitude) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, count)
    .map((x) => x.q);
}
