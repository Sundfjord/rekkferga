# Reflections

## Relevant reading materials

- The written contents in @docs/
- Code in @packages/api/ and @packages/web/

## Today's approach
Previously, I aggressively committed to a destination-centric approach, that lets the user search for destinations. They find and select their destination, and the ferry crossings on the way are determined for them, and margins to the next realistic departures they can reach are calculated. If the destination contains multiple crossings, it will calculate which departure is possible to reach on consecutive crossings, based on previous journey legs. This allows users to find the information they need without knowing by heart which ferry crossings are on the way.

## Challenges
It turns out this approach is difficult to implement in a practical way while keeping a very minimal UI, which is a key design goal. This approach gets complex to visualise in a few concrete and very real scenarios:
- A destination is selected, route A is determined to be the fastest, but that depends on if they can reach the next ferry. If they can't, route B will be faster, but at this point the app has already committed to route A and keeps showing data for that.
- Route A is the only relevant route, but if the users misses a ferry, the rest of the journey will have to be recalculated. If we show two departures at a crossing where the margin to the first is tight, how do we visualise journey travel time?

The more of this journey-specific UI details I need to handle, I lose track of the only real value of the app that no well-known competitors are providing, namely seeing the estimated margin between arrival at the quay and the scheduled departures There are a million apps that deal with travel and routing, and it is important to visually focus on the valuable part of the app.

## Alternatives
Initially in the project, I chose a quay-centric approach, where the user searched for a quay and the app took your position and calculated the margins to the next relevant departures. Data for the ~300 quays were stored in a database, and the data fetching would be a lot simpler as the user would select a quay with a given ID, and we'd simply fetch departures for that quay, and calculate margins based on the quay arrival time. Also, the quay data had coordinate positions, so could be easily displayed on a map. However, we'd lose the simplicity of just having to know the end destination, and the added bonus of getting a well-calculated arrival time at your destination (and total travel time).

## Verdict
Given this information, I need you to help me decide which approach to take, reflect on aspects I might've missed and outline API and UI complexity with the two main options.
