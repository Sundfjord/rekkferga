# Knowledge Core — Rekkferga

Accumulated learnings and archived context. Not auto-loaded; read on demand.

## Lessons

- **Nominatim is not an autocomplete backend.** It matches whole words only ("ber" → 0 hits) and its usage policy forbids type-ahead traffic. Use EnTur's geocoder (`api.entur.io/geocoder/v1/autocomplete`, `ET-Client-Name` header) for search-as-you-type. (2026-11-10)
- **Leaflet divIcon glyphs:** draw icons for the pin's square box; don't squeeze wide logos into small circles. Build `L.divIcon`s once and share them across markers. (2026-11-10)
- **Debounced fetches** need an AbortController (or request token) so a slow stale response can't overwrite newer results. (2026-11-10)

## Historical: R2 UI redesign (archived 2026-11-11)

Destination-centric web layout from April 2026, superseded by the quay-centric pivot (2026-05-22) — the web `Search.tsx` / `TripPanel.tsx` it describes were deleted.

- R2.1: search bar morphed in place into the trip header (destination name + heart + close), same font as the input.
- R2.2: single responsive layout (`flex-col xl:flex-row`), no JS `isSidebar` breakpoint; TripPanel left + map right on xl.
- R2.3 (margin-centric legs) and R2.4 (refresh indicator + poll) were never started as such; the quay-centric `MarginPanel` covers both ideas.
- The design brief (`docs/design-brief.md`) was deleted 2026-11-13 with the other planning docs; the durable preferences live in the `feedback_ui_preferences` memory.
