# Tasks

## Ferry not found

When the journey to a destination does not involve a ferry trip, the app should show a dedicated component for this case, expressing the sadness of not being able to travel by ferry. Maybe some sort of animation where the ferry in the logo sinks into the water?

## Favorites on the landing page

To save the user a tap, the landing page should show a list of favorite destinations, instead of only appearing when the user taps the search bar.

## Include street number in search results

Typing a street number behind a street should yield that exact address, rather than just the street. The search should provide ability to autofill the street and then start typing the number, like in Google Maps.

## Adjustments to margin badge element

The margin badge layout should be tweaked both in QuayCard, JourneyDetails and JourneyMap. It should employ a "two-row, two-column" layout, with translated "Departure" string above the departure time, and "Margin" string above the margin. This should be consistent across margin badge instances.

## Show driving time delays

Investigate whether the HERE API can provide driving time delays and/or delay reason for a given route. If so, the app should show the delays in the journey map using green-yellow-red paradigm, similar to Google Maps. Consider showing reason for delay or just generic delay texts next to or below the minute number.

## Quality check tripPatterns call

We need to make sure that the call to Entur's API via the "trip" input type are sane results.
1) Check that the most sensible tripPattern is returned, based on a set of criteria. Ask for criteria before starting.
3) Investigate the scenario where the user arrives after the last departure of a crossing, and needs to wait many hours for the next departure. The journey data seems to ignore the many hours of waiting time, and calculates a much shorter duration than the arrival time indicates.
2) For certain destinations, the returned tripPatterns does not include a ferry leg, even though the route clearly requires a ferry trip.

## Footer animation

The page needs some "spice". Add a footer to the page, with the ferry in the logo animated back and forth across the screen between two quays in SVG format. The animation should be looped, and the footer should be positioned below the viewport height. The footer should have a "water" color, and the ferry should drive on top of the water.

## Trip state machine local testing facilitation

We need to make sure that the trip state machine is working as intended. We need a convenient, reproducable way to simulate movement along the route, and to verify that the state machine is correctly updating the trip state.

## Discovery: Potential realtime tracking of the ferries operating the route

Entur has an API for realtime tracking of the ferries operating the route, but their position seems to be updated too infrequently to be useful. Does other providers have useful, free/cost-efficient realtime tracking APIs? This could provide value to the map, where users could see the ferry position on the map, adding to the "suspense" of trying to reach the ferry.

## Accessibility QA

We need to make sure that the app is accessible to all users. The app should be tested with a screen reader and keyboard-only. Contrast ratios need to be checked.

## Localise QuayCard

QuayCard currently uses hardcoded English strings ("Drive to quay", "View full journey", "No departures available", "margin"). These need translation keys added to all three locale files and `useTranslation` wired into the component, consistent with the rest of the web app.

## Adaptive GPS refresh rate

The departure refresh that fires on each GPS position update currently runs on every position event regardless of proximity to the quay. The refresh rate should increase as the user gets closer to the quay — low frequency when far, high frequency when nearby. This reduces unnecessary API calls while ensuring margin accuracy when it matters most.
