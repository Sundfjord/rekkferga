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
| **Trip view** | Separate page (`/trip/...`). Full live tracking: continuous GPS, resume on phone unlock, road-snapped polylines, alternative route selection. |

---

## Current State Summary

_Updated after Phase 0, Phase 1a, Phase 2 preamble, and Phase 2._

### API (`packages/api/`) — Phase 0 + preamble complete
- `GET /journey?from=lat,lng&to=lat,lng` — returns `JourneyResult[]` (serialised, typed). Car and ferry legs distinguished, ferry legs include `fromQuayId`/`toQuayId`.
- `GET /quay/departures?quayId=NSR:...&arrivalTime=ISO` — returns departures grouped by destination with `marginMinutes` (signed int) on each option.
- `GET /search?query=X&size=N` — returns locations only (`type: 'location'`). Nominatim primary, ORS fallback.
- `GET /` — health check.
- Files: `app.py`, `journey_planner.py`, `nominatim.py`, `ors.py`, `util.py`. Python `logging` throughout.

### Shared types (`shared/types/index.ts`) — Phase 1 complete
- Types: `JourneyResult`, `CarLeg`, `FerryLeg`, `LegPlace`, `DepartureOption`, `JourneyCall`, `Destination`, `SavedDestination`, `SearchResult` (location-only).
- `@shared/*` path alias added to both web and app tsconfigs.

### Web (`packages/web/`) — Phase 2 complete (layout to be revised in Phase 2b)
- Map-first layout (to be replaced): full-screen Leaflet map, search overlay top-left, journey panel below search.
- `Search.tsx` — location-only autocomplete, placeholder "Where are you going today?"
- `Map.tsx` — route polylines (car=solid blue, ferry=dashed cyan), quay waypoint markers, user location dot.
- `JourneyPanel.tsx` — left sidebar: destination, total duration, per-leg breakdown (drive time / ferry + departure time + margin badge).
- `page.tsx` — orchestrates GPS → `/journey` → `/quay/departures` per ferry leg; hydrates `FerryLeg.departures`.
- Local type files deleted; all types imported from `@shared/types`.

### App (`packages/app/`) — Phase 2 complete (layout to be revised in Phase 2b)
- Map-first layout (to be replaced): full-screen native map (`react-native-maps`), search overlay at top, `@gorhom/bottom-sheet` journey panel.
- `Search.tsx` — location-only autocomplete, triggers journey flow via `onSelect` callback.
- `Map.tsx` — polylines + ferry quay markers; no-op stub on web platform.
- `JourneyPanel.tsx` — bottom sheet, peek (20%): next ferry + margin; expanded (80%): full leg breakdown.
- `MarginBadge.tsx` — updated to accept `marginMinutes: number` directly (API-computed, no frontend recalculation).
- `index.tsx` — orchestrates GPS → `/journey` → `/quay/departures` per ferry leg.
- Quay-centric components deleted: Nearby, Favourites, QuayCard, DepartureBoard, DepartureCard, Directions, Timeline, MapNative, MapWeb, useQuayDetails, [quayId].tsx.

---

## Phase 0 — API Cleanup ✓

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

## Phase 1 — Shared Type Alignment ✓

Split into two steps because the local type files are still imported by active quay-centric components. Deleting them before Phase 2 rewrites those components would break both builds.

### Phase 1a — Add new types (additive, non-breaking) ✓

Update `shared/types/index.ts`:
- **Add** destination-routing types: `JourneyResult`, `JourneyLeg`, `DepartureOption`, `Destination`, `SavedDestination`
- **Remove** `QuayDetails` — no longer used anywhere after Phase 0
- **Fix** `SearchResult.type` — remove `'quay'` variant, leaving `type: 'location'` only

### Phase 1b — Migrate and delete local types (done during Phase 2) ✓

As each component is rewritten in Phase 2, migrate its type imports to `shared/types`. Once all references to a local type file are gone, delete it:
- `packages/app/types.ts` — delete when all app components are migrated
- `packages/web/types/index.ts` and `types/quay.ts` — delete when all web components are migrated

---

## Phase 2 — Core Journey Flow (App + Web) ✓

_Journey calculation logic is complete. Layout revision (Phase 2b) follows._

### Preamble — API response contracts ✓

1. **Expand `/journey` GraphQL query** to include leg-level `expectedStartTime`, `expectedEndTime`, `duration`, `distance`, and `latitude`/`longitude` on `fromPlace`/`toPlace`.
2. **Add `serialise_journey()`** in the API — maps raw EnTur `tripPattern` dicts to `JourneyResult` shape: `CarLeg` or `FerryLeg` per leg, with `fromQuayId`/`toQuayId` extracted for ferry legs.
3. **Add `_compute_margin_minutes()`** and wire into `process_departures()` — returns `marginMinutes` as a signed integer on every `DepartureOption`. The frontend renders this value directly and never recomputes margins from raw timestamps.

### Search ✓
- Single autocomplete field, placeholder: `"Where are you going today?"`
- Calls `/search` (locations only)
- Recents shown below field by default when focused, before typing
- Favorites shown as pinned items above recents

### Journey Calculation ✓
On destination selection:
1. Get user's current GPS coordinates
2. Call `/journey` with `from_coords` + `destination_coords`
3. Response: full route geometry, car legs with drive times, ferry legs with quay names + NSR IDs
4. For each ferry leg: call `/quay/departures` to calculate which departure the user can make and the margin

### Margin calculation ownership ✓
The API owns margin calculation. `/quay/departures` returns `marginMinutes` as a signed integer on each `DepartureOption` — positive means the user can make the departure, negative means they will miss it. The frontend renders the value directly; it does not recompute margins from raw timestamps.

---

## Phase 2b — Search-First Layout (App + Web)

_Replaces the Phase 2 map-first layout. Journey calculation logic is unchanged — this is purely a layout and UX restructuring._

### Landing State

- Page is clean: search input centered (or top-aligned), nothing else visible.
- Search results list appears below the input while typing — same autocomplete as today.
- No map rendered on the landing page.
- (Future: maritime-themed illustrative background, not live data.)

### Minimal Result State

Triggered on destination select (same flow as today: GPS → `/journey` → `/quay/departures`). Displayed on the same page without a URL change.

- **Small static map** — bounded to the route extent, not interactive live tracking. Confirms to the user they've selected the right location. Shows the route polyline (car=solid, ferry=dashed) and quay markers, identical visual language to the current full-screen map but compact.
- **Journey summary** — destination name, total duration, ferry departure time + margin badge, per-leg breakdown. Same content as current `JourneyPanel`, restructured for a card/panel layout rather than a sidebar.
- **Cancel** — prominent X or "back" that clears the result and returns to the landing state with the search input.
- **"Start trip"** — navigates to the dedicated trip view (`/trip` on web, a new screen on app).
- Loading and error states inline below the search input, same as today.

### Web specifics
- Layout shifts from "full-screen map with overlay" to a centered content column on landing, expanding to a split or stacked card layout in the minimal result state.
- Small map rendered as a constrained Leaflet instance (not full-screen), same `MapWrapper` dynamic import pattern.

### App specifics
- Landing: search input with safe-area padding, no map rendered.
- Minimal result: map rendered in a fixed-height card above the journey summary. Bottom sheet or scroll view for journey details.
- "Start trip" navigates to a new `/trip` screen (Expo Router).

---

## Phase 3 — Trip View (Dedicated Page)

_The full live-navigation experience. Separate page/screen — entered only via "Start trip" from the minimal result view._

### Route

- **Web:** `/trip` (query params carry journey context, or use sessionStorage for the full `JourneyResult`)
- **App:** `/trip` screen (Expo Router), journey data passed via navigation params or a lightweight context

### Map

- Full-screen map, road-snapped polyline (see Phase 5 — routing API provides geometry).
- Continuously updated user location dot.
- Alternative routes selectable (see Phase 5).
- Completed segments dim as the journey progresses.

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
Drop completed ferry crossings from the journey panel entirely — don't show them as "done," just remove them. The panel always shows only what's ahead.

---

## Phase 4 — Recents & Favorites (Destination-Based)

_Replaces quay favorites. Can run in parallel with Phase 3._

- **App:** AsyncStorage. Up to 5 favorites, up to 10 recents (FIFO, auto-populated on journey start).
- **Web:** localStorage. Same structure, same limits.
- On search field focus: favorites (starred) shown above recents as quick-tap items.
- Favorite toggle available from the minimal result view ("Save this destination").
- No migration from existing quay favorites — clean break.

---

## Phase 5 — Routing API (Traffic + Road-Snapped Geometry + Alternatives)

_API work. Replaces Entur's static car leg durations and straight-line geometry. Unblocks Phase 3's road-snapped map._

The same routing API serves two distinct needs:
1. **Traffic-aware drive times** — accurate margins (currently Entur uses static GTFS travel times).
2. **Road-snapped polyline geometry** — real road paths for the trip view map, not straight segments; required before Phase 3 map can show snapped routes.
3. **Alternative routes** — the routing API response typically includes 2–3 alternatives; surface these as selectable options in the trip view, similar to Google Maps.

### Options Assessment

| Source | Cost | Real-Time Traffic | Road Geometry | Notes |
|--------|------|-------------------|---------------|-------|
| **HERE Routing API** | Free: 250k req/month | Yes | Yes | Best free option. Strong Norwegian road data. |
| **Mapbox Directions API** | Free: 100k req/month | Yes | Yes | Good quality, well-documented. Lower free limit. |
| Google Maps Routes API | ~$5–10 / 1k req | Yes | Yes | Best quality, expensive at scale. |
| Entur Journey Planner | Free | No (static GTFS) | Straight-line | Already used. No traffic, no geometry. |
| OSRM / Valhalla (self-hosted) | Free | No | Yes | Open source, no real-time traffic without commercial data. |

**Recommendation: HERE Routing API.** 250k requests/month is sufficient for an early-stage product. Norwegian road data quality is high. Provides traffic-aware durations, full road-snapped geometry, and multiple route alternatives in a single call.

### Implementation
1. Add `here_routing.py` — takes `from_coords`, `to_coords`, `departure_time` → returns:
   - Traffic-aware drive duration per alternative
   - Road-snapped polyline geometry per alternative
   - List of alternatives (2–3 routes)
2. In `/journey`: after Entur identifies trip pattern and ferry legs, replace Entur car leg durations and geometry with HERE data. Include all alternatives in the response.
3. Store HERE API key in `.env` only — never in source.
4. Fallback: if HERE call fails, use Entur duration and straight-line geometry; include a `trafficDataAvailable: false` flag so the frontend can display "drive time may not reflect current traffic."

---

## Phase 6 — Visual Consistency & Branding

_Separate, dedicated effort. Must run after Phase 2b is stable. Use the frontend skill before undertaking this phase._

Scope:
- Define a single design token set (colors, typography, spacing) covering web (Tailwind CSS v4 variables) and app (ThemeContext)
- Visual consistency across map UI, bottom sheet/panel, search field, and margin badges between platforms
- Dark mode parity — web has theme infrastructure but no toggle UI
- Consistent branding throughout — no remaining "fergo"/"ferga" inconsistencies, correct logo usage
- Remove all debug UI (theme display in web Header, `console.log` calls in Map.tsx, etc.)

---

## Phase Ordering

```
Phase 0 — API Cleanup              ✓ complete
Phase 1 — Shared Types             ✓ complete
Phase 2 — Core Journey Flow        ✓ complete (calculation logic)
Phase 2b — Search-First Layout     (next — replaces map-first layout on web + app)
Phase 3 — Trip View Page           (builds on Phase 2b + Phase 5 geometry)
Phase 4 — Recents & Favorites      (parallel with Phase 3)
Phase 5 — Routing API              (unblocks Phase 3 road-snapped map; parallel with Phase 2b)
Phase 6 — Visual Consistency       (separate effort, after Phase 2b stable)
```

> Phase 5 can start in parallel with Phase 2b since it is pure API work. Phase 3's road-snapped map requires Phase 5 geometry to be available — Phase 3 should not launch until that is ready.
