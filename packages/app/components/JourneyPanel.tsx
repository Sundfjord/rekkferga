import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { JourneyResult, FerryLeg, SearchResult } from "@shared/types";
import { formatTime, formatDuration, firstReachable } from "@shared/utils";
import MarginBadge from "./MarginBadge";
import { useThemeColors } from "../contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";

interface JourneyPanelProps {
  journey: JourneyResult;
  destination: SearchResult;
  onClose: () => void;
  onStartTrip: () => void;
}

export default function JourneyPanel({ journey, destination, onClose, onStartTrip }: JourneyPanelProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const msUntilArrival = new Date(journey.expectedEndTime).getTime() - Date.now();
  const durationToShow = msUntilArrival > 0 ? msUntilArrival / 1000 : journey.duration;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: "#000" }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.destinationName, { color: colors.onSurface, fontFamily: "Syne-Bold" }]} numberOfLines={1}>
            {destination.name}
          </Text>
          <Text style={[styles.totalDuration, { color: colors.onSurface, fontFamily: "DMSans-Regular", opacity: 0.6 }]}>
            {formatDuration(durationToShow)} total
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={8}>
          <Text style={{ fontSize: 16, color: colors.onSurface, opacity: 0.35 }}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Timeline legs */}
      <View style={styles.legsContainer}>
        {/* Vertical rail */}
        <View style={[styles.rail, { backgroundColor: colors.primaryLight, opacity: 0.3 }]} />

        <View style={styles.legsList}>
          {journey.legs.map((leg, i) => {
            if (leg.mode === "water") {
              const ferryLeg = leg as FerryLeg;
              const dep = firstReachable(ferryLeg.departures);
              return (
                <View key={i} style={styles.legRow}>
                  {/* Ferry node — larger, brand blue */}
                  <View style={[styles.ferryNode, { backgroundColor: colors.primary }]} />
                  <View style={styles.legContent}>
                    <Text style={[styles.ferryRoute, { color: colors.onSurface, fontFamily: "DMSans-Medium" }]}>
                      {ferryLeg.fromPlace.name} → {ferryLeg.toPlace.name}
                    </Text>
                    {dep ? (
                      <View style={styles.depDetails}>
                        <MarginBadge marginMinutes={dep.marginMinutes} />
                        <Text style={[styles.depTime, { color: colors.onSurface, fontFamily: "JetBrainsMono-Medium", opacity: 0.55 }]}>
                          {t("departures")} {formatTime(dep.expectedDepartureTime)}
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.noData, { color: colors.onSurface, fontFamily: "DMSans-Regular", opacity: 0.4 }]}>
                        {t("unavailable")}
                      </Text>
                    )}
                  </View>
                </View>
              );
            }
            return (
              <View key={i} style={styles.legRow}>
                {/* Car node — smaller, muted */}
                <View style={[styles.carNode, { backgroundColor: colors.surfaceVariant, borderColor: colors.primaryLight }]} />
                <View style={styles.legContent}>
                  <View style={styles.carRowInner}>
                    <Text style={[styles.carLabel, { color: colors.onSurface, fontFamily: "DMSans-Regular", opacity: 0.6 }]}>
                      {t("car")} → {leg.toPlace.name}
                    </Text>
                    <Text style={[styles.carDuration, { color: colors.onSurface, fontFamily: "DMSans-Regular", opacity: 0.4 }]}>
                      {formatDuration(leg.duration)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View>
          <Text style={[styles.arrivalLabel, { color: colors.onSurface, fontFamily: "Syne-SemiBold", opacity: 0.45 }]}>
            ANKOMST
          </Text>
          <Text style={[styles.arrivalTime, { color: colors.onSurface, fontFamily: "JetBrainsMono-Bold" }]}>
            {formatTime(journey.expectedEndTime)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onStartTrip}
          style={[styles.startButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.startButtonText, { fontFamily: "DMSans-SemiBold" }]}>
            {t("directions")} →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 6,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerText: {
    flex: 1,
    marginRight: 8,
  },
  destinationName: {
    fontSize: 17,
    lineHeight: 22,
  },
  totalDuration: {
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  legsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    position: "relative",
  },
  rail: {
    position: "absolute",
    left: 27,
    top: 8,
    bottom: 8,
    width: 2,
    borderRadius: 1,
  },
  legsList: {
    gap: 20,
  },
  legRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  ferryNode: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: 2,
    flexShrink: 0,
  },
  carNode: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 3,
    flexShrink: 0,
    borderWidth: 1.5,
  },
  legContent: {
    flex: 1,
  },
  ferryRoute: {
    fontSize: 14,
    lineHeight: 20,
  },
  depDetails: {
    marginTop: 8,
    gap: 6,
  },
  depTime: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
  noData: {
    fontSize: 13,
    marginTop: 4,
  },
  carRowInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingTop: 2,
  },
  carLabel: {
    fontSize: 13,
    flex: 1,
  },
  carDuration: {
    fontSize: 13,
    flexShrink: 0,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  arrivalLabel: {
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 2,
  },
  arrivalTime: {
    fontSize: 18,
    letterSpacing: 0.5,
  },
  startButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  startButtonText: {
    color: "white",
    fontSize: 14,
  },
});
