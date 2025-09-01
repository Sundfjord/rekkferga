import React, { useState, useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import type { Departure } from "@/types";
import DepartureCard from "./DepartureCard";
import { useTranslation } from "@/hooks/useTranslation";
import { ThemedIcon } from "./ThemedIcon";

interface DepartureBoardProps {
  destination: string;
  departures: Departure[];
  expectedEndTime?: string;
}

export default function DepartureBoard({
  destination,
  departures,
  expectedEndTime,
}: DepartureBoardProps) {
  const { t } = useTranslation();
  const [showAllDepartures, setShowAllDepartures] = useState(false);
  const iconName = showAllDepartures ? "chevron-up" : "chevron-down";

  // Group departures by day
  const groupedDepartures = useMemo(() => {
    const groups: { [key: string]: Departure[] } = {};

    departures
      .filter((departure) => departure.relevant || showAllDepartures)
      .forEach((departure) => {
        const departureDate = new Date(departure.expectedDepartureTime);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let dayKey: string;
        let dayLabel: string;

        // Check if departure is today
        if (departureDate.toDateString() === today.toDateString()) {
          dayKey = "today";
          dayLabel = t("today");
        }
        // Check if departure is tomorrow
        else if (departureDate.toDateString() === tomorrow.toDateString()) {
          dayKey = "tomorrow";
          dayLabel = t("tomorrow");
        }
        // For other days, use the day name and date
        else {
          const dayName = departureDate.toLocaleDateString("no-NO", {
            weekday: "short",
          });
          const dateString = departureDate.toLocaleDateString("no-NO", {
            day: "numeric",
            month: "short",
          });
          dayKey = departureDate.toDateString();
          dayLabel = `${dayName} ${dateString}`;
        }

        if (!groups[dayKey]) {
          groups[dayKey] = [];
        }
        groups[dayKey].push(departure);
      });

    return Object.entries(groups).map(([key, deps]) => ({
      dayKey: key,
      dayLabel:
        key === "today"
          ? t("today")
          : key === "tomorrow"
          ? t("tomorrow")
          : (() => {
              const firstDep = deps[0];
              const departureDate = new Date(firstDep.expectedDepartureTime);
              const dayName = departureDate.toLocaleDateString("no-NO", {
                weekday: "short",
              });
              const dateString = departureDate.toLocaleDateString("no-NO", {
                day: "numeric",
                month: "short",
              });
              return `${dayName} ${dateString}`;
            })(),
      departures: deps,
    }));
  }, [departures, showAllDepartures, t]);

  return (
    <View className="mb-4 bg-surface">
      <View className="flex-row justify-between items-center">
        <Text className="text-surface-on font-bold mb-2">
          {t("toQuay", { quay: destination })}
        </Text>
      </View>
      <View className="flex-col gap-1 mb-2">
        {groupedDepartures.map((group) => (
          <View key={group.dayKey}>
            {/* Day label */}
            <View className="px-2 py-1 mb-2">
              <Text className="text-surface-on text-sm font-medium">
                {group.dayLabel}
              </Text>
            </View>
            {/* Departures for this day */}
            {group.departures.map((departure, index) => (
              <DepartureCard
                key={`${departure.expectedDepartureTime}-${index}`}
                departure={departure}
                expectedEndTime={expectedEndTime}
              />
            ))}
          </View>
        ))}
      </View>
      {departures.filter((departure) => departure.relevant).length <
        departures.length && (
        <Pressable onPress={() => setShowAllDepartures(!showAllDepartures)}>
          <View className="flex-row items-center gap-1 ml-2">
            <Text className="text-primary">
              {showAllDepartures
                ? t("showMostRelevant")
                : t("showMoreDepartures")}
            </Text>
            <ThemedIcon name={iconName} size={12} variant="primary" />
          </View>
        </Pressable>
      )}
    </View>
  );
}
