# Business Rules

## Departure visibility window

A departure is shown in the UI as long as its margin is **-5 minutes or better** (i.e. `marginMinutes >= -5`). A departure with a margin of -6 minutes or worse is removed from the UI entirely.

**Rationale**: A few minutes of negative margin may still be catchable in practice (e.g. the user is running, the ferry is slightly delayed). Hiding too early creates unnecessary anxiety; hiding too late is misleading. -5 min is the agreed cut-off.

**Implementation**: `DEPARTURE_HIDE_THRESHOLD_MINUTES = -6` in `shared/utils/index.ts`. Both `selectDeparturesForDisplay` (web) and `nextReachable` (app) enforce this threshold. Do not add a tighter filter elsewhere.
