import React from "react";
import { View, Text } from "react-native";

interface MarginBadgeProps {
  marginMinutes: number | null;
}

export default function MarginBadge({ marginMinutes }: MarginBadgeProps) {
  if (marginMinutes === null) return null;
  const abs = Math.abs(marginMinutes);
  const label =
    abs >= 60
      ? `${Math.floor(abs / 60)}h ${abs % 60}m`
      : `${abs}m`;

  let bgColor = "";
  let textColor = "";
  let prefix = "";

  if (marginMinutes > 10) {
    bgColor = "bg-success";
    textColor = "text-success-on";
    prefix = "+";
  } else if (marginMinutes >= 2) {
    bgColor = "bg-warning";
    textColor = "text-warning-on";
    prefix = "+";
  } else if (marginMinutes >= 0) {
    bgColor = "bg-primary";
    textColor = "text-primary-on";
    prefix = "";
  } else {
    bgColor = "bg-error";
    textColor = "text-error-on";
    prefix = "-";
  }

  return (
    <View className={`${bgColor} px-2 py-1 rounded-lg`}>
      <Text className={`${textColor} text-xs font-bold`}>
        {prefix}{label}
      </Text>
    </View>
  );
}
