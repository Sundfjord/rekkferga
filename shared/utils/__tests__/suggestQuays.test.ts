import { describe, expect, it } from "vitest";
import type { Quay } from "../../types";
import { quayPopularity, suggestQuays } from "../index";

// Real quays (coordinates, crossings, road class and departures/day from the snapshot).
const quay = (id: string, name: string, latitude: number, longitude: number, related: string[], road: string, daily: number): Quay => ({
  id,
  name,
  latitude,
  longitude,
  relatedQuayIds: related,
  roadCategory: road,
  dailyDepartures: daily,
});
const QUAYS: Quay[] = [
  quay("halhjem", "Halhjem", 60.147186, 5.428046, ["sandvikvag"], "E", 63.4),
  quay("sandvikvag", "Sandvikvåg", 59.968186, 5.3341, ["halhjem"], "E", 63.6),
  quay("lavik", "Lavik", 61.104838, 5.507289, ["oppedal"], "E", 60.6),
  quay("oppedal", "Oppedal", 61.054542, 5.50675, ["lavik"], "E", 60.7),
  quay("breistein", "Breistein", 60.490334, 5.39976, ["valestrand"], "F", 28.4),
  quay("valestrand", "Valestrand", 60.505078, 5.427208, ["breistein"], "F", 31.4),
  quay("hatvik", "Hatvik", 60.20846, 5.537043, ["venjaneset"], "F", 27.0),
  quay("venjaneset", "Venjaneset", 60.205469, 5.593367, ["hatvik"], "F", 27.0),
];
const BERGEN: [number, number] = [60.3913, 5.3221];
const STORD: [number, number] = [59.78, 5.5];
const OSLO: [number, number] = [59.91, 10.75];
const names = (from: [number, number]) => suggestQuays(QUAYS, from).map((q) => q.name);

describe("suggestQuays", () => {
  it("puts the popular trunk crossings first, then a nearby local one", () => {
    expect(names(BERGEN)).toEqual(["Halhjem", "Oppedal", "Breistein"]);
  });

  it("only suggests the end of a crossing you would depart from", () => {
    const suggested = names(BERGEN);
    expect(suggested).toContain("Oppedal");
    expect(suggested).not.toContain("Lavik");
    expect(suggested).not.toContain("Sandvikvåg");
    expect(names(STORD)[0]).toBe("Sandvikvåg");
    expect(names(STORD)).not.toContain("Halhjem");
  });

  it("suggests nothing when every quay is far away", () => {
    expect(names(OSLO)).toEqual([]);
  });

  it("respects the count", () => {
    expect(suggestQuays(QUAYS, BERGEN, 1).map((q) => q.name)).toEqual(["Halhjem"]);
  });
});

describe("quayPopularity", () => {
  it("ranks a frequent E-road crossing far above a small county ferry", () => {
    expect(quayPopularity({ dailyDepartures: 63, roadCategory: "E" })).toBe(1);
    expect(quayPopularity({ dailyDepartures: 28, roadCategory: "F" })).toBeLessThan(0.15);
  });

  it("treats missing data as unpopular rather than failing", () => {
    expect(quayPopularity({})).toBe(0);
  });
});
