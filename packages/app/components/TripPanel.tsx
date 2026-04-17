import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { JourneyResult, FerryLeg, SearchResult } from "@shared/types";
import { formatTime, formatDuration, firstReachable } from "@shared/utils";
import MarginBadge from "./MarginBadge";
import { useTranslation } from "@/hooks/useTranslation";

export type TripState = 'driving_to_quay' | 'at_quay' | 'crossing' | 'crossing_complete' | 'arrived';

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
  const { t } = useTranslation();
  const STATE_LABELS: Record<TripState, string> = {
    driving_to_quay: t("tripStateDrivingToQuay"),
    at_quay: t("tripStateAtQuay"),
    crossing: t("tripStateCrossing"),
    crossing_complete: t("tripStateCrossingComplete"),
    arrived: t("tripStateArrived"),
  };
  const remainingLegs = journey.legs.slice(currentLegIndex);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.stateLabel}>{STATE_LABELS[tripState]}</Text>
          <Text style={styles.destinationName} numberOfLines={1}>{destination.name}</Text>
        </View>
        <TouchableOpacity onPress={onExit} style={styles.exitButton} hitSlop={8}>
          <Text style={styles.exitButtonText}>{t("exitTrip")}</Text>
        </TouchableOpacity>
      </View>

      {stalePosition && (
        <View style={styles.staleBanner}>
          <Text style={styles.staleText}>{t("stalePosition")}</Text>
        </View>
      )}

      {/* Remaining legs */}
      <View style={styles.legs}>
        {tripState === 'arrived' ? (
          <Text style={styles.arrivedText}>{t("arrivedAt", { destination: destination.name })}</Text>
        ) : (
          remainingLegs.map((leg, i) => {
            const legIndex = currentLegIndex + i;
            if (leg.mode === "water") {
              const ferryLeg = leg as FerryLeg;
              const dep = firstReachable(ferryLeg.departures);
              return (
                <View key={legIndex} style={styles.legRow}>
                  <Text style={styles.legIcon}>⛴</Text>
                  <View style={styles.legContent}>
                    <Text style={styles.legTitle}>
                      {ferryLeg.fromPlace.name} → {ferryLeg.toPlace.name}
                    </Text>
                    {dep ? (
                      <View style={styles.depRow}>
                        <Text style={styles.depTime}>{t("departures")} {formatTime(dep.expectedDepartureTime)}</Text>
                        {dep.marginMinutes !== null && (
                          <MarginBadge marginMinutes={dep.marginMinutes} />
                        )}
                      </View>
                    ) : (
                      <Text style={styles.noData}>{t("unavailable")}</Text>
                    )}
                  </View>
                </View>
              );
            }
            return (
              <View key={legIndex} style={styles.legRow}>
                <Text style={styles.legIcon}>🚗</Text>
                <Text style={styles.legTitle}>
                  {t("car")} {formatDuration(leg.duration)} → {leg.toPlace.name}
                </Text>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 16,
    maxHeight: "55%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerText: {
    flex: 1,
    marginRight: 8,
  },
  stateLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563eb",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  destinationName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  exitButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  exitButtonText: {
    fontSize: 13,
    color: "#4b5563",
  },
  staleBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fefce8",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fef08a",
  },
  staleText: {
    fontSize: 12,
    color: "#854d0e",
  },
  legs: {
    paddingBottom: 16,
  },
  legRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f9fafb",
  },
  legIcon: {
    fontSize: 18,
    lineHeight: 22,
  },
  legContent: {
    flex: 1,
  },
  legTitle: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "500",
  },
  depRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  depTime: {
    fontSize: 13,
    color: "#4b5563",
  },
  noData: {
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 4,
  },
  arrivedText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
});
