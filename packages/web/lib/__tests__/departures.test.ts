import { describe, it, expect } from "vitest";
import type { DepartureOption } from "@shared/types";
import { formatDuration } from "@shared/utils";
import {
  departureKey,
  destinationParts,
  destinationText,
  nextReachable,
  planB,
  servesQuay,
  splitMargin,
  tierOf,
  withLiveMargins,
} from "../departures";

const ARRIVAL = new Date("2026-11-20T12:00:00Z");

/** A departure `offsetMin` minutes after ARRIVAL (seconds allowed via fractions). */
function dep(offsetMin: number, extra: Partial<DepartureOption> = {}): DepartureOption {
  return {
    expectedDepartureTime: new Date(ARRIVAL.getTime() + offsetMin * 60_000).toISOString(),
    realtime: false,
    marginMinutes: null,
    destinationQuayId: "NSR:StopPlace:2",
    destinationName: "Årsnes ferjekai",
    ...extra,
  };
}

describe("tierOf", () => {
  it("follows marginTier, with none when there is no margin", () => {
    expect(tierOf(dep(0, { marginMinutes: null }))).toBe("none");
    expect(tierOf(dep(0, { marginMinutes: 6 }))).toBe("safe");
    expect(tierOf(dep(0, { marginMinutes: 5 }))).toBe("tight");
    expect(tierOf(dep(0, { marginMinutes: 0 }))).toBe("tight");
    expect(tierOf(dep(0, { marginMinutes: -1 }))).toBe("missed");
  });
});

describe("withLiveMargins", () => {
  it("keeps the server's values without an arrival", () => {
    const list = [dep(10, { marginMinutes: 3 })];
    expect(withLiveMargins(list, null)).toBe(list);
  });

  it("recomputes margins from the arrival, rounding down", () => {
    const [a, b] = withLiveMargins([dep(7.9), dep(-0.5)], ARRIVAL);
    expect(a.marginMinutes).toBe(7);
    // A 30-second miss is −1, never 0.
    expect(b.marginMinutes).toBe(-1);
  });

  it("drops departures past the visibility cut-off (−5)", () => {
    const live = withLiveMargins([dep(-5), dep(-5.5), dep(3)], ARRIVAL);
    expect(live.map((d) => d.marginMinutes)).toEqual([-5, 3]);
  });
});

describe("nextReachable", () => {
  it("picks the first departure with a margin of zero or more", () => {
    const list = [dep(0, { marginMinutes: -2 }), dep(0, { marginMinutes: 0 }), dep(0, { marginMinutes: 9 })];
    expect(nextReachable(list)).toBe(list[1]);
  });

  it("falls back to the first departure, or null for none", () => {
    const list = [dep(0, { marginMinutes: null }), dep(0, { marginMinutes: -3 })];
    expect(nextReachable(list)).toBe(list[0]);
    expect(nextReachable([])).toBeNull();
  });
});

describe("planB", () => {
  const tight = dep(4, { marginMinutes: 4 });
  const missed = dep(-2, { marginMinutes: -2 });
  const later = dep(30, { marginMinutes: 30 });

  it("is only offered for a tight or missed pick", () => {
    expect(planB([later], dep(10, { marginMinutes: 10 }))).toBeNull();
    expect(planB([later], dep(10, { marginMinutes: null }))).toBeNull();
    expect(planB([tight, later], tight)).toBe(later);
    expect(planB([missed, later], missed)).toBe(later);
  });

  it("takes the next later departure that can still be made (tight counts)", () => {
    const earlier = dep(-4, { marginMinutes: 1 }); // reachable, but not later than the pick
    const alsoMissed = dep(1, { marginMinutes: -1 });
    const alsoTight = dep(2, { marginMinutes: 2 });
    expect(planB([earlier, missed, alsoMissed, alsoTight, later], missed)).toBe(alsoTight);
  });

  it("is null when nothing later fits", () => {
    expect(planB([missed, dep(1, { marginMinutes: -1 })], missed)).toBeNull();
  });
});

describe("splitMargin", () => {
  it("splits minutes into a signed value and a unit, with a typographic minus", () => {
    expect(splitMargin(7, "no")).toEqual({ value: "+7", unit: "min" });
    expect(splitMargin(0, "no")).toEqual({ value: "0", unit: "min" });
    expect(splitMargin(-3, "en")).toEqual({ value: "−3", unit: "min" });
  });

  it("switches to a duration past an hour", () => {
    expect(splitMargin(65, "no")).toEqual({ value: `+${formatDuration(65 * 60, "no")}`, unit: "" });
    expect(splitMargin(-60, "en")).toEqual({ value: "−1hr", unit: "" });
  });
});

describe("destinations", () => {
  const d = dep(0, { viaNames: ["Varaldsøy ferjekai"], viaQuayIds: ["NSR:StopPlace:3"] });

  it("drops the quay suffix and lists the stops on the way", () => {
    expect(destinationParts(d)).toEqual({ name: "Årsnes", via: ["Varaldsøy"] });
    expect(destinationText(d, "via")).toBe("Årsnes via Varaldsøy");
    expect(destinationText(dep(0), "via")).toBe("Årsnes");
  });

  it("serves a crossing it ends at or calls at", () => {
    expect(servesQuay(d, "NSR:StopPlace:2")).toBe(true);
    expect(servesQuay(d, "NSR:StopPlace:3")).toBe(true);
    expect(servesQuay(d, "NSR:StopPlace:4")).toBe(false);
  });
});

describe("departureKey", () => {
  it("identifies a departure by time and destination, not by its margin", () => {
    expect(departureKey(dep(5, { marginMinutes: 1 }))).toBe(departureKey(dep(5, { marginMinutes: 9 })));
    expect(departureKey(dep(5))).not.toBe(departureKey(dep(5, { destinationQuayId: "NSR:StopPlace:9" })));
  });
});
