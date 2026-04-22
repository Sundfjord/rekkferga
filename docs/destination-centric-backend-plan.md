---
name: Destination-Centric API Rewrite
overview: Redesign the API to own journey/departure computation for destination-centric flows, so web/mobile clients mostly render server-provided fields and poll a narrow refresh endpoint. Replace existing endpoint contracts in place per your preference, while preserving current UX output semantics.
todos:
  - id: map-current-contracts
    content: Document exact current request/response payloads for /journey and /quay/departures and finalize replacement schema.
    status: pending
  - id: extract-api-domain-layer
    content: Create server-side journey/departure domain services and move canonical timing/via calculations there.
    status: pending
  - id: rewrite-journey-endpoint
    content: Refactor /journey to return fully hydrated destination-centric journeys with ferry data and canonical totals.
    status: pending
  - id: rewrite-departures-endpoint
    content: Refactor /quay/departures into a narrow refresh endpoint returning computed leg/totals patches for polling.
    status: pending
  - id: simplify-web-client
    content: Remove client hydration/orchestration logic and switch web to render-ready responses + lightweight interval refresh.
    status: pending
  - id: validate-observability
    content: Add tests and request-level logging to verify call counts, consistency, and edge-case behavior with Entur/HERE fallback paths.
    status: pending
isProject: false
---

# Destination-Centric Backend-First Plan

## Goals

- Move ferry timing/margin/wait/via calculations from client to API.
- Keep user workflow/layout unchanged (search destination -> journey -> live updates).
- Replace existing contracts in place (`/journey`, `/quay/departures`) while minimizing duplicated logic across web/mobile.

## Current Survey Findings (API + Web)

- `/journey` currently composes Entur trip patterns + HERE enrichment in [packages/api/app.py](packages/api/app.py), [packages/api/journey_planner.py](packages/api/journey_planner.py), [packages/api/here_routing.py](packages/api/here_routing.py).
- `/quay/departures` currently computes leg-specific margins in [packages/api/journey_planner.py](packages/api/journey_planner.py), but web still performs hydration/refresh orchestration in [packages/web/components/Journey.tsx](packages/web/components/Journey.tsx) and [shared/services/tripStateMachine.ts](shared/services/tripStateMachine.ts).
- Client-side complexity hotspots are in [shared/services/journey.ts](shared/services/journey.ts) and [shared/services/tripStateMachine.ts](shared/services/tripStateMachine.ts): per-leg fetch loops, ETA estimation, interval/race guards.
- Shared types/UI still reflect partial hydration assumptions in [shared/types/index.ts](shared/types/index.ts), [packages/web/components/JourneyDetails.tsx](packages/web/components/JourneyDetails.tsx), [packages/web/components/JourneyMap.tsx](packages/web/components/JourneyMap.tsx).

## Target Architecture

```mermaid
flowchart TD
  Search[Search destination] --> JourneyCall[/journey/]
  JourneyCall --> EnturTrip[Entur tripPatterns]
  JourneyCall --> HereCar[HERE per car leg]
  JourneyCall --> DepartureBatch[Server ferry departure batch eval]
  EnturTrip --> JourneyHydrator[Journey hydrator]
  HereCar --> JourneyHydrator
  DepartureBatch --> JourneyHydrator
  JourneyHydrator --> JourneyResponse[Render-ready JourneyResult]
  ClientPoll[Interval poll with current position] --> DepRefresh[/quay/departures/]
  DepRefresh --> DepartureBatch
  DepartureBatch --> DeltaResponse[Updated ferry leg + totals]
```

## Contract Redesign (In-Place)

- `GET /journey`
  - Input unchanged: `from`, `to`.
  - Output becomes fully hydrated for destination-centric UI:
    - Each ferry leg includes: departures, selected departure, wait seconds, via stop(s), reachability metadata.
    - Journey includes canonical: `travelDurationSeconds`, `waitDurationSeconds`, `totalDurationSeconds` (and `duration` aligned to total).
    - Optional server hints for client rendering/polling (e.g. `nextRefreshAt`, `nextFerryLegIndex`).
- `GET /quay/departures`
  - Repurpose from single-leg helper to "refresh active journey ferry data" endpoint.
  - Accept narrow params for interval polling (current position + active leg context + quay IDs).
  - Return normalized leg patch + recomputed totals (not just raw departures).

## API Refactor Design

- Add a dedicated journey-domain service layer under `packages/api/`:
  - `journey_domain.py` (new): canonical hydration pipeline and timing math.
  - `departures_domain.py` (new): batch departure evaluation and via-stop extraction.
- Keep provider adapters isolated:
  - Entur adapter logic from [packages/api/journey_planner.py](packages/api/journey_planner.py).
  - HERE adapter logic from [packages/api/here_routing.py](packages/api/here_routing.py).
  - Nominatim adapter from [packages/api/nominatim.py](packages/api/nominatim.py).
- Normalize naming/model consistency:
  - Replace "quayId" ambiguity with explicit stop-place semantics internally.
  - Keep external param names only if needed for backward route naming.
- Centralize duration/wait recomputation in one function used by both endpoints.

## Web Client Simplification Plan

- Remove client hydration math from [packages/web/components/Journey.tsx](packages/web/components/Journey.tsx):
  - No per-ferry sequential departure fetching on initial load.
  - No client-side cumulative wait/duration recomputation.
- Simplify [shared/services/journey.ts](shared/services/journey.ts):
  - `fetchJourney` returns render-ready journey.
  - `fetchDeparturesForLeg` replaced by a refresh call returning server-computed patch.
- Simplify [shared/services/tripStateMachine.ts](shared/services/tripStateMachine.ts):
  - Keep local proximity-based state transitions.
  - Remove ETA-heavy departure math; polling just sends current context and applies server patch.
- Keep UI components mostly presentational:
  - [packages/web/components/JourneyDetails.tsx](packages/web/components/JourneyDetails.tsx) and [packages/web/components/JourneyMap.tsx](packages/web/components/JourneyMap.tsx) consume hydrated fields directly.

## External API Interaction Strategy

- Entur:
  - Continue as source of truth for ferry schedules and call chains.
  - Batch evaluate all ferry crossings for initial journey hydration.
- HERE:
  - Continue only for car-leg traffic/geometry.
  - Recompute totals after HERE duration replacement using canonical server helper.
- Nominatim:
  - No major contract changes; keep destination search semantics.

## Rollout & Safety

- Implement server-side unit tests around:
  - duration consistency (sum of legs + wait),
  - margin calculation,
  - via-stop extraction,
  - no-ferry and multi-ferry journeys.
- Add API integration fixtures for Entur response variants (`estimatedCalls` present/absent).
- Add web integration checks that one destination selection triggers:
  - one `/journey` call,
  - one scheduled refresh loop (`/quay/departures`) with no duplicate bursts.

## Open Risks To Watch During Implementation

- Entur edge cases where `estimatedCalls` is empty and fallback `passingTimes` lacks stop timing detail.
- Contract stability for existing consumers while replacing endpoint payloads in place.
- Payload growth when returning fully hydrated multi-ferry journeys.
