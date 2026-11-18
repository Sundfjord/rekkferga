import type { Quay } from "@shared/types";

const QUAY_SUFFIX = /\s+(ferjekai|fergekai|ferjeleie|fergeleie)$/i;

/** "Hareid ferjekai" → "Hareid", for compact destination lists. */
export const shortQuayName = (name: string) => name.replace(QUAY_SUFFIX, "");

/** The places a quay sails to, from the snapshot (no network). */
export function destinationNames(quay: Quay, quaysById: Map<string, Quay>): string[] {
  return quay.relatedQuayIds.map((id) => quaysById.get(id)?.name).filter((n): n is string => !!n).map(shortQuayName);
}
