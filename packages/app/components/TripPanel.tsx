import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { JourneyResult, FerryLeg, SearchResult, TripState } from "@shared/types";
import { formatTime, formatDuration, nextReachable } from "@shared/utils";
import MarginBadge from "./MarginBadge";
import { useThemeColors } from "../contexts/ThemeContext";
import { useFavorites } from "../contexts/FavoritesContext";
import { useTranslation } from "@/hooks/useTranslation";

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
  const { toggleFavorite, isFavorite } = useFavorites();
  const isFav = isFavorite(destination.id);
  const remainingLegs = journey.legs.slice(currentLegIndex);

  const STATE_LABELS: Record<TripState, string> = {
    driving_to_quay: t("tripStateDrivingToQuay"),
    at_quay: t("tripStateAtQuay"),
    crossing: t("tripStateCrossing"),
    crossing_complete: t("tripStateCrossingComplete"),
    arrived: t("tripStateArrived"),
  };

  return (
    <View style={[styles.panel, { backgroundColor: colors.surface }]}>
      {/* Stale banner */}
      {stalePosition && (
        <View style={styles.staleBanner}>
          <Text style={[styles.staleText, { fontFamily: "DMSans-Regular" }]}>
            ⚠ {t("stalePosition")}
          </Text>
        </View>
      )}

        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={[styles.destinationName, { color: colors.onSurface, fontFamily: "Syne-Bold" }]} numberOfLines={1}>
              {destination.name}
            </Text>
            <Text style={[styles.arrivalTime, { color: colors.onSurface, fontFamily: "JetBrainsMono-Medium" }]}>
              {formatTime(journey.expectedEndTime)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => toggleFavorite(destination)}
            accessibilityLabel={isFav ? t("removeFavorite") : t("addFavorite")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isFav ? "heart" : "heart-outline"}
              size={24}
              color={isFav ? "#ef4444" : colors.onSurface}
            />
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
                const dep = nextReachable(ferryLeg.departures);
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
  );
}

const styles = StyleSheet.create({
  staleBanner: {
    backgroundColor: "#FFFBEB",
    borderBottomWidth: 1,
    borderBottomColor: "#FDE68A",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  staleText: {
    fontSize: 13,
    color: "#92400E",
  },
  panel: {
    borderRadius: 18,
    shadowColor: "#01163A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
  },
  destinationName: {
    fontSize: 16,
    lineHeight: 20,
  },
  arrivalTime: {
    fontSize: 13,
    marginTop: 2,
    opacity: 0.65,
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
