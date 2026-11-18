import { flushSync } from "react-dom";

type DocumentWithTransitions = Document & { startViewTransition?: (update: () => void) => unknown };

/**
 * Run a state update inside a View Transition, so elements sharing a `view-transition-name`
 * morph (move + scale) between the two states. Applies the update instantly where the API
 * is missing or the user prefers reduced motion.
 */
export function withViewTransition(update: () => void) {
  const doc = typeof document === "undefined" ? undefined : (document as DocumentWithTransitions);
  if (!doc?.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    update();
    return;
  }
  doc.startViewTransition(() => flushSync(update));
}

/**
 * A `view-transition-name` for one part of one departure ("card", "heading", "margin"). Names
 * must be unique on the page and valid CSS identifiers, so the departure key is sanitised.
 */
export const transitionName = (part: string, departureKey: string) =>
  `${part}-${departureKey.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
