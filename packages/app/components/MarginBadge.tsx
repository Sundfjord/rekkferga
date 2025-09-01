import React from "react";
import { View, Text } from "react-native";
import { calculateMarginText, getTimeDifferenceMinutes } from "@/utils";
import { useTranslation } from "@/hooks/useTranslation";

interface MarginBadgeProps {
  arrivalTime: string | Date;
  departureTime: string | Date;
}

export default function MarginBadge({
  arrivalTime,
  departureTime,
}: MarginBadgeProps) {
  const { t } = useTranslation();
  const marginMinutes = getTimeDifferenceMinutes(arrivalTime, departureTime);
  const marginText = calculateMarginText(arrivalTime, departureTime, t);

  if (!marginText) return null;

  let bgColor = "";
  let textColor = "";
  let prefix = "";

  if (marginMinutes > 0) {
    // Positive margin - green badge (reachable)
    bgColor = "bg-success";
    textColor = "text-success-on";
    prefix = "+";
  } else if (marginMinutes < 0) {
    // Negative margin - red badge (unreachable)
    bgColor = "bg-error";
    textColor = "text-error-on";
    prefix = "-";
  } else {
    // Zero margin - yellow badge (exact timing)
    bgColor = "bg-primary";
    textColor = "text-primary-on";
    prefix = "";
  }

  return (
    <View className={`${bgColor} p-1 rounded-lg`}>
      <Text className={`${textColor} text-xs font-bold`}>
        {prefix}
        {marginText}
      </Text>
    </View>
  );
}
