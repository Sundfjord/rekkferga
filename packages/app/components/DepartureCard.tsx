import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import type { Departure } from "@/types";
import { formatTime } from "@/utils";
import MarginBadge from "./MarginBadge";
import Timeline from "./Timeline";
import { useTranslation } from "@/hooks/useTranslation";

interface DepartureProps {
  departure: Departure;
  expectedEndTime?: string;
}

export default function DepartureCard({
  departure,
  expectedEndTime,
}: DepartureProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const timelineItems = departure.journey.map((call) => {
    return {
      id: call.time,
      content: <Text className="text-surface-on">{call.stopPlaceName}</Text>,
      time: formatTime(call.time),
      isRealtime: call.realtime,
    };
  });
  return (
    <Pressable onPress={() => setIsExpanded(!isExpanded)}>
      <View className="border border-gray-200 p-2 rounded-lg">
        <View className="flex-row items-center gap-2">
          <Text
            className={`ml-2 text-lg ${
              departure.realtime ? "text-primary font-bold" : "text-surface-on"
            }`}
          >
            {formatTime(departure.expectedDepartureTime)}
          </Text>
          {expectedEndTime && (
            <MarginBadge
              arrivalTime={new Date(expectedEndTime)}
              departureTime={new Date(departure.expectedDepartureTime)}
            />
          )}
          {departure.journey.length > 2 && (
            <View className="p-1 rounded-lg bg-primary">
              <Text className="text-primary-on">{t("stopover")}</Text>
            </View>
          )}
        </View>
        {isExpanded && <Timeline items={timelineItems} />}
      </View>
    </Pressable>
  );
}
