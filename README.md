# Rekkferga

Ferry departures for Norway, shown against your drive time. Pick a ferry quay (or a place,
which resolves to the first ferry quay on the route there) and see how much margin you have
for each upcoming departure.

Production address: **https://rekkferga.no**.

## Repository

npm-workspaces monorepo:

| Path | What | Stack |
|---|---|---|
| `packages/web` | Web app | Next.js 15 (static export), React 19, Tailwind CSS v4 |
| `packages/api` | API | Flask (Python), served by gunicorn in production |
| `packages/app` | Mobile app — not yet updated to the current design, not deployed | Expo / React Native |
| `shared/` | Code shared by web and app: `types/`, `utils/`, `services/`, `locales/` (en, no, nn) | TypeScript |
| `docs/business-rules.md` | Business rules, e.g. which departures are shown | |

### Data sources

- **Quays** — a committed snapshot of Vegvesen NVDB (`packages/api/data/quays.json`), refreshed
  monthly by the `refresh-quays.yml` workflow (`packages/api/scripts/refresh_quays.py`).
- **Departures** — live from Entur.
- **Drive times** — HERE Routing API (traffic-aware).
- **Place search** — Entur geocoder, with Nominatim as fallback.

There is no database.

## Local development

Requires Node.js 18.18+ and Python 3.11+.

```bash
npm install

# API
cd packages/api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then set HERE_API_KEY
cd ../..

npm run dev:api             # Flask on http://localhost:5000 (no auto-reload)
npm run dev:web             # Next.js on http://localhost:3000
```

The web app reads the API address from `NEXT_PUBLIC_API_URL` in `packages/web/.env.local`
(`http://localhost:5000` locally). It is read when the dev server starts.

Checks:

```bash
npm run test:shared                          # vitest over shared/**/*.test.ts
npm run lint:web
cd packages/web && npx tsc --noEmit -p .     # type-check
```

## Deployment

Both parts deploy from the `master` branch.

| Part | Host | Address |
|---|---|---|
| Web | Cloudflare Pages — builds `packages/web` to static files (`out/`) | https://rekkferga.no |
| API | Railway — Docker image from `packages/api`, deployed by `.github/workflows/api-deploy.yml` | https://api.rekkferga.no |

DNS is on Cloudflare; the domain is registered at GoDaddy. Required secrets, variables and
service settings are listed in [`.github/SETUP_GITHUB_SECRETS.md`](.github/SETUP_GITHUB_SECRETS.md).
