import { describe, it, expect } from "vitest";
import { formatDuration } from "..";

describe("formatDuration", () => {
  it("formats minutes only", () => {
    expect(formatDuration(45 * 60, "en")).toBe("45min");
    expect(formatDuration(45 * 60, "no")).toBe("45min");
  });
  it("formats hours and minutes per language", () => {
    expect(formatDuration(90 * 60, "en")).toBe("1hr 30min");
    expect(formatDuration(90 * 60, "no")).toBe("1t 30min");
    expect(formatDuration(90 * 60, "nn")).toBe("1t 30min");
  });
  it("omits zero minutes", () => {
    expect(formatDuration(120 * 60, "en")).toBe("2hr");
    expect(formatDuration(120 * 60, "no")).toBe("2t");
  });
});
