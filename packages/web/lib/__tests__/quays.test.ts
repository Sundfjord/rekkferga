import { describe, it, expect } from "vitest";
import type { Quay } from "@shared/types";
import { destinationNames, shortQuayName } from "../quays";
import { transitionName } from "../viewTransition";

const quay = (id: string, name: string, relatedQuayIds: string[] = []): Quay => ({
  id,
  name,
  latitude: 0,
  longitude: 0,
  relatedQuayIds,
});

describe("shortQuayName", () => {
  it("drops the ferry-quay suffix in either spelling", () => {
    expect(shortQuayName("Hareid ferjekai")).toBe("Hareid");
    expect(shortQuayName("Sulesund Fergekai")).toBe("Sulesund");
    expect(shortQuayName("Festøya ferjeleie")).toBe("Festøya");
    expect(shortQuayName("Solavågen fergeleie")).toBe("Solavågen");
  });

  it("leaves other names alone", () => {
    expect(shortQuayName("Ferjekaivegen")).toBe("Ferjekaivegen");
    expect(shortQuayName("Ålesund")).toBe("Ålesund");
  });
});

describe("destinationNames", () => {
  it("lists the short names of known destination quays, skipping unknown ids", () => {
    const hareid = quay("A", "Hareid ferjekai", ["B", "missing"]);
    const byId = new Map([hareid, quay("B", "Sulesund ferjekai")].map((q) => [q.id, q]));
    expect(destinationNames(hareid, byId)).toEqual(["Sulesund"]);
  });
});

describe("transitionName", () => {
  it("makes a valid CSS identifier from a departure key", () => {
    expect(transitionName("margin", "2026-11-20T12:00:00.000Z|NSR:StopPlace:2")).toBe(
      "margin-2026-11-20T12_00_00_000Z_NSR_StopPlace_2",
    );
  });
});
