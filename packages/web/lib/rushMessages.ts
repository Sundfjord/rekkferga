/**
 * The sentence under the big margin in drive mode, chosen by how much of a rush you're in.
 *
 * Stages get coarser as the margin grows: 3-minute steps from the overview's cut-off (−5,
 * see _VISIBILITY_THRESHOLD_MINUTES in the API) to 15, 10-minute steps until 60.
 * Each stage's messages are a list in shared/locales at `drive.rush.<stage>` — add or remove
 * lines there freely; the picker uses however many exist.
 */
const STAGES: { id: string; upTo: number }[] = [
  { id: "-5to-3", upTo: -3 }, // also anything below −5 that a live margin reaches before the next poll
  { id: "-2to0", upTo: 0 },
  { id: "1to3", upTo: 3 },
  { id: "4to6", upTo: 6 },
  { id: "7to9", upTo: 9 },
  { id: "10to12", upTo: 12 },
  { id: "13to15", upTo: 15 },
  { id: "16to25", upTo: 25 },
  { id: "26to35", upTo: 35 },
  { id: "36to45", upTo: 45 },
  { id: "46to60", upTo: 60 },
  { id: "61plus", upTo: Infinity },
];

export const rushStage = (marginMinutes: number) => STAGES.find((s) => marginMinutes <= s.upTo)!.id;

// Small stable string hash, so a given departure keeps its message while the margin stays in
// the same stage (no flicker on each clock tick), but different departures/days vary.
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * The message for a margin. `seed` should identify the departure (e.g. its departureKey);
 * `list` is the translator's list lookup (useTranslation's `t.list`).
 */
export function rushMessage(list: (key: string) => string[], marginMinutes: number, seed: string): string {
  const stage = rushStage(marginMinutes);
  const messages = list(`drive.rush.${stage}`);
  if (messages.length === 0) return "";
  return messages[hash(`${seed}|${stage}`) % messages.length];
}
