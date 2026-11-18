import type { DepartureOption } from "@shared/types";
import { formatDuration, marginTier, type Language } from "@shared/utils";
import { shortQuayName } from "@/lib/quays";

export type Tier = "safe" | "tight" | "missed" | "none";

export const tierOf = (d: DepartureOption): Tier =>
  d.marginMinutes === null ? "none" : marginTier(d.marginMinutes);

/** One strong colour per tier (white text on top), shared by every departure view. */
export const TIER_COLOR: Record<Tier, string> = {
  safe: "var(--margin-safe)",
  tight: "var(--margin-tight)",
  missed: "var(--margin-missed)",
  none: "var(--margin-none)",
};

/**
 * Where a departure ends and what it calls at on the way, without the redundant "ferjekai":
 * Gjermundshamn → Varaldsøy → Årsnes gives { name: "Årsnes", via: ["Varaldsøy"] }.
 */
export function destinationParts(d: DepartureOption): { name: string; via: string[] } {
  return {
    name: d.destinationName ? shortQuayName(d.destinationName) : "",
    via: (d.viaNames ?? []).map(shortQuayName),
  };
}

/** "Årsnes via Varaldsøy" — `viaWord` is the localised "via". */
export function destinationText(d: DepartureOption, viaWord: string): string {
  const { name, via } = destinationParts(d);
  return via.length ? `${name} ${viaWord} ${via.join(", ")}` : name;
}

/** Whether a departure serves a crossing: it ends there or calls there on the way. */
export const servesQuay = (d: DepartureOption, quayId: string) =>
  d.destinationQuayId === quayId || (d.viaQuayIds ?? []).includes(quayId);

/**
 * Margins recomputed in the browser from one arrival time, so every view shows the same
 * number and it moves with the clock instead of jumping at each poll. Whole minutes,
 * rounded down (a 30-second miss shows −1, never 0). Without an arrival the server's
 * values (null without a position) are kept.
 */
export function withLiveMargins(departures: DepartureOption[], arrivalAt: Date | null): DepartureOption[] {
  if (!arrivalAt) return departures;
  return departures.map((d) => ({
    ...d,
    marginMinutes: Math.floor((Date.parse(d.expectedDepartureTime) - arrivalAt.getTime()) / 60_000),
  }));
}

/** The next departure you can make (margin ≥ 0), else the first — mirrors the API's pick. */
export const nextReachable = (departures: DepartureOption[]) =>
  departures.find((d) => d.marginMinutes !== null && d.marginMinutes >= 0) ?? departures[0] ?? null;

/** Stable identity across polls (the list is re-fetched, so array indexes shift). */
export const departureKey = (d: DepartureOption) =>
  `${d.expectedDepartureTime}|${d.destinationQuayId ?? ""}`;

/** "+7" + "min", or "+1t 5min" + "" past an hour. Minus is U+2212 so it lines up with "+". */
export function splitMargin(minutes: number, language: Language): { value: string; unit: string } {
  const abs = Math.abs(minutes);
  const sign = minutes > 0 ? "+" : minutes < 0 ? "−" : "";
  if (abs < 60) return { value: `${sign}${abs}`, unit: "min" };
  return { value: sign + formatDuration(abs * 60, language), unit: "" };
}

/**
 * When the picked departure is tight or missed: the next later departure the user can
 * still make (tight counts). Null when the pick is comfortable or nothing later fits.
 */
export function planB(departures: DepartureOption[], selected: DepartureOption): DepartureOption | null {
  if (selected.marginMinutes === null || selected.marginMinutes > 10) return null;
  const after = Date.parse(selected.expectedDepartureTime);
  return (
    departures.find(
      (d) => Date.parse(d.expectedDepartureTime) > after && d.marginMinutes !== null && d.marginMinutes >= 0,
    ) ?? null
  );
}

export const minutesUntil = (iso: string | Date, now: number) =>
  ((typeof iso === "string" ? Date.parse(iso) : iso.getTime()) - now) / 60_000;
