import { describe, it, expect, vi, afterEach } from "vitest";
import { ApiError, getJson } from "../api";

const mockFetch = (impl: () => Promise<unknown>) => vi.stubGlobal("fetch", vi.fn(impl));

afterEach(() => vi.unstubAllGlobals());

describe("getJson", () => {
  it("returns the parsed body on success — including an empty list", async () => {
    mockFetch(async () => new Response("[]", { status: 200 }));
    await expect(getJson("https://x")).resolves.toEqual([]);
  });

  it("throws ApiError with the status on a non-2xx response", async () => {
    mockFetch(async () => new Response("nope", { status: 502 }));
    await expect(getJson("https://x")).rejects.toMatchObject({ name: "ApiError", status: 502 });
  });

  it("throws ApiError on a network failure", async () => {
    mockFetch(async () => {
      throw new TypeError("Failed to fetch");
    });
    await expect(getJson("https://x")).rejects.toBeInstanceOf(ApiError);
  });

  it("throws ApiError on a malformed body", async () => {
    mockFetch(async () => new Response("<html>", { status: 200 }));
    await expect(getJson("https://x")).rejects.toBeInstanceOf(ApiError);
  });

  it("re-throws aborts unchanged so cancelled searches stay silent", async () => {
    mockFetch(async () => {
      throw new DOMException("aborted", "AbortError");
    });
    await expect(getJson("https://x")).rejects.toMatchObject({ name: "AbortError" });
  });
});
