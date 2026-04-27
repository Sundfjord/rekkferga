import { describe, it, expect, vi, beforeEach } from "vitest";
import { processPosition } from "../tripStateMachine";
import type { TripStateRefs, TripStateCallbacks } from "../tripStateMachine";
import type { JourneyResult, CarLeg, FerryLeg } from "../../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// 0.2 km proximity threshold. Offset by 0.001° lat (~111m) to place inside,
// or 0.005° lat (~556m) to place clearly outside.
const INSIDE = 0.001;
const OUTSIDE = 0.005;

const QUAY_LAT = 62.47;
const QUAY_LNG = 6.15;
const DEST_LAT = 62.60;
const DEST_LNG = 6.25;
const FAR_LAT = 62.40;
const FAR_LNG = 6.05;

function makeCarLeg(fromLat: number, fromLng: number, toLat: number, toLng: number): CarLeg {
  return {
    mode: "car",
    duration: 600,
    distance: 5000,
    fromPlace: { name: "Start", latitude: fromLat, longitude: fromLng },
    toPlace: { name: "Quay approach", latitude: toLat, longitude: toLng },
  };
}

function makeFerryLeg(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  departureIso: string,
  fromQuayId = "NSR:Quay:100",
): FerryLeg {
  return {
    mode: "water",
    duration: 1800,
    distance: 8000,
    fromQuayId,
    toQuayId: "NSR:Quay:200",
    fromPlace: { name: "From Quay", latitude: fromLat, longitude: fromLng },
    toPlace: { name: "To Quay", latitude: toLat, longitude: toLng },
    departures: [
      {
        serviceJourneyId: "sj-1",
        expectedDepartureTime: departureIso,
        marginMinutes: 10,
      },
    ],
  };
}

function makeCallbacks(): TripStateCallbacks {
  return {
    setTripState: vi.fn(),
    setCurrentLegIndex: vi.fn(),
    addCompletedLeg: vi.fn(),
    updateJourneyDepartures: vi.fn(),
  };
}

function makeRefs(
  journey: JourneyResult,
  tripState: TripStateRefs["tripState"] = "driving_to_quay",
  currentLegIndex = 0,
): TripStateRefs {
  return { journey, currentLegIndex, tripState };
}

const pastIso = new Date(Date.now() - 60_000).toISOString();
const futureIso = new Date(Date.now() + 60_000).toISOString();

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("processPosition — null journey", () => {
  it("does nothing when journey is null", () => {
    const cbs = makeCallbacks();
    processPosition(QUAY_LAT, QUAY_LNG, { journey: null, currentLegIndex: 0, tripState: "driving_to_quay" }, cbs);
    expect(cbs.setTripState).not.toHaveBeenCalled();
  });
});

describe("processPosition — final destination", () => {
  it("transitions to arrived when within destination proximity", () => {
    const journey: JourneyResult = {
      legs: [makeCarLeg(FAR_LAT, FAR_LNG, DEST_LAT, DEST_LNG)],
      expectedEndTime: futureIso,
      duration: 600,
    };
    const cbs = makeCallbacks();
    // Stand right at the destination
    processPosition(DEST_LAT + INSIDE, DEST_LNG, makeRefs(journey), cbs);
    expect(cbs.setTripState).toHaveBeenCalledWith("arrived");
  });

  it("does not trigger arrived when far from destination", () => {
    const journey: JourneyResult = {
      legs: [makeCarLeg(FAR_LAT, FAR_LNG, DEST_LAT, DEST_LNG)],
      expectedEndTime: futureIso,
      duration: 600,
    };
    const cbs = makeCallbacks();
    processPosition(FAR_LAT, FAR_LNG, makeRefs(journey), cbs);
    expect(cbs.setTripState).not.toHaveBeenCalledWith("arrived");
  });
});

describe("processPosition — car leg → quay proximity", () => {
  it("advances to at_quay when car leg reaches next ferry leg fromPlace", () => {
    const ferryLeg = makeFerryLeg(QUAY_LAT, QUAY_LNG, DEST_LAT, DEST_LNG, futureIso);
    const journey: JourneyResult = {
      legs: [makeCarLeg(FAR_LAT, FAR_LNG, QUAY_LAT, QUAY_LNG), ferryLeg],
      expectedEndTime: futureIso,
      duration: 2400,
    };
    const cbs = makeCallbacks();
    // Position just inside quay proximity
    processPosition(QUAY_LAT + INSIDE, QUAY_LNG, makeRefs(journey, "driving_to_quay", 0), cbs);
    expect(cbs.addCompletedLeg).toHaveBeenCalledWith(0);
    expect(cbs.setCurrentLegIndex).toHaveBeenCalledWith(1);
    expect(cbs.setTripState).toHaveBeenCalledWith("at_quay");
  });

  it("does not advance when still far from quay", () => {
    const ferryLeg = makeFerryLeg(QUAY_LAT, QUAY_LNG, DEST_LAT, DEST_LNG, futureIso);
    const journey: JourneyResult = {
      legs: [makeCarLeg(FAR_LAT, FAR_LNG, QUAY_LAT, QUAY_LNG), ferryLeg],
      expectedEndTime: futureIso,
      duration: 2400,
    };
    const cbs = makeCallbacks();
    processPosition(FAR_LAT, FAR_LNG, makeRefs(journey, "driving_to_quay", 0), cbs);
    expect(cbs.setTripState).not.toHaveBeenCalled();
  });
});

describe("processPosition — at_quay → crossing", () => {
  it("transitions to crossing when departure time has passed", () => {
    const ferryLeg = makeFerryLeg(QUAY_LAT, QUAY_LNG, DEST_LAT, DEST_LNG, pastIso);
    const journey: JourneyResult = {
      legs: [ferryLeg],
      expectedEndTime: futureIso,
      duration: 1800,
    };
    const cbs = makeCallbacks();
    processPosition(QUAY_LAT, QUAY_LNG, makeRefs(journey, "at_quay", 0), cbs);
    expect(cbs.setTripState).toHaveBeenCalledWith("crossing");
  });

  it("stays at_quay when departure time has not yet passed", () => {
    const ferryLeg = makeFerryLeg(QUAY_LAT, QUAY_LNG, DEST_LAT, DEST_LNG, futureIso);
    const journey: JourneyResult = {
      legs: [ferryLeg],
      expectedEndTime: futureIso,
      duration: 1800,
    };
    const cbs = makeCallbacks();
    processPosition(QUAY_LAT, QUAY_LNG, makeRefs(journey, "at_quay", 0), cbs);
    expect(cbs.setTripState).not.toHaveBeenCalled();
  });
});

describe("processPosition — crossing → next leg", () => {
  it("transitions to driving_to_quay when reaching destination quay with more legs ahead", () => {
    const ferryLeg = makeFerryLeg(QUAY_LAT, QUAY_LNG, DEST_LAT, DEST_LNG, pastIso);
    const nextCarLeg = makeCarLeg(DEST_LAT, DEST_LNG, DEST_LAT + 0.1, DEST_LNG + 0.1);
    const journey: JourneyResult = {
      legs: [ferryLeg, nextCarLeg],
      expectedEndTime: futureIso,
      duration: 3600,
    };
    const cbs = makeCallbacks();
    // Position near the ferry's toPlace
    processPosition(DEST_LAT + INSIDE, DEST_LNG, makeRefs(journey, "crossing", 0), cbs);
    expect(cbs.addCompletedLeg).toHaveBeenCalledWith(0);
    expect(cbs.setCurrentLegIndex).toHaveBeenCalledWith(1);
    expect(cbs.setTripState).toHaveBeenCalledWith("driving_to_quay");
  });

  it("transitions to arrived when reaching destination quay with no more legs", () => {
    const ferryLeg = makeFerryLeg(QUAY_LAT, QUAY_LNG, DEST_LAT, DEST_LNG, pastIso);
    const journey: JourneyResult = {
      legs: [ferryLeg],
      expectedEndTime: futureIso,
      duration: 1800,
    };
    const cbs = makeCallbacks();
    processPosition(DEST_LAT + INSIDE, DEST_LNG, makeRefs(journey, "crossing", 0), cbs);
    // The final-destination check fires first (early return), so leg completion
    // callbacks are not called — only setTripState("arrived").
    expect(cbs.setTripState).toHaveBeenCalledWith("arrived");
    expect(cbs.addCompletedLeg).not.toHaveBeenCalled();
    expect(cbs.setCurrentLegIndex).not.toHaveBeenCalled();
  });

  it("does not advance during crossing when far from destination quay", () => {
    const ferryLeg = makeFerryLeg(QUAY_LAT, QUAY_LNG, DEST_LAT, DEST_LNG, pastIso);
    const journey: JourneyResult = {
      legs: [ferryLeg],
      expectedEndTime: futureIso,
      duration: 1800,
    };
    const cbs = makeCallbacks();
    // Midway on ferry, far from destination quay
    processPosition(QUAY_LAT + 0.05, QUAY_LNG + 0.05, makeRefs(journey, "crossing", 0), cbs);
    expect(cbs.setTripState).not.toHaveBeenCalled();
  });
});

describe("processPosition — multi-leg: car → ferry → car", () => {
  it("full trip: drives to quay, boards ferry, drives to destination", () => {
    const INTER_LAT = 62.55;
    const INTER_LNG = 6.20;

    const carLeg1 = makeCarLeg(FAR_LAT, FAR_LNG, QUAY_LAT, QUAY_LNG);
    const ferryLeg = makeFerryLeg(QUAY_LAT, QUAY_LNG, INTER_LAT, INTER_LNG, pastIso);
    const carLeg2 = makeCarLeg(INTER_LAT, INTER_LNG, DEST_LAT, DEST_LNG);

    const journey: JourneyResult = {
      legs: [carLeg1, ferryLeg, carLeg2],
      expectedEndTime: futureIso,
      duration: 4200,
    };

    // Step 1: approach quay
    const cbs1 = makeCallbacks();
    processPosition(QUAY_LAT + INSIDE, QUAY_LNG, makeRefs(journey, "driving_to_quay", 0), cbs1);
    expect(cbs1.setTripState).toHaveBeenCalledWith("at_quay");
    expect(cbs1.setCurrentLegIndex).toHaveBeenCalledWith(1);

    // Step 2: departure time passed → boarding
    const cbs2 = makeCallbacks();
    processPosition(QUAY_LAT, QUAY_LNG, makeRefs(journey, "at_quay", 1), cbs2);
    expect(cbs2.setTripState).toHaveBeenCalledWith("crossing");

    // Step 3: reach far side → back to driving
    const cbs3 = makeCallbacks();
    processPosition(INTER_LAT + INSIDE, INTER_LNG, makeRefs(journey, "crossing", 1), cbs3);
    expect(cbs3.setTripState).toHaveBeenCalledWith("driving_to_quay");
    expect(cbs3.setCurrentLegIndex).toHaveBeenCalledWith(2);

    // Step 4: reach final destination
    const cbs4 = makeCallbacks();
    processPosition(DEST_LAT + INSIDE, DEST_LNG, makeRefs(journey, "driving_to_quay", 2), cbs4);
    expect(cbs4.setTripState).toHaveBeenCalledWith("arrived");
  });
});
