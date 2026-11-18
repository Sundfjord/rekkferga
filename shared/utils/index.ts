// Shared utilities for Rekkferga platform

export type Language = "en" | "no" | "nn";

/** A locale file: nested groups of strings and string lists, addressed by dotted paths. */
export type TranslationTree = { [key: string]: string | string[] | TranslationTree };
export type Translations = Record<Language, TranslationTree>;

// Nynorsk falls back to Bokmål, everything falls back to English.
const fallbackChain = (language: Language): Language[] =>
  language === "nn" ? ["nn", "no", "en"] : language === "en" ? ["en"] : [language, "en"];

function resolve(tree: TranslationTree | undefined, path: string): unknown {
  let node: unknown = tree;
  for (const part of path.split(".")) {
    if (node === null || typeof node !== "object" || Array.isArray(node)) return undefined;
    node = (node as TranslationTree)[part];
  }
  return node;
}

/**
 * A string by dotted path ("quay.driveTime"), with `{name}` variables filled in. Falls back
 * through the language chain; returns the key itself when no language has a string there
 * (a path to a group or a list counts as missing).
 */
export function translate(
  translations: Translations,
  language: Language,
  key: string,
  variables?: Record<string, string | number>
): string {
  let str: string | undefined;
  for (const lang of fallbackChain(language)) {
    const value = resolve(translations[lang], key);
    if (typeof value === "string" && value) { str = value; break; }
  }
  if (str === undefined) return key;
  if (variables) {
    for (const [k, v] of Object.entries(variables)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return str;
}

/**
 * A list of strings by dotted path ("drive.rush.4to6"). The whole list comes from the first
 * language in the fallback chain that has a non-empty one — lists are never merged.
 */
export function translateList(translations: Translations, language: Language, key: string): string[] {
  for (const lang of fallbackChain(language)) {
    const value = resolve(translations[lang], key);
    if (Array.isArray(value) && value.length) return value.filter((v): v is string => typeof v === "string");
  }
  return [];
}

const DURATION_UNITS: Record<Language, { hour: string; minute: string }> = {
  en: { hour: "hr", minute: "min" },
  no: { hour: "t", minute: "min" },
  nn: { hour: "t", minute: "min" },
};

/** e.g. "45min", "2hr", "1hr 30min" (en) / "1t 30min" (no, nn). */
export const formatDuration = (seconds: number, language: Language = "no"): string => {
  const { hour, minute } = DURATION_UNITS[language] ?? DURATION_UNITS.no;
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m}${minute}`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}${hour} ${rem}${minute}` : `${h}${hour}`;
};

export const formatTime = (iso: string): string => {
  return new Date(iso).toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
};

/** Great-circle distance in km (haversine). */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ---------------------------------------------------------------------------
// Margins
// ---------------------------------------------------------------------------

export function marginTier(minutes: number): "safe" | "tight" | "missed" {
  if (minutes > 10) return "safe";
  if (minutes >= 0) return "tight";
  return "missed";
}

// ---------------------------------------------------------------------------
// Traffic
// ---------------------------------------------------------------------------

export type TrafficLevel = "normal" | "moderate" | "heavy";

/**
 * How today's drive compares with the usual traffic for this time. The thresholds scale
 * with the trip: a delay counts as moderate from 10% of the usual drive time and as heavy
 * from 25%, but never below 2 and 5 minutes, so short trips don't flip on a few seconds.
 * (8 min trip: moderate +2, heavy +5 · 1 h: +6, +15 · 3 h: +18, +45.) Null without a usual
 * drive time to compare with.
 */
export function trafficLevel(seconds: number, typicalSeconds: number | null | undefined): TrafficLevel | null {
  if (typicalSeconds == null || typicalSeconds <= 0) return null;
  const delay = seconds - typicalSeconds;
  if (delay >= Math.max(5 * 60, typicalSeconds * 0.25)) return "heavy";
  if (delay >= Math.max(2 * 60, typicalSeconds * 0.1)) return "moderate";
  return "normal";
}

// ---------------------------------------------------------------------------
// Favorites
// ---------------------------------------------------------------------------

export * from './favorites';
