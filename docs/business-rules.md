# Business Rules

The rules that decide what Rekkferga shows. Each section names where the rule lives in the
code; change the code and this file together.

## Margin

The **margin** is the time between when you reach the quay and when the ferry leaves:

```
margin = departure time − estimated arrival at the quay   (whole minutes)
```

- **Departure time** is EnTur's `expectedDepartureTime`: the realtime estimate when the
  operator sends realtime data, otherwise the timetable time.
- **Estimated arrival** is described under *Drive time and arrival* below.
- Positive means time to spare, negative means you'll miss it, `null` means there is no
  arrival estimate (no position, or routing failed).
- **Rounding**: always down, in both the API and the web app, so a 30-second miss is −1, never
  0.

Displayed margins are recomputed in the browser from one shared drive time and one shared
clock (ticking every 15 s), so favourites, the quay overview and drive mode always show the
same number, and it counts down between polls instead of jumping.

*Code*: `withLiveMargins` (`packages/web/lib/departures.ts`), `useNow`,
`compute_margin_minutes` (`packages/api/journey_planner.py`).

## Margin colours

| Margin | Tier | Colour |
|---|---|---|
| more than 5 min | safe | green |
| 0 to 5 min | tight | yellow |
| below 0 | missed | red |
| unknown (no arrival estimate) | none | blue |

*Code*: `marginTier` (`shared/utils/index.ts`), `tierOf` / `TIER_COLOR`
(`packages/web/lib/departures.ts`), colours `--margin-*` in `globals.css`.

## Which departures are shown

- **Visibility window**: a departure stays in the list while its margin is **−5 min or
  better**. At −6 or worse it is dropped. A few minutes late may still be catchable (you hurry,
  the ferry is slightly late); hiding too early creates needless stress, too late is
  misleading.
- The API applies this when it builds the list (it also starts its EnTur query 5 minutes
  before the estimated arrival), and the web app applies it again as margins tick down, so a
  departure disappears the moment it passes −5 rather than at the next poll. If it was open in
  drive mode, the view returns to the departure list.
- **How many**: the quay view fetches 5 departures (12 for quays with several crossings, so
  each crossing still has some after filtering) and shows at most 5.
- **Next reachable departure**: the first departure with a margin of 0 or more; if there is
  none, the first departure. Favourites show this one, and the API marks it as
  `selectedDeparture`.

*Code*: `_VISIBILITY_THRESHOLD_MINUTES = -5` and `select_departure`
(`packages/api/departures_domain.py`), `DEPARTURE_VISIBILITY_MINUTES` (`shared/utils/index.ts`),
`withLiveMargins` and `nextReachable` (`packages/web/lib/departures.ts`),
`VISIBLE_DEPARTURES` (`QuayPanel.tsx`).

## Destinations

- Each departure is labelled with its **end destination** (the last stop of the trip), plus
  "via …" for any stops on the way.
- Quay names drop the suffix "ferjekai", "fergekai", "ferjeleie" or "fergeleie" when shown.
- Searching for a **place** opens the first ferry quay on the fastest route there, filtered to
  the crossing that route takes. (The crossing filter buttons are currently hidden; the filter
  from a place search still applies.)

*Code*: `_resolve_route` (`departures_domain.py`), `shortQuayName` (`packages/web/lib/quays.ts`),
`selectPlace` (`app/page.tsx`), `servesQuay` (`lib/departures.ts`).

## Plan B

When the chosen departure is **tight or missed** (margin 5 min or less), drive mode offers
Plan B: the next later departure with a margin of 0 or more. No Plan B when the choice is
green, has no margin, or nothing later can be reached.

*Code*: `planB` (`packages/web/lib/departures.ts`).

## Drive time and arrival

- **Drive time** comes from HERE Routing with live traffic, from the user's current position
  to the quay. One drive time per quay is shared by every view.
- **Position** is followed continuously while the page is open. Lists that re-sort or
  re-fetch (favourites, place search) only react after a move of 1 km.
- **Refresh**: while a quay is open, its drive time is checked every 20 s and fetched again
  when it is older than 3 minutes, or older than 1 minute and the user has moved more than
  300 m since it was measured. Favourites fetch drive times every 2 minutes and after a 1 km
  move.
- **Estimated arrival**: standing still, it is *now + drive time*. Once the user has moved more
  than 150 m since the drive time was measured, they're on the way, so the arrival stays at
  *time of measurement + drive time* instead of sliding forward with the clock. The displayed
  drive time is the time left until that arrival.

*Code*: `usePosition`, `useDriveTimes` (`isFresh`, `estimateArrival`), `useQuayDepartures`,
`useFavoriteNext` (`packages/web/hooks/`).

## Traffic

HERE also returns the drive time with the traffic usual for this weekday and time. The delay
is *drive time − usual drive time*, and the thresholds scale with the trip:

| Level | Delay |
|---|---|
| normal (green) | less than 10% of the usual drive time, or less than 2 min |
| moderate (yellow) | from 10%, at least 2 min |
| heavy (red) | from 25%, at least 5 min |

Examples: an 8-minute trip turns yellow at +2 min and red at +5; a 1-hour trip at +6 and +15;
a 3-hour trip at +18 and +45. Faster than usual counts as normal. Without a usual drive time
there is no traffic level. The level colours the drive time figure and the dot in the status
line under it.

*Code*: `trafficLevel` (`shared/utils/index.ts`), `get_drive_time` (`packages/api/here_routing.py`),
`LiveStatus`.

## Realtime departure times

When a departure has realtime data (`realtime: true`) and the realtime time differs from the
timetable time **to the minute**, the timetable time is shown struck through and dimmed, with
the realtime time next to it. Smaller differences are ignored.

*Code*: `DepartureTime` (`packages/web/components/DepartureTime.tsx`).

## Refresh rate of departures

The open quay's departures are polled more often as the margin of the next reachable
departure gets tighter:

| Margin | Next poll |
|---|---|
| unknown | 2 min |
| 10 min or more | 3 min |
| 3 to 9 min | 90 s |
| −5 to 2 min | 30 s |
| below −5 | 3 min |
| after a failed request | 30 s |

A failed refresh keeps the last departures on screen with a notice that they may be out of
date. Failures are always shown as errors, never as "no results".

*Code*: `getRefreshIntervalMs` (`packages/web/hooks/useQuayDepartures.ts`).

## Suggested quays

The home page suggests up to three quays near the user:

- **Proximity**: only quays within 130 km (straight line). Within that, the score halves at
  60 km.
- **Popularity**: average departures per day (out of 60, squared, so the big trunk crossings
  clearly beat small local ferries) times a road-class weight: European road 1.0, national
  0.8, county 0.6, municipal 0.5.
- **Near end only**: a quay is skipped when the quay at the other end of one of its crossings
  is closer to the user, so only the side you'd depart from is suggested (from Bergen:
  Oppedal, not Lavik).
- **Favourites** are never suggested, but still count as the near end of their crossing, so
  favouriting Oppedal never makes Lavik appear.
- A quay needs a minimum score (0.08), so remote areas get fewer suggestions or none.

Daily departure counts come from EnTur (an average over the coming week) and are refreshed
monthly with the quay snapshot.

*Code*: `suggestQuays` / `quayPopularity` (`shared/utils/suggestions.ts`),
`packages/api/scripts/refresh_quays.py`, `packages/api/data/quay_departures.json`.

## Favourites

- At most 20 favourites, stored in the browser.
- On page load the favourites are fetched once the position is known (or denied, or after 8 s
  without an answer), so the first answer already has drive times and margins. Until it is in,
  each favourite shows as a skeleton card.
- A favourite that matches a quay opens that quay. Older favourites saved as places (from
  before the app became quay-centric) are resolved like a place search.
- The batch endpoint for favourites (`/quays/next`) accepts at most 20 quays, matching the
  favourite limit.

*Code*: `MAX_FAVORITES` (`shared/utils/favorites.ts`), `MAX_NEXT_QUAYS` (`packages/api/app.py`),
`useFavoriteNext`, `usePosition` (`settled`), `HomeLists`.
