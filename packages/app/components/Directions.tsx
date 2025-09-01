import { View, Text } from "react-native";
import type { Leg } from "@/types";
import Timeline from "./Timeline";
import { formatTime } from "@/utils";
import { useTranslation } from "@/hooks/useTranslation";

interface DirectionsProps {
  legs: Leg[];
  quayName: string;
}

export default function Directions({ legs, quayName }: DirectionsProps) {
  const { t } = useTranslation();
  const timelineItems = legs.flatMap((leg, index) => {
    const fromPlace =
      leg.fromPlace.name === "Origin" ? t("yourPosition") : leg.fromPlace.name;
    const toPlace =
      leg.toPlace.name === "Destination" && quayName
        ? quayName
        : leg.toPlace.name;

    const items = [];

    // First timeline item: Departure
    if (leg.mode === "car") {
      items.push({
        id: `leg-${index}-departure`,
        time: formatTime(leg.expectedStartTime),
        content: (
          <Text className="text-surface-on">{`${t("driveFrom", {
            place: fromPlace,
          })}`}</Text>
        ),
      });
    } else if (leg.mode === "water") {
      items.push({
        id: `leg-${index}-departure`,
        time: formatTime(leg.expectedStartTime),
        content: (
          <Text className="text-surface-on">{`${t("takeFerryFrom", {
            place: fromPlace,
          })}`}</Text>
        ),
      });
    } else {
      items.push({
        id: `leg-${index}-departure`,
        time: formatTime(leg.expectedStartTime),
        content: (
          <Text className="text-surface-on">{`${t("travelTo", {
            place: fromPlace,
          })}`}</Text>
        ),
      });
    }

    // Second timeline item: Arrival
    items.push({
      id: `leg-${index}-arrival`,
      time: formatTime(leg.expectedEndTime),
      content: (
        <Text className="text-surface-on">{`${t("arriveAt", {
          place: toPlace,
        })}`}</Text>
      ),
    });

    return items;
  });

  return (
    <View className="flex-1">
      <Timeline items={timelineItems} />
    </View>
  );
}
