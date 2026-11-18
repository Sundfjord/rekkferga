import { describe, expect, it } from "vitest";
import { trafficLevel } from "../index";

const min = (m: number) => m * 60;

describe("trafficLevel", () => {
  it("is null without a usual drive time", () => {
    expect(trafficLevel(min(10), null)).toBeNull();
    expect(trafficLevel(min(10), undefined)).toBeNull();
    expect(trafficLevel(min(10), 0)).toBeNull();
  });

  it("is normal when faster than usual or only slightly slower", () => {
    expect(trafficLevel(min(25), min(30))).toBe("normal");
    expect(trafficLevel(min(30) + 59, min(30))).toBe("normal");
  });

  it("uses the minute floors on short trips", () => {
    expect(trafficLevel(min(9), min(8))).toBe("normal"); // +1 min
    expect(trafficLevel(min(10), min(8))).toBe("moderate"); // +2 min
    expect(trafficLevel(min(13), min(8))).toBe("heavy"); // +5 min
  });

  it("scales with the trip on long drives", () => {
    expect(trafficLevel(min(185), min(180))).toBe("normal"); // +5 min on 3 h
    expect(trafficLevel(min(198), min(180))).toBe("moderate"); // +18 min = 10 %
    expect(trafficLevel(min(225), min(180))).toBe("heavy"); // +45 min = 25 %
  });
});
