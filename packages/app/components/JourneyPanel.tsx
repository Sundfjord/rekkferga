import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { JourneyResult, FerryLeg, DepartureOption, SearchResult } from "@shared/types";
import MarginBadge from "./MarginBadge";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

function firstReachable(deps: DepartureOption[] | undefined): DepartureOption | undefined {
  return deps?.find((d) => d.isFirstReachable) ?? deps?.[0];
}

interface JourneyPanelProps {
  journey: JourneyResult;
  destination: SearchResult;
  onClose: () => void;
  onStartTrip: () => void;
}

export default function JourneyPanel({ journey, destination, onClose, onStartTrip }: JourneyPanelProps) {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.destinationName} numberOfLines={1}>{destination.name}</Text>
          <Text style={styles.totalDuration}>{formatDuration(journey.duration)} total</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={8}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Legs */}
      <View style={styles.legs}>
        {journey.legs.map((leg, i) => {
          if (leg.mode === "water") {
            const ferryLeg = leg as FerryLeg;
            const dep = firstReachable(ferryLeg.departures);
            return (
              <View key={i} style={styles.legRow}>
                <Text style={styles.legIcon}>⛴</Text>
                <View style={styles.legContent}>
                  <Text style={styles.legTitle}>
                    {ferryLeg.fromPlace.name} → {ferryLeg.toPlace.name}
                  </Text>
                  {dep ? (
                    <View style={styles.depRow}>
                      <Text style={styles.depTime}>Departs {formatTime(dep.expectedDepartureTime)}</Text>
                      <MarginBadge marginMinutes={dep.marginMinutes} />
                    </View>
                  ) : (
                    <Text style={styles.noData}>No departure data</Text>
                  )}
                </View>
              </View>
            );
          }
          return (
            <View key={i} style={styles.legRow}>
              <Text style={styles.legIcon}>🚗</Text>
              <Text style={styles.legTitle}>
                Drive {formatDuration(leg.duration)} → {leg.toPlace.name}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.arrivalText}>
          Arrive around{" "}
          <Text style={styles.arrivalTime}>{formatTime(journey.expectedEndTime)}</Text>
        </Text>
        <TouchableOpacity onPress={onStartTrip} style={styles.startButton}>
          <Text style={styles.startButtonText}>Start trip →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "white",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerText: {
    flex: 1,
    marginRight: 8,
  },
  destinationName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  totalDuration: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 16,
    color: "#9ca3af",
  },
  legs: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
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
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#f9fafb",
  },
  arrivalText: {
    fontSize: 13,
    color: "#4b5563",
  },
  arrivalTime: {
    fontWeight: "700",
    color: "#111827",
  },
  startButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
});
