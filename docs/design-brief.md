# Rekkferga — Design Brief (Phase 6a → 6a-r2)

_Produced: 2026-04-17. Revised: 2026-04-20. Prerequisite for Phase 6b implementation._

---

## Aesthetic Direction: Nordic Coastal Utility

**One sentence:** Purposeful restraint with maritime depth — the kind of UI that feels like a departure board at a Norwegian quay: precise, unhurried, and immediately clear.

**What makes it memorable:** The margin badge is the product. It's a number — a countdown to missing your ferry — and it needs to feel as authoritative as a clock. Everything else in the UI is subordinate to surfacing that number clearly. The aesthetic expresses this by giving the badge substantial real estate, a mono font, and semantic colour that is legible at a glance. The search input is the product's other face: a single, generous, well-lit field against deep water.

**What to avoid:** Decorative wave illustrations, stock ferry clipart, gradient blobs, standard blue-on-white Material Design defaults. The existing Arial font must be replaced.

---

## Typography

**Chosen pairing: Syne + DM Sans + JetBrains Mono**

Rationale: Syne is a geometric sans designed at a French art centre — slightly atypical, characterful letterforms with a clean structural backbone. At bold weights it gives the brand wordmark and section labels personality without ornament. DM Sans is a reliable low-contrast geometric for UI body text — optically smaller than Inter at the same size, reads well at 13–16px. JetBrains Mono is used exclusively for the margin number and departure times — the mono spacing and tabular figures communicate precision and reinforce the "clock" metaphor.

Both Syne and DM Sans are available via Google Fonts. JetBrains Mono is available via Google Fonts.

### Font Scale

| Token | Size | Weight | Font | Usage |
|-------|------|--------|------|-------|
| `text-display` | 1.5rem / 24px | 700 | Syne | App tagline on landing (above search) |
| `text-heading` | 1.125rem / 18px | 700 | Syne | Card headings, destination name |
| `text-search` | 1.125rem / 18px | 400 | DM Sans | Search input value (larger than before) |
| `text-body` | 1rem / 16px | 400 | DM Sans | General body, leg labels |
| `text-secondary` | 0.875rem / 14px | 400 | DM Sans | Sub-labels, place names |
| `text-label` | 0.75rem / 12px | 600 | Syne | Uppercase section labels, "WHERE TO" |
| `text-mono-lg` | 1.25rem / 20px | 700 | JetBrains Mono | Margin minutes number (badge) |
| `text-mono-sm` | 0.875rem / 14px | 500 | JetBrains Mono | Departure times ("14:35") |
| `text-caption` | 0.75rem / 12px | 400 | DM Sans | Footnotes, "Arrives at" label |

---

## Colour Tokens

### Core Palette

```css
/* Water / Brand background — refined from current #42a5f5 */
--water: #2569A3;           /* Deep fjord blue. Light mode page background. */
--water-light: #3A85C2;     /* Lighter fjord. Rail line colour in timeline. */
--water-dark: #011638;      /* Night water. Dark mode page background. (keep existing) */

/* Accent — amber, Norwegian coastal golden hour */
--accent: #E8A020;
--accent-light: #F5C06A;
--accent-dark: #C07A10;

/* Surface */
--surface: #FFFFFF;
--surface-tint: #F2F8FF;    /* Barely-blue white. Search dropdown bg. */
--surface-variant: #E8F2FB; /* Light blue-gray. Subtle areas. */

/* Surface dark */
--surface-dark: #111B27;
--surface-dark-variant: #1A2740;

/* Text — slightly blue-tinted blacks/grays for maritime cohesion */
--text-primary: #0D1B2A;
--text-secondary: #5B7A9B;
--text-disabled: #9AB3C9;
--text-on-water: #FFFFFF;       /* Text on the water bg */
--text-on-water-muted: rgba(255,255,255,0.70);

/* Dark mode text */
--text-primary-dark: #E8F0F8;
--text-secondary-dark: #7A99B8;
```

### Semantic Margin Colours — **These are new tokens, do not hardcode**

Three tiers. Thresholds: safe = >10 min, tight = 0–10 min, missed = <0 min.

```css
/* Safe — +10 min or more */
--color-margin-safe:         #16A34A;   /* accent (ring, icon) */
--color-margin-safe-surface: #DCFCE7;   /* badge background */
--color-margin-safe-text:    #14532D;   /* badge text */

/* Tight — 0 to 10 min */
--color-margin-tight:         #D97706;
--color-margin-tight-surface: #FEF3C7;
--color-margin-tight-text:    #78350F;

/* Missed — negative */
--color-margin-missed:         #DC2626;
--color-margin-missed-surface: #FEE2E2;
--color-margin-missed-text:    #7F1D1D;

/* Dark mode variants */
--color-margin-safe-surface-dark: #14532D;
--color-margin-safe-text-dark:    #86EFAC;
--color-margin-tight-surface-dark: #78350F;
--color-margin-tight-text-dark:    #FCD34D;
--color-margin-missed-surface-dark: #7F1D1D;
--color-margin-missed-text-dark:    #FCA5A5;
```

### Applying margin thresholds

Replace the current hardcoded Tailwind class logic:

```
minutes > 10  → safe tier
minutes >= 0  → tight tier (was "> 2" and ">= -2" — tighten to 0–10)
minutes < 0   → missed tier
```

---

## Spacing, Radius, Shadow Tokens

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-search` | 1rem (16px) | Search input |
| `--radius-card` | 1.25rem (20px) | Journey card, map card |
| `--radius-btn` | 0.75rem (12px) | Primary/secondary buttons |
| `--radius-badge` | 0.5rem (8px) | Margin badge |
| `--radius-node` | 50% | Timeline step nodes (circles) |

### Shadow

```css
--shadow-search:    0 2px 8px rgba(0,0,0,0.12);
--shadow-search-focus: 0 0 0 3px rgba(58,133,194,0.30), 0 2px 8px rgba(0,0,0,0.12);
--shadow-card:      0 4px 20px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06);
--shadow-elevated:  0 8px 32px rgba(0,0,0,0.14);
```

---

## Layout & Component Patterns

### 1. Search — Landing State (Hero)

**Pattern derived from:** Trainline, Rome2Rio, Citymapper — single dominant destination input, background IS the brand, white card is lifted aggressively off it.

Key decisions:
- **Tagline above input** — `text-label` Syne 600, uppercase, `text-on-water-muted`:  
  `"HVOR SKAL DU?" / "WHERE TO?"` (translated via i18n, all caps)
- **Input is larger:** `py-4 px-5` (was `py-3 px-4`), `text-search` (18px), `rounded-search`
- **Left icon:** filled location-pin SVG in `--water-light`, always visible (destination metaphor, not a search loop — the search loop only appears during search)
- **Right icon:** magnifier when idle, spinner when searching
- **Input bg:** pure white, `--shadow-search` at rest, `--shadow-search-focus` on focus
- **No border** on the input — shadow alone creates the lift
- **Dropdown:** bg `--surface-tint`, `--radius-card`, `--shadow-elevated`, results use DM Sans

```
┌──────────────────────────────────┐
│  HVOR SKAL DU?   (label, muted)  │  ← Syne 600 12px, white/70
│ ┌────────────────────────────┐   │
│ │ 📍  Destinasjon...     🔍  │   │  ← 18px DM Sans, rounded-search
│ └────────────────────────────┘   │
│  ┌──────────────────────────┐    │
│  │ Ørsta                    │    │  ← search results dropdown
│  │   Møre og Romsdal        │    │
│  │ Volda                    │    │
│  └──────────────────────────┘    │
└──────────────────────────────────┘
```

### 2. Journey Summary Card — Timeline Layout

**Pattern derived from:** Citymapper step-by-step, Trainline itinerary rail. The left vertical rail is the spine; everything else is anchored to it.

Key decisions:
- **Left rail:** 2px solid `--water-light`, running the full height of the legs section
- **Step nodes:** Circle on the rail
  - Car: 14px circle, `--surface-variant` bg, small car glyph
  - Ferry: 20px circle, `--water` bg, ferry glyph white — larger because it's the critical event
- **Leg label:** DM Sans 400, `--text-primary`, right of node
- **Duration:** DM Sans 400, `--text-secondary`, right-aligned on same row
- **MarginBadge — redesigned:**
  - Moved OUT of the inline leg row and given its own row, full-width-ish
  - Size: `px-4 py-2.5 rounded-badge` — tall enough to be a finger target
  - Number in `text-mono-lg` (20px JetBrains Mono 700)
  - Unit label ("min") in `text-caption` DM Sans, aligned to number baseline
  - Semantic bg/text from margin tokens
  - Example: `"+14 min"` in large mono on green surface
- **Departure time row:** Below the badge, `text-mono-sm` (JetBrains Mono), muted
- **Footer:**
  - Left: `"Arrives at 16:42"` — `text-heading` DM Sans 600, `--text-primary`
  - Right: "Start trip →" button — `bg-water text-white py-3 px-6 rounded-btn font-semibold`

```
┌─────────────────────────────────────┐
│ Ørsta                          ✕   │  ← Syne 700 heading + close
│ 1 h 12 min total                   │  ← DM Sans 400, secondary
├─────────────────────────────────────┤
│                                     │
│ ●── 🚗  Kjør til Ørsta kai   42 min│  ← car node (14px), DM Sans
│ │                                   │
│ ◉── ⛴  Festøya → Solavågen        │  ← ferry node (20px, blue)
│         ┌──────────────────┐        │
│         │  +14 min         │        │  ← MarginBadge (large, mono)
│         └──────────────────┘        │
│         Avgang 15:35                │  ← departure time, JetBrains Mono
│ │                                   │
│ ●── 🚗  Kjør til Ørsta       8 min │
│                                     │
├─────────────────────────────────────┤
│ Arrives at 16:42       [Start trip] │
└─────────────────────────────────────┘
```

### 3. Trip View — Bottom Sheet Panel

**Pattern derived from:** Uber/Lyft active trip panel, Waze turn list — fixed bottom panel, 2 steps visible (active + next), everything else dropped.

Key decisions:
- **Panel:** fixed bottom, `rounded-t-card` (20px top corners only), bg `bg-white/92 backdrop-blur-md` (web) / translucent white (app)
- **Handle:** 32×4px rounded pill, `--surface-variant`, centred at top of panel — drag affordance
- **Completed steps:** removed from panel entirely (state machine clears them)
- **Active step:**
  - Large step icon (24px) in `--water` circle
  - Destination label: `text-heading` Syne 700
  - Sub-label: time remaining or distance (DM Sans, secondary)
  - **MarginBadge:** right-aligned, same large design as journey card
- **Next step row:** single muted line below — `"Then: Drive 8 min → Ørsta"` in DM Sans 400 secondary
- **Stale position banner:** amber full-width bar above the panel when GPS is >5 min stale
  - `bg-amber-50 border-t border-amber-300 text-amber-800 text-sm py-2 px-4`
  - "Position may be outdated — tap to refresh"

```
    ┌───── stale banner (if applicable) ─────┐
    │ ⚠ Position outdated — tap to refresh   │  ← amber bar
    └─────────────────────────────────────────┘
    ╔═════════════════════════════════════════╗
    ║          ──────                         ║  ← drag handle
    ║ ◉ Festøya → Solavågen   [+14 min]      ║  ← active step + badge
    ║   Avgang 15:35                          ║
    ║ ─────────────────────────────────────── ║
    ║ Then: Drive 8 min → Ørsta              ║  ← next step, muted
    ╚═════════════════════════════════════════╝
```

---

## Implementation Mapping

### Web — Tailwind v4 CSS Variables

Add to `globals.css` `:root` block:

```css
/* Typography */
--font-display: 'Syne', sans-serif;
--font-body: 'DM Sans', sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Water palette (replaces current --primary family) */
--water: #2569A3;
--water-light: #3A85C2;
--water-dark: #011638;

/* Accent */
--accent: #E8A020;

/* Margin semantic tokens */
--color-margin-safe: #16A34A;
--color-margin-safe-surface: #DCFCE7;
--color-margin-safe-text: #14532D;
--color-margin-tight: #D97706;
--color-margin-tight-surface: #FEF3C7;
--color-margin-tight-text: #78350F;
--color-margin-missed: #DC2626;
--color-margin-missed-surface: #FEE2E2;
--color-margin-missed-text: #7F1D1D;

/* Shadows */
--shadow-search: 0 2px 8px rgba(0,0,0,0.12);
--shadow-card: 0 4px 20px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06);
--shadow-elevated: 0 8px 32px rgba(0,0,0,0.14);
```

Update `@theme inline` block to expose these as Tailwind utilities (`bg-water`, `text-water`, etc.).

Update `--background` in `:root` to `--water` and in `.dark` to `--water-dark`.

Load fonts via `next/font/google` in `layout.tsx`:

```ts
import { Syne, DM_Sans, JetBrains_Mono } from 'next/font/google';
const syne = Syne({ subsets: ['latin'], weight: ['400','600','700','800'] });
const dmSans = DM_Sans({ subsets: ['latin'] });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['500','700'] });
```

Expose as CSS variables on `<html>` and wire into `@theme inline`.

### App — ThemeContext Extension

Add margin colour groups to `ThemeColors` interface and both `lightColors` / `darkColors` objects:

```ts
marginSafe: { bg: string; text: string; accent: string };
marginTight: { bg: string; text: string; accent: string };
marginMissed: { bg: string; text: string; accent: string };
```

Light values:
```ts
marginSafe: { bg: '#DCFCE7', text: '#14532D', accent: '#16A34A' },
marginTight: { bg: '#FEF3C7', text: '#78350F', accent: '#D97706' },
marginMissed: { bg: '#FEE2E2', text: '#7F1D1D', accent: '#DC2626' },
```

Dark values:
```ts
marginSafe: { bg: '#14532D', text: '#86EFAC', accent: '#4ADE80' },
marginTight: { bg: '#78350F', text: '#FCD34D', accent: '#FBBF24' },
marginMissed: { bg: '#7F1D1D', text: '#FCA5A5', accent: '#F87171' },
```

Update background to `#2569A3` (light) — same dark `#011638`.

---

## Margin Badge Threshold Change (from current code)

Current (web `JourneyPanel.tsx`):
```ts
minutes > 2  → green
minutes >= -2 → yellow
else          → red
```

Replace with:
```ts
minutes > 10 → safe tier
minutes >= 0 → tight tier
minutes < 0  → missed tier
```

Same change in app `MarginBadge.tsx`.

---

---

## Revision 2 — Layout Composition & State Transitions (2026-04-20)

This section addresses four structural changes to the minimal-result state. These supersede the layout described in sections 2 and 3 above where they conflict.

### R2.1 — Search Hides on Journey Load

**Problem:** The search bar stays visible after a journey is calculated, wasting vertical space and splitting attention. The user's intent has shifted from "find a destination" to "understand the trip."

**New behaviour:**
- When `journey` + `destination` resolve → the search bar animates **out** (slide up + fade).
- The journey result card occupies the full viewport (minus header).
- A **close/dismiss icon** (✕) in the journey heading lets the user abort the trip and return to search.
- When the trip is dismissed → the search bar animates **back in** (slide down + fade), input is focused, and the previous query text is preserved so the user can refine.

**Animation approach — pure CSS transitions (no library):**

Use `transition-behavior: allow-discrete` + `@starting-style` (Baseline since mid-2025, supported in Chrome, Safari, Firefox). This lets us animate `display: none ↔ block` together with `opacity` and `transform` in a single CSS transition — no JS timers, no extra dependencies.

```css
.search-wrapper {
  /* visible state */
  opacity: 1;
  transform: translateY(0);
  transition: opacity 280ms ease-out,
              transform 280ms ease-out,
              display 280ms allow-discrete;

  /* entry from display:none */
  @starting-style {
    opacity: 0;
    transform: translateY(-12px);
  }
}

.search-wrapper[hidden] {
  display: none;
  opacity: 0;
  transform: translateY(-12px);
}
```

Implementation: toggle the `hidden` attribute via React state. The CSS handles entry and exit. Duration 280ms (within the 200–500ms accessible range, snappy enough to feel immediate).

**Fallback:** If `transition-behavior` is unsupported, the element still toggles via `display: none` — just without animation. Progressive enhancement, no broken state.

**Sidebar layout (≥1280px):** Same behaviour — the search card slides up and the journey card expands to fill the left column. No special handling needed; the flex layout reflows naturally.

---

### R2.2 — Unified Journey Card: Map + Details + Heading

**Problem:** Map and trip details are currently separate siblings. The destination name, arrival time, and action icons feel like metadata rather than a clear heading. There's no single "this is your trip" container.

**New structure — one card, three zones:**

```
╔═══════════════════════════════════════════════╗
║  HEADING ZONE (full width)                     ║
║  ┌───────────────────────────────────────────┐ ║
║  │ Ørsta                    ♡        ✕       │ ║
║  │ Ankommer 16:42                            │ ║
║  └───────────────────────────────────────────┘ ║
╠═══════════════════════════════════════════════╣
║  MAP ZONE                                      ║
║  ┌───────────────────────────────────────────┐ ║
║  │                                           │ ║
║  │          (Leaflet / RN Maps)              │ ║
║  │              224px → 200px                │ ║
║  │                                           │ ║
║  └───────────────────────────────────────────┘ ║
╠═══════════════════════════════════════════════╣
║  DETAILS ZONE (scrollable)                     ║
║  ┌───────────────────────────────────────────┐ ║
║  │  (legs timeline + margin badge)           │ ║
║  │  ...                                      │ ║
║  │  [Start trip →]                           │ ║
║  └───────────────────────────────────────────┘ ║
╚═══════════════════════════════════════════════╝
```

**Heading zone** specifics:
- **Destination name:** `text-heading` Syne 700, 18px — the dominant element. Truncates with ellipsis on overflow.
- **Arrival time:** Below the name, `text-mono-sm` JetBrains Mono 500, `--text-secondary`. Format: `Ankommer HH:MM` (localised).
- **Heart icon:** Right side, vertically centred. Tap to toggle favorite. Filled red when active, outline `--text-secondary` when inactive.
- **Close icon (✕):** Right side, after heart. `--text-secondary`, 20px tap target (min 44px hit area for accessibility). Tap triggers `onExit` → animates search back in.
- **Spacing:** `px-4 pt-4 pb-3` inside the heading zone. A 1px `border-bottom` in `--surface-variant` separates heading from map.

**Map zone:**
- Rendered inside the card, below heading. Height: `200px` on mobile, `224px` on sidebar.
- `overflow: hidden` + `rounded-none` (the card wrapper provides outer rounding).
- Map tiles load immediately on journey resolve (already the case).

**Details zone:**
- Below map, separated by another subtle 1px border.
- Scrollable (`overflow-y: auto`, `max-h-[40vh]` on mobile, `flex-1` on sidebar).
- Contains the legs timeline and "Start trip" button.

**Why one card?** It establishes a single visual object for the trip. The user can scan top-to-bottom: *where* (heading) → *route shape* (map) → *timing details* (legs). The close icon is always visible in the heading — no scrolling needed to dismiss.

**Sidebar layout (≥1280px):** The unified card fills the left column. Map + details stack vertically inside it, both scrollable if the column is short.

---

### R2.3 — Legs UI: Margin-Centric Redesign

**Problem:** The current timeline layout gives equal visual weight to every leg. The margin-to-next-ferry is the product's core value but it's visually subordinate — a badge inside a leg row. Users should see the margin *first*, with legs as supporting context.

**Research findings:** Transit apps like Transit App and Citymapper use countdown-style displays where the *time until next event* is the hero element, with route details secondary. The pulsating-wave indicator pattern (Transit App) distinguishes real-time from scheduled data.

**Proposed approach — "Margin hero, legs as context":**

```
┌─────────────────────────────────────────────┐
│                                             │
│   🚗  Kjør til Ørsta kai            42 min  │  ← compact driving leg
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│          ┌─────────────────────┐            │
│          │                     │            │
│          │    +14 min          │            │  ← HERO MARGIN BADGE
│          │    margin           │            │
│          │                     │            │
│          └─────────────────────┘            │
│                                             │
│   ⛴  Festøya → Solavågen                   │  ← ferry route label
│   Avgang 15:35          30 min overf.       │  ← departure + crossing time
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│   🚗  Kjør til Ørsta                 8 min  │  ← compact driving leg
│                                             │
└─────────────────────────────────────────────┘
```

**Key changes from current design:**

1. **MarginBadge is a section divider, not an inline element.** It sits *between* the driving leg and the ferry leg, spanning the full card width (with padding). This makes it the visual centrepiece — the eye lands on it naturally between the "drive" and "board" actions.

2. **Badge is larger:** `py-4 px-6`, `text-mono-lg` (20px) for the number, with the word "margin" as a `text-caption` label below. Semantic background fills the full badge width. Minimum height ~64px.

3. **Driving legs are compact.** Single row: icon + destination + duration, right-aligned. No sub-labels, no timeline rail. `text-body` DM Sans, `--text-primary`. Think of them as "connecting tissue" between margin badges.

4. **Ferry legs are informational but secondary to the badge.** Show route (`From → To`), departure time in mono, and crossing duration. No separate badge here — the badge above already communicates the margin.

5. **Multiple ferries:** Each ferry gets its own margin badge section divider. The layout repeats: `drive → BADGE → ferry → drive → BADGE → ferry → drive`. The badges create a visual rhythm.

6. **Left rail removed.** The timeline rail added visual complexity without proportional value in this margin-centric layout. The section dividers (margin badges) provide enough structural separation. Simpler = better for a glanceable UI.

7. **"Tight" badge gets a subtle pulse.** When `0 ≤ margin ≤ 10`, add a slow CSS pulse animation (2s, infinite) on the badge border — `box-shadow` oscillates between `0 0 0 0` and `0 0 0 4px var(--color-margin-tight)` at 30% opacity. This draws attention without being alarming. "Missed" badges are static (red is attention enough).

---

### R2.4 — Auto-Refresh Indicator & Update Strategy

**Problem:** Users don't know when departure data was last refreshed. The current 5-minute API cache (`Cache-Control: max-age=300`) means data can be up to 5 minutes stale, but nothing communicates this.

**Research findings:** The UX consensus (SWR pattern, Transit App) is:
- Automatic refreshes should be **subtle** — no spinner, no layout shift.
- Show a **"last updated" timestamp** so users can judge freshness themselves.
- Use **visual differentiation** (e.g., pulsating indicator) to distinguish live vs. cached data.
- Avoid refresh indicators for automatic updates — reserve spinners for user-initiated actions.

#### A. Visual indicator: "Updated X min ago"

**Placement:** Bottom of the details zone, below the last leg, above the "Start trip" button. Right-aligned, `text-caption` (12px DM Sans 400), `--text-secondary`.

**Format:**
- `Oppdatert nå` — within 30 seconds of fetch
- `Oppdatert 2 min siden` — after 30s, shows elapsed minutes
- `Oppdatert 5+ min siden` — after 5 min, text shifts to `--color-margin-tight` amber to hint staleness

**Live dot:** A small 6px circle to the left of the text. Green (`--color-margin-safe`) when data is <2 min old, fading to `--text-disabled` gray as it ages. Mimics the Transit App "pulsating waves" concept but as a simpler static dot (pulse would be distracting in a mostly-static card).

#### B. Update strategy: refresh smarter, not more often

The current architecture already supports free-ish refreshes — `/quay/departures` is uncached and hits EnTur directly. The bottleneck is the `/journey` endpoint (HERE routing, 5-min cache). But for margin recalculation in the minimal-result state, we don't need to re-route — we only need fresh departures.

**Strategy: "Departure-only refresh"**

1. **On journey load:** Full `/journey` call (as today). Cache the route geometry and drive durations — these don't change in the minimal-result state (user hasn't started driving yet).

2. **Every 60 seconds (auto):** Re-call `/quay/departures?quayId=...&arrivalTime=<same computed arrival>` only. This is free (no HERE quota), fast (<500ms), and gives fresh margin numbers. Update the margin badge in-place with no layout shift.

3. **On tab refocus (`visibilitychange`):** Trigger an immediate departure refresh if >60s since last fetch. Users who tab away and come back get fresh data instantly.

4. **On user pull-to-refresh (mobile) or click-to-refresh (web):** Full `/journey` re-call to also update drive times (traffic may have changed). Show a brief inline spinner in the "Updated" label area — not a full-screen loader.

**Implementation detail:** Store `lastDepartureRefresh: number` (timestamp) alongside the journey state. A `useEffect` with `setInterval(60_000)` triggers the lightweight departure-only refresh. The "Updated X min ago" label derives from this timestamp.

**Cost analysis:**
- Current: 1 API call per journey (HERE cached 5 min) + 1 departure call per ferry leg
- Proposed: Same initial cost + ~1 departure call/min per ferry leg while the card is visible
- EnTur has no rate limit for reasonable usage. At 1 call/min, a user viewing a journey for 10 minutes costs 10 extra departure calls — negligible.

---

## Summary of Key Decisions

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Font | Syne + DM Sans + JetBrains Mono | Character without decoration; mono for precision |
| Background | Deepen to `#2569A3` (light), keep `#011638` (dark) | More dignified fjord blue, less electric |
| Search input | `py-4 px-5 text-lg`, no border, shadow only, pin icon left | Hero prominence; booking-app pattern |
| Tagline | Small uppercase label above search | Contextualises the single-field UI |
| MarginBadge | Large pill, own row, mono number, semantic tokens | The core value prop; deserves real estate |
| Margin thresholds | >10 safe, 0–10 tight, <0 missed | Tighter thresholds reflect ferry reality |
| Timeline | ~~Left rail + circle nodes~~ → Removed (R2.3) | Margin badges as section dividers provide enough structure |
| Trip panel | Fixed bottom, 2 steps, frosted glass, drag handle | Navigation app convention; clear hierarchy |
| Stale banner | Amber, full-width, above panel | Distinct from normal UI, can't be missed |
| Semantic tokens | CSS vars (web) + ThemeContext (app) | Single source of truth, dark mode included |
| Search visibility | Hides on journey load, returns on dismiss (R2.1) | Reduces clutter; full space for trip card |
| Unified card | Map + details + heading in one wrapper (R2.2) | Single visual object; close icon always visible |
| Margin-centric legs | Badge as section divider, driving legs compact (R2.3) | Margin is the product — give it hero treatment |
| Auto-refresh | 60s departure-only poll + "Updated" label (R2.4) | Fresh margins at near-zero cost |
| Animation | CSS `transition-behavior: allow-discrete` (R2.1) | No library needed; progressive enhancement |
