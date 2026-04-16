"use client";

import type { JourneyResult, FerryLeg, SearchResult } from "@shared/types";
import { formatTime, formatDuration, firstReachable } from "@shared/utils";

export type TripState = 'driving_to_quay' | 'at_quay' | 'crossing' | 'crossing_complete' | 'arrived';

function MarginBadge({ minutes }: { minutes: number | null }) {
  if (minutes === null) return null;
  const abs = Math.abs(minutes);
  const label = abs >= 60 ? `${Math.floor(abs / 60)}h ${abs % 60}m` : `${abs}m`;
  // positive = buffer (will make it); negative = will miss it
  const colorClass =
    minutes > 2  ? "bg-green-100 text-green-800" :
    minutes >= -2 ? "bg-yellow-100 text-yellow-800" :
    "bg-red-100 text-red-800";
  const prefix = minutes > 0 ? "+" : minutes < 0 ? "-" : "";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${colorClass}`}>
      {prefix}{label}
    </span>
  );
}

const STATE_LABELS: Record<TripState, string> = {
  driving_to_quay: 'Driving to ferry',
  at_quay: 'At ferry quay',
  crossing: 'On the ferry',
  crossing_complete: 'Ferry complete',
  arrived: 'Arrived',
};

interface TripPanelProps {
  journey: JourneyResult;
  destination: SearchResult;
  currentLegIndex: number;
  tripState: TripState;
  onExit: () => void;
  stalePosition?: boolean;
}

export default function TripPanel({
  journey,
  destination,
  currentLegIndex,
  tripState,
  onExit,
  stalePosition,
}: TripPanelProps) {
  const remainingLegs = journey.legs.slice(currentLegIndex);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 bg-white shadow-2xl rounded-t-2xl max-h-[55vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
        <div>
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
            {STATE_LABELS[tripState]}
          </div>
          <div className="font-semibold text-gray-900">{destination.name}</div>
        </div>
        <button
          onClick={onExit}
          className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex-shrink-0"
        >
          Exit trip
        </button>
      </div>

      {stalePosition && (
        <div className="mx-4 mt-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
          Position may be stale — tap to refresh
        </div>
      )}

      {/* Remaining legs */}
      <div className="divide-y divide-gray-50">
        {tripState === 'arrived' ? (
          <div className="px-4 py-4 text-sm text-gray-500 text-center">
            You have arrived at {destination.name}.
          </div>
        ) : (
          remainingLegs.map((leg, i) => {
            const legIndex = currentLegIndex + i;
            if (leg.mode === "water") {
              const ferryLeg = leg as FerryLeg;
              const dep = firstReachable(ferryLeg.departures);
              return (
                <div key={legIndex} className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">⛴</span>
                    <span className="font-medium text-gray-900 text-sm">
                      {ferryLeg.fromPlace.name} → {ferryLeg.toPlace.name}
                    </span>
                  </div>
                  {dep ? (
                    <div className="flex items-center gap-2 pl-6">
                      <span className="text-sm text-gray-600">Departs {formatTime(dep.expectedDepartureTime)}</span>
                      <MarginBadge minutes={dep.marginMinutes} />
                    </div>
                  ) : (
                    <div className="pl-6 text-sm text-gray-400">No departure data</div>
                  )}
                </div>
              );
            }
            return (
              <div key={legIndex} className="px-4 py-3 flex items-center gap-2">
                <span className="text-base">🚗</span>
                <span className="text-sm text-gray-700">
                  Drive {formatDuration(leg.duration)} → {leg.toPlace.name}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Safe area spacer */}
      <div className="h-4" />
    </div>
  );
}
