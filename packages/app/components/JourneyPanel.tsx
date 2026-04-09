import React, { useMemo, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
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
}

export default function JourneyPanel({ journey, destination }: JourneyPanelProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["20%", "80%"], []);

  const nextFerryLeg = journey.legs.find((l) => l.mode === "water") as FerryLeg | undefined;
  const nextDep = firstReachable(nextFerryLeg?.departures);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      index={0}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        {/* Peek content — visible at snap index 0 */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.destinationName} numberOfLines={1}>{destination.name}</Text>
            <Text style={styles.totalDuration}>{formatDuration(journey.duration)} total</Text>
          </View>
          {nextFerryLeg && nextDep && (
            <View style={styles.peekBadge}>
              <Text style={styles.peekFerryLabel}>
                {nextFerryLeg.fromPlace.name} → {nextFerryLeg.toPlace.name}
              </Text>
              <View style={styles.peekRow}>
                <Text style={styles.peekTime}>{formatTime(nextDep.expectedDepartureTime)}</Text>
                <MarginBadge marginMinutes={nextDep.marginMinutes} />
              </View>
            </View>
          )}
        </View>

        {/* Full leg breakdown */}
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

        <View style={styles.arrivalRow}>
          <Text style={styles.arrivalText}>
            Arrive around{" "}
            <Text style={styles.arrivalTime}>{formatTime(journey.expectedEndTime)}</Text>
          </Text>
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background: { borderRadius: 16 },
  handle: { backgroundColor: "#ccc" },
  content: { paddingBottom: 32 },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  headerText: { marginBottom: 8 },
  destinationName: { fontSize: 16, fontWeight: "700", color: "#111" },
  totalDuration: { fontSize: 13, color: "#666", marginTop: 2 },
  peekBadge: { backgroundColor: "#f0f9ff", borderRadius: 10, padding: 10 },
  peekFerryLabel: { fontSize: 13, color: "#0369a1", fontWeight: "600", marginBottom: 4 },
  peekRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  peekTime: { fontSize: 14, color: "#111", fontWeight: "500" },
  divider: { height: 1, backgroundColor: "#f0f0f0", marginHorizontal: 16 },
  legRow: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 16, paddingVertical: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: "#f8f8f8" },
  legIcon: { fontSize: 18, lineHeight: 22 },
  legContent: { flex: 1 },
  legTitle: { fontSize: 14, color: "#222", fontWeight: "500" },
  depRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  depTime: { fontSize: 13, color: "#555" },
  noData: { fontSize: 13, color: "#aaa", marginTop: 4 },
  arrivalRow: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fafafa" },
  arrivalText: { fontSize: 14, color: "#555" },
  arrivalTime: { fontWeight: "700", color: "#111" },
});
