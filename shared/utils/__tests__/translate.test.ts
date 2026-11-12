import { describe, it, expect } from "vitest";
import { translate, translateList, type Translations } from "..";

const translations: Translations = {
  en: {
    general: { back: "Back", updatedAt: "Updated {time}" },
    quay: { driveTime: "Drive time" },
    drive: { rush: { "4to6": ["Tight", "Keep going"] } },
  },
  no: {
    general: { back: "Tilbake" },
    drive: { rush: { "4to6": ["Knapt", "Fortsett", "Hold farten"] } },
  },
  nn: {
    general: { back: "Attende" },
  },
};

describe("translate", () => {
  it("resolves dotted paths", () => {
    expect(translate(translations, "no", "general.back")).toBe("Tilbake");
  });

  it("falls back nn → no → en per key", () => {
    expect(translate(translations, "nn", "general.back")).toBe("Attende");
    expect(translate(translations, "nn", "quay.driveTime")).toBe("Drive time");
    expect(translate(translations, "no", "quay.driveTime")).toBe("Drive time");
  });

  it("fills in variables", () => {
    expect(translate(translations, "en", "general.updatedAt", { time: "14:02" })).toBe("Updated 14:02");
  });

  it("returns the key for missing paths, groups and lists", () => {
    expect(translate(translations, "en", "general.nope")).toBe("general.nope");
    expect(translate(translations, "en", "general")).toBe("general");
    expect(translate(translations, "en", "drive.rush.4to6")).toBe("drive.rush.4to6");
  });
});

describe("translateList", () => {
  it("returns the list for the current language", () => {
    expect(translateList(translations, "no", "drive.rush.4to6")).toEqual(["Knapt", "Fortsett", "Hold farten"]);
  });

  it("takes the whole list from the first language that has one (no merging)", () => {
    expect(translateList(translations, "nn", "drive.rush.4to6")).toEqual(["Knapt", "Fortsett", "Hold farten"]);
  });

  it("returns an empty list for missing paths and plain strings", () => {
    expect(translateList(translations, "en", "drive.rush.nope")).toEqual([]);
    expect(translateList(translations, "en", "general.back")).toEqual([]);
  });
});
