import { describe, it, expect } from "vitest";
import { estimateArrival, isFresh, secondsUntil, type DriveTime } from "../useDriveTimes";

const FROM: [number, number] = [62.47, 6.15];
// ~0.11 km and ~0.33 km north of FROM (1° latitude ≈ 111 km).
const NEAR: [number, number] = [62.471, 6.15];
const MOVED: [number, number] = [62.473, 6.15];

const T0 = Date.parse("2026-11-20T12:00:00Z");
const drive = (overrides: Partial<DriveTime> = {}): DriveTime => ({
  seconds: 600,
  typicalSeconds: 540,
  from: FROM,
  at: T0,
  ...overrides,
});

describe("isFresh", () => {
  it("is false without a drive time or once it is 3 minutes old", () => {
    expect(isFresh(undefined, FROM, T0)).toBe(false);
    expect(isFresh(drive(), FROM, T0 + 3 * 60_000)).toBe(false);
    expect(isFresh(drive(), null, T0 + 3 * 60_000)).toBe(false);
  });

  it("ignores moves during the first minute", () => {
    expect(isFresh(drive(), MOVED, T0 + 59_000)).toBe(true);
  });

  it("goes stale after a minute once the user has moved more than 300 m", () => {
    expect(isFresh(drive(), NEAR, T0 + 2 * 60_000)).toBe(true);
    expect(isFresh(drive(), MOVED, T0 + 2 * 60_000)).toBe(false);
    expect(isFresh(drive(), null, T0 + 2 * 60_000)).toBe(true);
  });
});

describe("estimateArrival", () => {
  it("is null without a drive time", () => {
    expect(estimateArrival(T0, undefined, FROM)).toBeNull();
  });

  it("slides with the clock while the user stays put", () => {
    const now = T0 + 60_000;
    expect(estimateArrival(now, drive(), NEAR)?.getTime()).toBe(now + 600_000);
    expect(estimateArrival(now, drive(), null)?.getTime()).toBe(now + 600_000);
  });

  it("stays fixed at fetch time + drive time once the user is on the way", () => {
    expect(estimateArrival(T0 + 60_000, drive(), MOVED)?.getTime()).toBe(T0 + 600_000);
  });
});

describe("secondsUntil", () => {
  it("counts down to the arrival and never goes negative", () => {
    const arrival = new Date(T0 + 90_000);
    expect(secondsUntil(arrival, T0)).toBe(90);
    expect(secondsUntil(arrival, T0 + 120_000)).toBe(0);
  });
});
