# Rekkferga — Implementation Plan

_Last updated: 2026-04-09_

## Product Direction

Rekkferga's core value: enter a destination, get a complete route with real-time ferry departure margins — something no existing tool (including Google Maps) provides. The app is map-first, destination-centric. Users never search for or select ferry quays; quays are implementation details surfaced as visual waypoints in the journey result.

---

## Current State Summary

### API (`packages/api/`)
- `/quays`, `/quay/details` — quay browsing endpoints (to be removed)
- `/quays/route` — `get_journey_with_ferries()` identifies ferry legs between two coordinate pairs (core, to be promoted)
- `/search` — unified autocomplete returning ferry stops + locations (to be narrowed to locations only)
- ORS route calculation stubbed and dead
- Vegvesen departures always report `realtime: False`
- EnTur client header incorrectly set to `"miles-fergo_app"`
- No logging, no tests

### Web (`packages/web/`)
- Leaflet map with quay markers, autocomplete search, basic quay card
- Quay card close button calls `window.close()` (broken)
- No route visualization, no departure display
- Debug logs in Map.tsx, no theme toggle UI

### App (`packages/app/`)
- Home with search / favorites (quay-based) / nearby quays
- Quay details page with departures and margin badges — functional
- Theming (light/dark/system), i18n (en/no/nn), AsyncStorage favorites
- Destination/location results page (`[destination]/[location].tsx`) is a stub
- Directions component unclear if fully wired

### Shared
- `shared/types` largely ignored — web and app both define types locally
- Constants unused by Python API

---

## Phase 0 — API Cleanup

_Prerequisite for all subsequent phases._

1. **Remove `/quays` endpoint** and all Vegvesen quay-list logic (`get_vegvesen_quay_list`, pagination, distance sorting).
2. **Remove `/quay/details` endpoint** — quay detail pages are being cut from both frontends.
3. **Promote `/quays/route` → `/journey`** with a cleaner contract: `from_coords + destination_coords` → trip patterns with ferry legs identified, quay NSR IDs per leg, and drive durations.
4. **Narrow `/search`** to return only `type: 'location'` results. Remove ferry quay results — users no longer search for quays.
5. **Keep `/quay/departures`** as an internal endpoint: given a quay NSR ID + expected arrival time, return next N departures with margins. Called per ferry leg in the journey result, not user-facing.
6. **Fix route timing** — replace hardcoded time modes in `get_route_to_nsr_id()` with actual current time.
7. **Fix EnTur client header** — change `"miles-fergo_app"` to `"rekkferga_app"`.
8. **Replace print statements** with Python `logging` module throughout.
9. **Delete `ors.py`** — ORS geocoding superseded by Nominatim; route calculation already removed. Dead file.
10. **Remove `get_nearest_ferry_stops()`** — nearby quay feature is being cut.

---

## Phase 1 — Shared Type Alignment

Split into two steps because the local type files are still imported by active quay-centric components. Deleting them before Phase 2 rewrites those components would break both builds.

### Phase 1a — Add new types (additive, non-breaking)

Update `shared/types/index.ts`:
- **Add** destination-routing types: `JourneyResult`, `JourneyLeg`, `DepartureOption`, `Destination`, `SavedDestination`
- **Remove** `QuayDetails` — no longer used anywhere after Phase 0
- **Fix** `SearchResult.type` — remove `'quay'` variant, leaving `type: 'location'` only

### Phase 1b — Migrate and delete local types (done during Phase 2)

As each component is rewritten in Phase 2, migrate its type imports to `shared/types`. Once all references to a local type file are gone, delete it:
- `packages/app/types.ts` — delete when all app components are migrated
- `packages/web/types/index.ts` and `types/quay.ts` — delete when all web components are migrated

---

## Phase 2 — Core Journey Flow (App + Web)

_Main product feature. App and web can be implemented in parallel._

### Preamble — API response contracts (prerequisite before touching frontends)

1. **Expand `/journey` GraphQL query** to include leg-level `expectedStartTime`, `expectedEndTime`, `duration`, `distance`, and `latitude`/`longitude` on `fromPlace`/`toPlace`.
2. **Add `serialise_journey()`** in the API — maps raw EnTur `tripPattern` dicts to `JourneyResult` shape: `CarLeg` or `FerryLeg` per leg, with `fromQuayId`/`toQuayId` extracted for ferry legs.
3. **Add `_compute_margin_minutes()`** and wire into `process_departures()` — returns `marginMinutes` as a signed integer on every `DepartureOption`. The frontend renders this value directly and never recomputes margins from raw timestamps.

### Search
- Single autocomplete field, placeholder: `"Where are you going today?"`
- Calls `/search` (locations only)
- Recents shown below field by default when focused, before typing
- Favorites shown as pinned items above recents

### Journey Calculation
On destination selection:
1. Get user's current GPS coordinates
2. Call `/journey` with `from_coords` + `destination_coords`
3. Response: full route geometry, car legs with drive times, ferry legs with quay names + NSR IDs
4. For each ferry leg: call `/quay/departures` to calculate which departure the user can make and the margin

### Map Display
- Full route polyline — car segments and ferry crossing segments in distinct styles (e.g. solid vs dashed, different color)
- Pin markers at each ferry quay — visual waypoints only, not tappable for navigation
- Continuously updated user location dot
- No quay browsing, no clickable quay markers

### Journey Info Panel
- **App:** Draggable bottom sheet. Peek state: next ferry + margin. Expanded state: full journey breakdown — each leg in sequence with drive time, quay name, departure time, margin badge.
- **Web:** Left sidebar panel. Same content, static layout.
- Margin badge thresholds: >10 min = green, 2–10 min = amber, <2 min = red.
- "Next departure" automatically advances when a missed ferry is passed.

### Margin calculation ownership
The API owns margin calculation. `/quay/departures` returns `marginMinutes` as a signed integer on each `DepartureOption` — positive means the user can make the departure, negative means they will miss it. The frontend renders the value directly; it does not recompute margins from raw timestamps. This keeps display logic simple and ensures both platforms behave identically.

---

## Phase 3 — In-Transit State Management

_Builds on Phase 2. Most technically complex phase._

### Location Tracking
- **App:** `expo-location` in background mode (`startLocationUpdatesAsync`, `LocationActivityType.AutomotiveNavigation`). Requires background location permission — request explicitly with explanation ("We track your location to update ferry margins while you drive"). Store latest position in-memory (not AsyncStorage — too slow for frequent writes). On app foreground (`AppState` → `active`): trigger immediate recalculation from latest position.
- **Web:** No background execution. On tab refocus (`visibilitychange` event), request fresh geolocation and recalculate. Show "tap to update" if position is stale (>5 minutes).

### Journey State Machine

Model the active journey with these states:

| State | Description |
|-------|-------------|
| `driving_to_quay` | Driving toward next ferry quay |
| `at_quay` | Within N meters of the quay — show arrival indicator |
| `crossing` | Ferry crossing in progress |
| `crossing_complete` | Ferry leg done, driving toward next quay or destination |
| `arrived` | User reached destination |

Transitions driven by GPS position (geofencing around quay coordinates) and clock time (departure time passed + user near quay).

### On App Resume
When the app comes to foreground:
1. Recalculate drive time from current position to next quay
2. Recompute margin against next reachable departure
3. If a ferry leg's departure time has passed and user is past the quay: mark `crossing_complete`, remove leg from active journey view
4. If user missed a ferry (departure passed, still en route to quay): advance to next departure, show updated margin

### Completed Legs
Drop completed ferry crossings from the journey panel entirely — don't show them as "done," just remove them. The panel always shows only what's ahead. Map polyline dims completed segments.

---

## Phase 4 — Recents & Favorites (Destination-Based)

_Replaces quay favorites. Can run in parallel with Phase 3._

- **App:** AsyncStorage. Up to 5 favorites, up to 10 recents (FIFO, auto-populated on journey start).
- **Web:** localStorage. Same structure, same limits.
- On search field focus: favorites (starred) shown above recents as quick-tap items.
- Favorite toggle available from the journey result panel ("Save this destination").
- No migration from existing quay favorites — clean break.

---

## Phase 5 — Real-Time Traffic Data

_API work. Can run in parallel with Phases 3 and 4._

Current Entur car routing uses static travel times. Inaccurate drive times undermine margin accuracy — the core value prop.

### Options Assessment

| Source | Cost | Real-Time Traffic | Notes |
|--------|------|-------------------|-------|
| **HERE Routing API** | Free: 250k req/month | Yes | Best free option. Strong Norwegian road data. |
| **Mapbox Directions API** | Free: 100k req/month | Yes | Good quality, well-documented. Lower free limit. |
| Google Maps Routes API | ~$5–10 / 1k req | Yes | Best quality, expensive at scale. |
| Entur Journey Planner | Free | No (static GTFS) | Already used. No traffic. |
| OSRM / Valhalla (self-hosted) | Free | No | Open source, no real-time traffic without commercial data. |

**Recommendation: HERE Routing API.** 250k requests/month is sufficient for an early-stage product. Norwegian road data quality is high.

### Implementation
1. Add `here_routing.py` — takes `from_coords`, `to_coords`, `departure_time` → returns traffic-aware drive duration
2. In `/journey`: after Entur identifies trip pattern and ferry legs, replace Entur car leg durations with HERE durations
3. Store HERE API key in `.env` only — never in source
4. Fallback: if HERE call fails, use Entur duration and include a `trafficDataAvailable: false` flag in the response so the frontend can display "drive time may not reflect current traffic"

---

## Phase 6 — Visual Consistency & Branding

_Separate, dedicated effort. Must run after Phase 2 is stable. Use the frontend skill before undertaking this phase._

Scope:
- Define a single design token set (colors, typography, spacing) covering web (Tailwind CSS v4 variables) and app (ThemeContext)
- Visual consistency across map UI, bottom sheet/panel, search field, and margin badges between platforms
- Dark mode parity — web has theme infrastructure but no toggle UI
- Consistent branding throughout — no remaining "fergo"/"ferga" inconsistencies, correct logo usage
- Remove all debug UI (theme display in web Header, `console.log` calls in Map.tsx, etc.)

---

## Phase Ordering

```
Phase 0 — API Cleanup          (unblocks everything)
Phase 1 — Shared Types         (unblocks Phase 2)
Phase 2 — Core Journey Flow    (main product, app + web in parallel)
Phase 3 — In-Transit State     (builds on Phase 2)
Phase 4 — Recents & Favorites  (parallel with Phase 3)
Phase 5 — Traffic Data         (parallel with Phase 3 and 4)
Phase 6 — Visual Consistency   (separate effort, after Phase 2 stable)
```
