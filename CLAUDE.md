# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rekkferga is a ferry journey planning platform for Norway. It is a monorepo (npm workspaces) with:
- **Web**: Next.js 15 / React 19 → deployed to Vercel
- **App**: Expo / React Native → deployed via EAS Build
- **API**: Flask (Python) skeleton → deployed to Railway
- **Cron**: Azure Functions skeleton → deployed to Azure

Shared TypeScript types, utilities, and constants live in `shared/`.

## Commands

All commands are run from the **root** of the monorepo (where the root `package.json` is — inside `packages/`):

```bash
# Development
npm run dev:web        # Next.js on :3000
npm run dev:app        # Expo dev server
npm run dev:api        # Flask on :5000
npm run dev:all        # All services concurrently

# Build
npm run build:web
npm run build:app      # EAS build (iOS/Android)
npm run build:api      # Docker build

# Test
npm run test:web       # Jest
npm run test:app       # Jest
npm run test:api       # pytest
npm run test:all

# Lint
npm run lint:web
npm run lint:app
npm run lint:all
```

> **Note**: The root `package.json` (workspace config) is at `packages/package.json`, not the repo root. Run `cd packages && npm run <command>` or ensure you're in the right directory.

## Architecture

### Monorepo Layout

```
packages/
  web/     # Next.js 15, App Router, Tailwind CSS v4, Leaflet maps
  app/     # Expo 53 + React Native 0.79, Expo Router, NativeWind
  api/     # Flask backend
  cron/    # Azure Functions (skeleton) — NOTE: quay-snapshot refresh now runs via the
           # GitHub Actions workflow refresh-quays.yml, not this package.
shared/
  types/   # Shared TypeScript interfaces (QuayDetails, Departure, Route, etc.)
  utils/   # formatDuration, formatTime, calculateDistance, debounce, etc.
  constants/ # API endpoints, transport modes, Norwegian regions, cache durations
infrastructure/
  docker-compose.yml  # Local multi-service dev environment
```

### Data Flow

The app is **quay-centric**: users search/select a ferry quay (or a destination, which resolves to its first ferry quay) and see the margin between their estimated arrival at the quay and the upcoming departures.

Frontend apps call the Flask API (URL configured via environment variables: `localhost:5000` in dev, `api.rekkferga.com` in prod). The API serves:
- **Quays** (`GET /quays`) from a committed JSON snapshot of Vegvesen NVDB (`packages/api/data/quays.json`, ~366 quays). Each quay `id` is the EnTur NSR stop-place id. Refreshed monthly by a GitHub Actions workflow (`.github/workflows/refresh-quays.yml` → `scripts/refresh_quays.py`).
- **Departures** (`GET /quay/departures`) live from EnTur, with computed margins, labeled by destination quay.
- **Drive routing** (`GET /quay/route`) via the HERE Routing API (traffic-aware duration + road-snapped geometry).

There is no Cosmos DB — quay data is the committed snapshot; departures are always fetched live.

### Key Patterns

**Web (`packages/web/`)**: App Router with file-based routing. Theme support via `next-themes`. Maps via Leaflet. Import alias: `@/*` → `packages/web/src/*`.

**Mobile (`packages/app/`)**: Expo Router (typed routes). Theme + language via React Context. NativeWind for styling. Drawer navigation. 27 reusable components in `components/`, 5 custom hooks in `hooks/`. Import alias: `@/*` → repo root.

**Shared types**: Always prefer types from `shared/types/index.ts` over defining locally to avoid duplication across web/mobile.

### Deployment

| Package | Platform |
|---------|----------|
| Web | Vercel |
| App | EAS Build |
| API | Railway (Docker container) |
| Quay refresh | GitHub Actions (`refresh-quays.yml`, monthly) |

CI/CD via GitHub Actions (`.github/workflows/`). Secrets required — see `.github/SETUP_GITHUB_SECRETS.md`.
