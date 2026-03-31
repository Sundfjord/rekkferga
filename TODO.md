# TODO

## Infrastructure & Deployment

- [ ] **Decide: keep Flask API or migrate to Next.js Route Handlers**
  - Migrating eliminates Railway, reduces platforms from 3 to 2 (Vercel + EAS)
  - Only keep Flask if Python-specific processing (ML, data pipelines) is anticipated
- [ ] If migrating: move API proxy logic (EnTur, ORS, Vegvesen, Nominatim) into Next.js Route Handlers
- [ ] If migrating: remove `packages/api/` and update CI/CD workflows
- [ ] Replace Azure Functions cron plan with Vercel Cron (or drop entirely until needed)
- [ ] Remove dead Azure Functions references from codebase and workflows
- [ ] **Decide: database or not?**
  - No DB: rely on external APIs + Vercel edge caching
  - Lightweight DB (user prefs, saved routes, auth): Neon or Supabase on top of Vercel
  - Heavy processing: keep Flask + Railway + Postgres
- [ ] Verify monorepo structure makes sense after any package removal (likely `web/`, `app/`, `shared/`)

## Product Decisions

- [ ] **Search scope: ferry-centric or destination-centric?**
  - Option A: Ferry quays only — simpler, focused, faster to build
  - Option B: Any destination with autocomplete — show ferry trips en-route to that destination
  - This decision gates most of the UX and API design work below
- [ ] **Map-based UI or not?**
  - Likely tied to the search scope decision
  - Destination-centric probably benefits more from a map
  - Ferry-centric could work as a pure list/search UI

## Shared Code (`shared/`)

- [ ] Define and stabilise shared TypeScript types used by both `web/` and `app/`
  - Review existing types in `shared/types/index.ts` — are they complete and accurate?
  - Ensure types cover: quays, departures, routes, search results, and any user state
- [ ] Audit shared utils (`formatDuration`, `formatTime`, `calculateDistance`, `debounce`) — keep, remove, or extend
- [ ] Audit shared constants (API endpoints, transport modes, Norwegian regions, cache durations) — align with final infrastructure decisions

## Design

- [ ] Define a common visual profile
  - Color palette (primary, secondary, accent, neutrals, semantic colors)
  - Typography (font families, scale, weights)
  - Core UI elements (buttons, inputs, cards, navigation patterns)
  - Ensure the profile works across both web (Tailwind CSS) and mobile (NativeWind)
