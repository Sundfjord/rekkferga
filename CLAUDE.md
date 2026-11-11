# CLAUDE.md

Rekkferga is a ferry journey planner for Norway. npm-workspaces monorepo:

| Package | Stack | Deploys to |
|---|---|---|
| `packages/web` | Next.js 15, React 19, App Router, Tailwind v4, Leaflet | Vercel |
| `packages/app` | Expo 54, React Native 0.81, Expo Router, NativeWind | EAS Build |
| `packages/api` | Flask (Python, `.venv`) | Railway (Docker) |
| `packages/cron` | Azure Functions skeleton — unused; quay refresh runs in GitHub Actions | Azure |
| `shared/` | TS `types/`, `utils/`, `services/`, `locales/` (en, no, nn) | — |

Status, phase plan and resume protocol: `docs/implementation-plan.md` (authoritative).

## Commands

Run from the **repo root** (root `package.json` holds the workspace scripts):

```bash
npm run dev:api    # Flask on :5000 (no auto-reload — restart after API edits)
npm run dev:web    # Next.js on :3000
npm run dev:app    # Expo
npm run test:shared  # vitest over shared/**/*.test.ts
npm run test:api | test:web | test:app | test:all
npm run lint:web | lint:app
```

Type-check web: `cd packages/web && npx tsc --noEmit -p .`

## Local setup

- Web reads the API from `NEXT_PUBLIC_API_URL` in `packages/web/.env.local` (`http://localhost:5000` locally; a Tailscale/LAN IP for phone testing). `NEXT_PUBLIC_*` is inlined at dev-server start — restart `dev:web` after changing it.
- API needs `HERE_API_KEY` in `packages/api/.env`.

## Architecture

**Quay-centric**: the user picks a ferry quay (or a destination, resolved to the first ferry quay on the route) and sees the margin between their estimated arrival and upcoming departures.

API endpoints:
- `GET /quays` — committed Vegvesen NVDB snapshot (`packages/api/data/quays.json`, ~366 quays). `id` = EnTur NSR stop-place id; `relatedQuayIds` = destination quays. Refreshed monthly by `.github/workflows/refresh-quays.yml` → `scripts/refresh_quays.py`.
- `GET /quay/route` — HERE Routing drive duration + road geometry.
- `GET /quay/departures` — live from EnTur, margins computed, labeled by destination quay. `arrivalTime` optional (omitted → no margins).
- `GET /search` — EnTur geocoder autocomplete (`geocoder.py`), Nominatim fallback only on zero hits.
- `GET /journey` — only used to resolve a destination to its first ferry quay.
- No database: quays are the snapshot, departures are always live.

Web (`packages/web`, alias `@/*` → `packages/web/*`, `@shared/*` → `shared/*`):
- `app/page.tsx` — map + `SearchOverlay` / `MarginPanel` orchestration.
- `components/MarginPanel.tsx` — one container, two modes: Overview (`DepartureTimeline`, `DepartureCard`s) and Drive mode (`DriveMode`) for a picked departure. Tier logic, Plan B and departure identity live in `lib/departures.ts`; tier colours are `--margin-{safe,tight,missed,none}` in `globals.css`.
- `hooks/useQuayDepartures.ts` — route fetch + margin-adaptive departure polling; exposes `arrivalAt`.
- `hooks/useQuays.ts` — quay dataset, cached in localStorage.

Mobile (`packages/app`, alias `@/*` → `packages/app/*`) is **not yet migrated** to quay-centric; it still uses `shared/services/{journey,tripStateMachine}.ts` and the legacy `toQuayId`/`mode=refresh` departures path — keep those until mobile is ported.

## Conventions

- Prefer types from `shared/types/index.ts` over local definitions.
- User-facing strings go in all three `shared/locales/*.json` (nn falls back to no, then en). Locale-aware formatting helpers take a `Language` argument (e.g. `formatDuration(seconds, language)`).
- CI/CD secrets: `.github/SETUP_GITHUB_SECRETS.md`.
