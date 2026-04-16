"use client";

import type { JourneyResult, FerryLeg, DepartureOption, SearchResult } from "@shared/types";
import { formatTime, formatDuration, firstReachable } from "@shared/utils";

function MarginBadge({ minutes }: { minutes: number | null }) {
  if (minutes === null) return null;
  const abs = Math.abs(minutes);
  const label = abs >= 60
    ? `${Math.floor(abs / 60)}h ${abs % 60}m`
    : `${abs}m`;
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

interface JourneyPanelProps {
  journey: JourneyResult;
  destination: SearchResult;
  onClose: () => void;
  onStartTrip: () => void;
}

export default function JourneyPanel({ journey, destination, onClose, onStartTrip }: JourneyPanelProps) {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-gray-100">
        <div>
          <div className="font-semibold text-gray-900">{destination.name}</div>
          <div className="text-sm text-gray-500">{formatDuration(journey.duration)} total</div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 -mr-1 -mt-1 flex-shrink-0" aria-label="Close">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Legs */}
      <div className="divide-y divide-gray-50">
        {journey.legs.map((leg, i) => {
          if (leg.mode === "water") {
            const ferryLeg = leg as FerryLeg;
            const dep = firstReachable(ferryLeg.departures);
            return (
              <div key={i} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg">⛴</span>
                  <span className="font-medium text-gray-900 text-sm">
                    {ferryLeg.fromPlace.name} → {ferryLeg.toPlace.name}
                  </span>
                </div>
                {dep ? (
                  <div className="flex items-center gap-2 pl-7">
                    <span className="text-sm text-gray-600">Departs {formatTime(dep.expectedDepartureTime)}</span>
                    <MarginBadge minutes={dep.marginMinutes} />
                  </div>
                ) : (
                  <div className="pl-7 text-sm text-gray-400">No departure data</div>
                )}
              </div>
            );
          }
          return (
            <div key={i} className="px-4 py-3 flex items-center gap-2">
              <span className="text-lg">🚗</span>
              <span className="text-sm text-gray-700">
                Drive {formatDuration(leg.duration)} → {leg.toPlace.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Arrive around{" "}
          <span className="font-medium text-gray-900">{formatTime(journey.expectedEndTime)}</span>
        </div>
        <button
          onClick={onStartTrip}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start trip →
        </button>
      </div>
    </div>
  );
}
