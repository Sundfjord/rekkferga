import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import type { JourneyResult, FerryLeg, SearchResult } from "@shared/types";
import { formatTime, formatDuration, firstReachable } from "@shared/utils";
import MarginBadge from "./MarginBadge";
import { useThemeColors } from "../contexts/ThemeContext";
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
  const colors = useThemeColors();
  const remainingLegs = journey.legs.slice(currentLegIndex);

  const STATE_LABELS: Record<TripState, string> = {
    driving_to_quay: t("tripStateDrivingToQuay"),
    at_quay: t("tripStateAtQuay"),
    crossing: t("tripStateCrossing"),
    crossing_complete: t("tripStateCrossingComplete"),
    arrived: t("tripStateArrived"),
  };

  return (
    <View style={styles.outerWrapper}>
      {/* Stale banner — sits above panel */}
      {stalePosition && (
        <View style={styles.staleBanner}>
          <Text style={[styles.staleText, { fontFamily: "DMSans-Regular" }]}>
            ⚠ {t("stalePosition")}
          </Text>
        </View>
      )}

      {/* Main bottom sheet */}
      <View style={[styles.panel, { backgroundColor: colors.surface }]}>
        {/* Drag handle */}
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={[styles.stateLabel, { color: colors.primary, fontFamily: "Syne-SemiBold" }]}>
              {STATE_LABELS[tripState].toUpperCase()}
            </Text>
            <Text style={[styles.destinationName, { color: colors.onSurface, fontFamily: "Syne-Bold" }]} numberOfLines={1}>
              {destination.name}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onExit}
            style={[styles.exitButton, { borderColor: colors.border }]}
            hitSlop={8}
          >
            <Text style={[styles.exitButtonText, { color: colors.onSurface, fontFamily: "DMSans-Regular" }]}>
              {t("exitTrip")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Legs — scrollable, all remaining steps shown */}
        {tripState === 'arrived' ? (
          <View style={styles.arrivedContainer}>
            <Text style={[styles.arrivedText, { color: colors.onSurface, fontFamily: "DMSans-Regular" }]}>
              {t("arrivedAt", { destination: destination.name })}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.legsScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.legsContent}
          >
            {remainingLegs.map((leg, i) => {
              const isActive = i === 0;
              const legGlobalIndex = currentLegIndex + i;

              if (leg.mode === "water") {
                const ferryLeg = leg as FerryLeg;
                const dep = firstReachable(ferryLeg.departures);
                return (
                  <View
                    key={legGlobalIndex}
                    style={[
                      styles.legBlock,
                      !isActive && { borderTopWidth: 1, borderTopColor: colors.border },
                    ]}
                  >
                    {/* Route */}
                    <View style={styles.legHeader}>
                      <View style={[styles.ferryNode, { backgroundColor: colors.primary }]} />
                      <Text style={[
                        styles.ferryRoute,
                        { color: colors.onSurface, fontFamily: "DMSans-Medium" },
                        !isActive && { opacity: 0.65 },
                      ]}>
                        {ferryLeg.fromPlace.name} → {ferryLeg.toPlace.name}
                      </Text>
                    </View>
                    {/* Always show margin badge for ferry legs */}
                    {dep ? (
                      <View style={styles.ferryDetails}>
                        <MarginBadge marginMinutes={dep.marginMinutes} />
                        <Text style={[styles.depTime, { color: colors.onSurface, fontFamily: "JetBrainsMono-Medium" }]}
                          numberOfLines={1}>
                          {t("departures")} {formatTime(dep.expectedDepartureTime)}
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.noData, { color: colors.onSurface, fontFamily: "DMSans-Regular", opacity: 0.4 }]}>
                        {t("unavailable")}
                      </Text>
                    )}
                  </View>
                );
              }

              // Car leg
              return (
                <View
                  key={legGlobalIndex}
                  style={[
                    styles.legBlock,
                    !isActive && { borderTopWidth: 1, borderTopColor: colors.border },
                  ]}
                >
                  <View style={styles.legHeader}>
                    <View style={[styles.carNode, { borderColor: colors.primaryLight, backgroundColor: colors.surfaceVariant }]} />
                    <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={[
                        styles.carLabel,
                        { color: colors.onSurface, fontFamily: "DMSans-Regular" },
                        !isActive && { opacity: 0.55 },
                      ]}>
                        {t("car")} → {leg.toPlace.name}
                      </Text>
                      <Text style={[styles.carDuration, { color: colors.onSurface, fontFamily: "JetBrainsMono-Medium", opacity: 0.5 }]}>
                        {formatDuration(leg.duration)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  staleBanner: {
    backgroundColor: "#FFFBEB",
    borderTopWidth: 1,
    borderTopColor: "#FDE68A",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  staleText: {
    fontSize: 13,
    color: "#92400E",
  },
  panel: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
    maxHeight: "60%",
  },
  handle: {
    width: 32,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
    opacity: 0.3,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  stateLabel: {
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  destinationName: {
    fontSize: 16,
    lineHeight: 20,
  },
  exitButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  exitButtonText: {
    fontSize: 13,
    opacity: 0.6,
  },
  legsScroll: {
    flexGrow: 0,
  },
  legsContent: {
    paddingBottom: 20,
  },
  legBlock: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
  },
  legHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ferryNode: {
    width: 16,
    height: 16,
    borderRadius: 8,
    flexShrink: 0,
  },
  carNode: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 1.5,
    flexShrink: 0,
  },
  ferryRoute: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  ferryDetails: {
    paddingLeft: 28,
    gap: 6,
  },
  depTime: {
    fontSize: 12,
    letterSpacing: 0.2,
    opacity: 0.55,
  },
  carLabel: {
    fontSize: 13,
    flex: 1,
  },
  carDuration: {
    fontSize: 13,
    flexShrink: 0,
  },
  noData: {
    fontSize: 13,
    paddingLeft: 28,
  },
  arrivedContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  arrivedText: {
    fontSize: 14,
    textAlign: "center",
  },
});
