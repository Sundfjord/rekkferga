# CLAUDE.md

Rekkferga is a ferry journey planner for Norway. npm-workspaces monorepo:

| Package | Stack | Deploys to |
|---|---|---|
| `packages/web` | Next.js 15, React 19, App Router, Tailwind v4 (no map), static export | Cloudflare Worker, static assets (`wrangler.jsonc`, `rekkferga.no`) |
| `packages/app` | Expo 54, React Native 0.81, Expo Router, NativeWind — outdated, to be rebuilt to match web | — (not deployed) |
| `packages/api` | Flask (Python, `.venv`) | Railway (Docker) |
| `packages/cron` | Azure Functions skeleton — unused; quay refresh runs in GitHub Actions | Azure |
| `shared/` | TS `types/`, `utils/`, `services/`, `locales/` (en, no, nn) | — |

Business rules (e.g. the departure visibility window): `docs/business-rules.md`.

## Commands

Run from the **repo root** (root `package.json` holds the workspace scripts):

```bash
npm run dev:api    # Flask on :5000 (no auto-reload — restart after API edits)
npm run dev:web    # Next.js on :3000
npm run dev:app    # Expo
npm run check        # shared tests (vitest) + web lint + web type-check
npm run test:shared  # vitest over shared/ and packages/web/{lib,hooks} (pure logic)
npm run typecheck:web
npm run lint:web
```

First-time setup: `./scripts/setup.sh`. The API has no automated tests yet.

## Local setup

- Web reads the API from `NEXT_PUBLIC_API_URL` in `packages/web/.env.local` (`http://localhost:5000` locally; a Tailscale/LAN IP for phone testing). `NEXT_PUBLIC_*` is inlined at dev-server start — restart `dev:web` after changing it.
- API needs `HERE_API_KEY` in `packages/api/.env`.

## Architecture

**Quay-centric**: the user picks a ferry quay (or a destination, resolved to the first ferry quay on the route) and sees the margin between their estimated arrival and upcoming departures.

API endpoints:
- `GET /quays` — committed Vegvesen NVDB snapshot (`packages/api/data/quays.json`, ~366 quays). `id` = EnTur NSR stop-place id; `relatedQuayIds` = destination quays; `roadCategory` (E/R/F/K) and `dailyDepartures` (from `data/quay_departures.json`, EnTur, average over a week) feed the quay suggestions. Both files are refreshed monthly by `.github/workflows/refresh-quays.yml` → `packages/api/scripts/refresh_quays.py`.
- `GET /quay/route` — HERE Routing traffic-aware drive duration plus the usual-traffic duration (`{durationSeconds, typicalDurationSeconds}`); clients rate traffic with `trafficLevel` in `shared/utils`.
- `GET /quays/next?ids=…&from=lat,lng` — batch: next few departures + drive time per quay (the user's favourites), fetched in parallel.
- `GET /quay/departures` — live from EnTur, margins computed, labeled by destination quay. `arrivalTime` optional (omitted → no margins); `limit` 1–12 (default 4).
- `GET /search` — EnTur geocoder autocomplete (`geocoder.py`), Nominatim fallback only on zero hits.
- `GET /journey` — only used to resolve a destination to its first ferry quay.
- No database: quays are the snapshot, departures are always live.

Web (`packages/web`, alias `@/*` → `packages/web/*`, `@shared/*` → `shared/*`):
- `app/page.tsx` — map-free "ferry board": a search pane (title and search field as the page header, then `HomeLists` = live favourites, or `SearchResults` = quays + places) and a quay pane (`QuayPanel`). One pane at a time at every width, in a centred `max-w-3xl` column (the header aligns to it). The blue app `Header` (logo, language, theme, help dropdown → `HelpPanel`) sits on top; there is no band below it. `SeaBackground` is a decorative layer behind both panes (`--deco-*` tokens); the start page deliberately has no nearby-quay list so it shows. Below the field: "Suggested for you" chips (`suggestQuays` in `shared/utils/suggestions.ts`: proximity × popularity, skipping the far end of a crossing and existing favourites) and the favourites. The title stays put while searching.
- `components/QuayPanel.tsx` — a header row (back, quay name, favourite); below it cards with drive time + arrival and traffic, a crossing filter (multi-crossing quays) and `DepartureCard`s; tapping a card switches to `DriveMode`. Tier logic, Plan B and departure identity live in `lib/departures.ts`; tier colours are `--margin-{safe,tight,missed,none}` in `globals.css`.
- `hooks/usePosition.ts` follows the user (`watchPosition`): `position` per fix, a coarse `location` that moves only after ~1 km (re-sorts/re-fetches key off it), `getPosition` for polls. `hooks/useDriveTimes.ts` — one drive time per quay shared by all views, each with where/when it was measured; the quay view re-fetches it when >3 min old or >1 min old after a 300 m move (`isFresh`). `estimateArrival` keeps the arrival fixed once the user is on the way. Displayed margins are recomputed client-side from that arrival and one shared `useNow` clock (`withLiveMargins` in `lib/departures.ts`), so every view shows the same numbers. Traffic vs usual (`trafficLevel`) colours the drive time in the quay view; `LiveStatus` below it combines traffic and the last update time.
- `hooks/useQuayDepartures.ts` — margin-adaptive departure polling for the selected quay; refreshes the shared drive time when stale.
- `hooks/useQuays.ts` — quay dataset, cached in localStorage.

Mobile (`packages/app`, alias `@/*` → `packages/app/*`) is **outdated and will be rebuilt to match the web app 1:1**. Nothing in `shared/` or the API is kept for it: code it depended on (the multi-leg trip state machine, legacy single-crossing departures, its strings) has been removed, so it does not currently compile. Don't add app-only code to `shared/` or the API; port the app onto the web's hooks/services instead.

## Conventions

- Prefer types from `shared/types/index.ts` over local definitions.
- User-facing strings go in all three `shared/locales/*.json`, nested by group (`general`, `favorites`, `search`, `home`, `quay`, `drive`) and addressed by dotted path: `t("quay.driveTime")`; lists via `t.list("drive.rush.4to6")` (web) / `i18n.list(...)` (app). Fallback nn → no → en per key (`translate`/`translateList` in `shared/utils`). Put broadly reusable words in `general`. Locale-aware formatting helpers take a `Language` argument (e.g. `formatDuration(seconds, language)`).
- Deployment and secrets: `.github/SETUP_GITHUB_SECRETS.md`. Main branch is `master`. The web build is a static export (`output: "export"` in `next.config.ts`) — no server-only Next.js features (API routes, server actions, image optimisation).
