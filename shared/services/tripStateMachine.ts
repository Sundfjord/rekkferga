import type { JourneyResult, FerryLeg, CarLeg, DepartureOption } from '../types';
import type { TripState } from '../types';
import { calculateDistance, QUAY_PROXIMITY_KM, DESTINATION_PROXIMITY_KM } from '../utils';
import { estimateRemainingSeconds, fetchDeparturesForLeg } from './journey';

export interface TripStateRefs {
  journey: JourneyResult | null;
  currentLegIndex: number;
  tripState: TripState;
}

export interface TripStateCallbacks {
  setTripState: (state: TripState) => void;
  setCurrentLegIndex: (index: number) => void;
  addCompletedLeg: (index: number) => void;
  updateJourneyDepartures: (legIndex: number, departures: DepartureOption[]) => void;
}

export function processPosition(
  lat: number,
  lng: number,
  refs: TripStateRefs,
  callbacks: TripStateCallbacks,
): void {
  const currentJourney = refs.journey;
  if (!currentJourney) return;

  const legs = currentJourney.legs;
  let legIndex = refs.currentLegIndex;
  const state = refs.tripState;

  // Check final destination arrival
  const lastLeg = legs[legs.length - 1];
  if (
    lastLeg?.toPlace.latitude != null &&
    lastLeg?.toPlace.longitude != null &&
    calculateDistance(lat, lng, lastLeg.toPlace.latitude, lastLeg.toPlace.longitude) < DESTINATION_PROXIMITY_KM
  ) {
    callbacks.setTripState("arrived");
    return;
  }

  if (legIndex >= legs.length) return;
  const currentLeg = legs[legIndex];

  if (currentLeg.mode === "car") {
    const nextLeg = legs[legIndex + 1];
    const targetLat = nextLeg?.fromPlace.latitude ?? currentLeg.toPlace.latitude;
    const targetLng = nextLeg?.fromPlace.longitude ?? currentLeg.toPlace.longitude;
    if (targetLat != null && targetLng != null) {
      if (calculateDistance(lat, lng, targetLat, targetLng) < QUAY_PROXIMITY_KM) {
        const newIndex = legIndex + 1;
        callbacks.addCompletedLeg(legIndex);
        callbacks.setCurrentLegIndex(newIndex);
        const nextState: TripState = nextLeg?.mode === "water" ? "at_quay" : "driving_to_quay";
        callbacks.setTripState(nextState);
        legIndex = newIndex;
      }
    }
  }

  if (legIndex < legs.length && legs[legIndex].mode === "water") {
    const ferryLeg = legs[legIndex] as FerryLeg;
    if (state === "at_quay") {
      const firstDep = ferryLeg.departures?.[0];
      if (firstDep && new Date(firstDep.expectedDepartureTime).getTime() < Date.now()) {
        callbacks.setTripState("crossing");
      }
    }
    if (state === "crossing" && ferryLeg.toPlace.latitude != null && ferryLeg.toPlace.longitude != null) {
      if (calculateDistance(lat, lng, ferryLeg.toPlace.latitude, ferryLeg.toPlace.longitude) < QUAY_PROXIMITY_KM) {
        const newIndex = legIndex + 1;
        callbacks.addCompletedLeg(legIndex);
        callbacks.setCurrentLegIndex(newIndex);
        const nextState: TripState = newIndex < legs.length ? "driving_to_quay" : "arrived";
        callbacks.setTripState(nextState);
      }
    }
  }
}

export async function refreshDepartures(
  apiUrl: string,
  currentJourney: JourneyResult,
  legIndex: number,
  lat: number,
  lng: number,
  updateJourneyDepartures: (legIndex: number, departures: DepartureOption[]) => void,
): Promise<void> {
  const legs = currentJourney.legs;
  for (let i = legIndex; i < legs.length; i++) {
    if (legs[i].mode !== "water") continue;
    const ferryLeg = legs[i] as FerryLeg;
    if (!ferryLeg.fromQuayId) continue;

    let remainingMs = 0;
    for (let j = legIndex; j < i; j++) {
      if (legs[j].mode === "car") {
        remainingMs += j === legIndex
          ? estimateRemainingSeconds(legs[j] as CarLeg, lat, lng) * 1000
          : legs[j].duration * 1000;
      }
    }

    const arrivalTime = new Date(Date.now() + remainingMs).toISOString();
    const departures = await fetchDeparturesForLeg(apiUrl, ferryLeg, arrivalTime);
    updateJourneyDepartures(i, departures);
    break; // only refresh the nearest upcoming ferry
  }
}
