# Rekkferga — Implementation Plan

_Last updated: 2026-04-15_

## Product Direction

Rekkferga's core value: enter a destination, get a complete route with real-time ferry departure margins — something no existing tool (including Google Maps) provides. The app is **search-first, destination-centric**. Users never search for or select ferry quays; quays are implementation details surfaced as visual waypoints in the journey result.

### UX Model — Three States

The product has three distinct states, progressing linearly with an easy exit back to state 1:

| State | Description |
|-------|-------------|
| **Landing** | Clean page: search input only. Search results list appears below the input while typing. No map. |
| **Minimal result** | Same page, same URL. Triggered on destination select. Small static map confirms location. Essential journey summary (ferry time, margin, legs). Cancel returns to landing state. "Start trip" navigates to the dedicated trip view. |
| **Trip view** | Separate page (`/trip`). Full live tracking: continuous GPS, resume on phone unlock, road-snapped polylines, alternative route selection. |

---

## Current State Summary

_Updated after Phases 0–2b, Phase 5, and pre-Phase 3 cleanup._

### API (`packages/api/`)
- `GET /journey?from=lat,lng&to=lat,lng` — returns `JourneyResult[]`. Car legs have HERE-provided traffic-aware `duration`, road-snapped `geometry` (`[[lat,lng],...]`), and optional `alternatives`. Ferry legs have `fromQuayId`/`toQuayId`. Response cached 5 min (`Cache-Control: public, max-age=300`). Falls back to EnTur static data if HERE unavailable (`trafficDataAvailable: false`).
- `GET /quay/departures?quayId=NSR:...&arrivalTime=ISO` — departures from `now` grouped by destination. Each option has `marginMinutes: number | null`, `isFirstReachable: bool`. Not cached — always live.
- `GET /search?query=X&size=N` — Nominatim geocoding, Norway only. Returns `{id, name, subName, latitude, longitude, type: 'location'}`.
- `GET /health` — queries EnTur to verify connectivity. Returns `{status, entur: bool}`.
- Files: `app.py`, `journey_planner.py`, `here_routing.py`, `nominatim.py`, `util.py`.
- ORS removed entirely. `flexpolyline` added for HERE geometry decoding.

### Shared (`shared/`)
- `types/index.ts` — `SearchResult.subName` (camelCase), `DepartureOption.marginMinutes: number | null`, `CarLeg.geometry`, `CarLeg.alternatives`, `JourneyResult.trafficDataAvailable`.
- `utils/index.ts` — `formatDuration(seconds)`, `formatTime(iso)`, `firstReachable(deps)`, `calculateDistance`, `isValidNsrId`, `debounce`.

### Web (`packages/web/`)
- Search-first layout: landing = centered search only; result state = search + small 224px HERE map card + journey panel; "Start trip" → `/trip`.
- `Map.tsx` — uses HERE raster tiles (`explore.day` style) when `NEXT_PUBLIC_HERE_API_KEY` set, falls back to OSM. Road-snapped geometry rendered when present on car legs.
- `JourneyPanel.tsx` — imports `formatTime`, `formatDuration`, `firstReachable` from `@shared/utils`. `MarginBadge` handles `null`.
- `Search.tsx` — renders `subName`.
- `page.tsx` — arrival time passed to `/quay/departures` is `Date.now() + driveDuration` (not EnTur's scheduled end time).
- `MapWrapper.tsx` deleted. Demo and test-theme pages deleted.
- `/trip/page.tsx` — placeholder stub.

### App (`packages/app/`)
- Search-first layout: landing = search only; result state = ScrollView with search + 200px map card + journey card; "Start trip" → `/trip`.
- `Map.tsx` — road-snapped geometry used for car leg Polylines when present.
- `JourneyPanel.tsx` — imports shared utils; null-safe margin display.
- `MarginBadge.tsx` — `marginMinutes: number | null`, returns null when absent.
- `SearchResultItem.tsx` — renders `subName`.
- `index.tsx` — arrival time = `Date.now() + driveDuration`.
- `/trip.tsx` — placeholder stub.

### Key decisions made
- **Geocoding**: Nominatim only (free, good Norwegian coverage). ORS removed.
- **Map tiles (web)**: HERE raster tiles for visual consistency with HERE routing geometry.
- **Map (app)**: `react-native-maps` stays — no official HERE React Native SDK.
- **EnTur**: Irreplaceable for Norwegian ferry schedules. Stays regardless of other provider changes.
- **HERE free tier**: ~30k transactions/month shared across routing + tiles. Nominatim kept for geocoding to preserve quota for routing.

---

## Phase 0 — API Cleanup ✓
## Phase 1 — Shared Type Alignment ✓
## Phase 2 — Core Journey Flow ✓
## Phase 2b — Search-First Layout ✓
## Phase 5 — Routing API ✓

_All above complete and committed._

---

## Phase 3 — Trip View (Dedicated Page) ✓

_Complete. Entered only via "Start trip" from the minimal result view._

### Passing journey data to the trip view

- **Web:** `sessionStorage` — written in `page.tsx` before `router.push('/trip')`, read on mount in `trip/page.tsx`. Keys: `trip_journey`, `trip_destination`. Cleared on exit.
- **App:** Module-level store (`packages/app/store/tripStore.ts`) — `setTripData` / `getTripData` / `clearTripData`. Written in `index.tsx` before `router.push('/trip')`, read on mount in `trip.tsx`. Cleared on exit.

### Map

- Full-screen map (Leaflet on web, `react-native-maps` on app).
- Car leg polylines rendered from `leg.geometry` (road-snapped, already in the journey data).
- Ferry legs as dashed lines between quay coordinates.
- Continuously updated user location dot.
- Completed car/ferry segments dim progressively.
- Alternative car routes from `leg.alternatives` selectable (highlight selected, dim others).

### Location Tracking

- **App:** `expo-location` background mode — `startLocationUpdatesAsync` with `LocationActivityType.AutomotiveNavigation`. Request permission with explicit explanation. Store latest position in a module-level ref (not AsyncStorage — too slow). On `AppState` → `active`: trigger immediate recalculation from latest stored position.
- **Web:** `navigator.geolocation.watchPosition` while tab is visible. On `visibilitychange` (tab refocus), request fresh position and recalculate. Show "tap to update" banner if position is stale (>5 min).

### Margin recalculation

On each GPS update:
1. Compute `remainingDriveTime` = estimated seconds from current position to next ferry quay (use HERE `/journey` with current coords → quay coords, or approximate from `leg.geometry` progress).
2. `arrivalAtQuay = Date.now() + remainingDriveTime`.
3. Re-call `/quay/departures?quayId=...&arrivalTime=<arrivalAtQuay>` — API recomputes margins live.
4. Update the displayed departure and margin badge.

> `/quay/departures` is intentionally uncached so recalculation always reflects real-time departure data.

### Journey State Machine

| State | Transition trigger |
|-------|-------------------|
| `driving_to_quay` | Default when active trip started |
| `at_quay` | GPS within ~200m of quay coordinates |
| `crossing` | Departure time passed + user was at quay |
| `crossing_complete` | GPS past quay on destination side, or fixed time after departure |
| `arrived` | GPS within ~200m of destination |

Drop completed legs from the panel — always show only what is ahead.

### On App Resume
1. Read last stored GPS position.
2. Recompute remaining drive time to next quay.
3. Re-call `/quay/departures` to refresh margins.
4. Advance state machine if ferry departure passed while backgrounded.

---

## Phase 4 — Recents & Favorites (Destination-Based)

_Can run in parallel with Phase 3._

- **App:** AsyncStorage. Up to 5 favorites, up to 10 recents (FIFO, auto-populated on journey start).
- **Web:** localStorage. Same structure, same limits.
- On search field focus: favorites (starred) shown above recents as quick-tap items.
- Favorite toggle from the minimal result view ("Save this destination").
- No migration from old quay favorites — clean break.

---

## Phase 6 — UI Polish & Visual Design System

_After Phase 3 is stable._

### Phase 6a — Design Research ✓

_Complete. See `docs/design-brief.md` for all token values, layout patterns, and rationale._

Key decisions:
- **Aesthetic:** Nordic Coastal Utility — restraint and precision, not decoration
- **Fonts:** Syne (display/labels) + DM Sans (body) + JetBrains Mono (margin numbers & times)
- **Background:** `#2569A3` light / `#011638` dark (deepened from current `#42a5f5`)
- **Search:** larger (`py-4 px-5 text-lg`), pin icon left, no border/shadow-only, uppercase tagline above
- **MarginBadge:** large pill with own row, mono font, semantic CSS variable tokens
- **Margin thresholds:** >10 safe / 0–10 tight / <0 missed (replaces current >2/≥-2)
- **Journey panel:** left-rail timeline, larger ferry node, badge below ferry row
- **Trip panel:** fixed bottom sheet, 2 forward steps only, frosted glass, stale-position amber bar

### Phase 6b — Implementation

_Only after the design brief from 6a is complete._

**Search (Landing state)**
- Large, visually dominant search input: bigger font, prominent border/shadow, descriptive placeholder.
- Supporting label or tagline above the input.
- Consistent on web (Tailwind) and app (NativeWind + StyleSheet).

**Journey summary card (Minimal result)**
- Timeline layout: vertical left rail with icons at each step node; step label left-aligned, duration right-aligned.
- `MarginBadge` enlarged and colour-coded by urgency tier (safe / tight / missed); rendered prominently under the ferry leg, not inline with text.
- Arrival time displayed as the footer anchor ("Arrives at HH:MM"), not computed duration.

**Trip view**
- Bottom panel shows only the active step + next step; completed steps are dropped.
- Live margin badge updates visually (no full re-layout) as GPS recalculates.
- Stale position banner styled distinctly from normal UI (amber, full-width).

**Design system**
- Single token set: Tailwind v4 CSS variables (web) + `ThemeContext` hex values (app).
- Semantic margin colours defined as tokens (`--color-margin-safe`, `--color-margin-tight`, `--color-margin-missed`) shared across both platforms.
- Dark mode parity across all new components.
- Remove remaining debug artifacts and branding inconsistencies.

---

## Phase Ordering

```
Phase 0 — API Cleanup              ✓ complete
Phase 1 — Shared Types             ✓ complete
Phase 2 — Core Journey Flow        ✓ complete
Phase 2b — Search-First Layout     ✓ complete
Phase 5 — Routing API              ✓ complete
Phase 3 — Trip View Page           ✓ complete
Phase 4 — Recents & Favorites      ← next
Phase 6a — Design Research         ✓ complete (see docs/design-brief.md)
Phase 6b — UI Polish & Design Sys  (after 6a brief is done)
```
