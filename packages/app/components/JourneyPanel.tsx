import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from "react-native";
import type { JourneyResult, FerryLeg, DepartureOption, SearchResult } from "@shared/types";
import MarginBadge from "./MarginBadge";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const COLLAPSED_HEIGHT = 130;
const EXPANDED_HEIGHT = Math.round(SCREEN_HEIGHT * 0.75);

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
}

export default function JourneyPanel({ journey, destination }: JourneyPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const nextFerryLeg = journey.legs.find((l) => l.mode === "water") as FerryLeg | undefined;
  const nextDep = firstReachable(nextFerryLeg?.departures);

  return (
    <View style={[styles.panel, { height: expanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT }]}>
      {/* Drag handle / tap to toggle */}
      <TouchableOpacity onPress={() => setExpanded((v) => !v)} style={styles.handleArea} activeOpacity={0.8}>
        <View style={styles.handleBar} />
      </TouchableOpacity>

      {/* Peek row — always visible */}
      <View style={styles.peek}>
        <View style={styles.peekLeft}>
          <Text style={styles.destinationName} numberOfLines={1}>{destination.name}</Text>
          <Text style={styles.totalDuration}>{formatDuration(journey.duration)} total</Text>
        </View>
        {nextFerryLeg && nextDep && (
          <View style={styles.peekRight}>
            <Text style={styles.peekFerry} numberOfLines={1}>
              {nextFerryLeg.fromPlace.name} → {nextFerryLeg.toPlace.name}
            </Text>
            <View style={styles.peekRow}>
              <Text style={styles.peekTime}>{formatTime(nextDep.expectedDepartureTime)}</Text>
              <MarginBadge marginMinutes={nextDep.marginMinutes} />
            </View>
          </View>
        )}
      </View>

      {/* Expanded leg list */}
      {expanded && (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.divider} />
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
          <View style={styles.arrival}>
            <Text style={styles.arrivalText}>
              Arrive around{" "}
              <Text style={styles.arrivalTime}>{formatTime(journey.expectedEndTime)}</Text>
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 12,
    zIndex: 20,
  },
  handleArea: {
    alignItems: "center",
    paddingVertical: 10,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ddd",
  },
  peek: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  peekLeft: {
    flex: 1,
  },
  destinationName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },
  totalDuration: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  peekRight: {
    alignItems: "flex-end",
  },
  peekFerry: {
    fontSize: 12,
    color: "#0369a1",
    fontWeight: "600",
    marginBottom: 4,
    maxWidth: 160,
    textAlign: "right",
  },
  peekRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  peekTime: {
    fontSize: 13,
    fontWeight: "500",
    color: "#111",
  },
  scroll: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 16,
    marginBottom: 4,
  },
  legRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f8f8",
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
    color: "#222",
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
    color: "#555",
  },
  noData: {
    fontSize: 13,
    color: "#aaa",
    marginTop: 4,
  },
  arrival: {
    padding: 16,
    backgroundColor: "#fafafa",
  },
  arrivalText: {
    fontSize: 14,
    color: "#555",
  },
  arrivalTime: {
    fontWeight: "700",
    color: "#111",
  },
});
