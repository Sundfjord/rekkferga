import React from "react";
import { View, Text } from "react-native";
import { useThemeColors } from "../contexts/ThemeContext";

interface MarginBadgeProps {
  marginMinutes: number | null;
}

export default function MarginBadge({ marginMinutes }: MarginBadgeProps) {
  const colors = useThemeColors();

  if (marginMinutes === null) return null;

  const abs = Math.abs(marginMinutes);
  const label = abs >= 60 ? `${Math.floor(abs / 60)}h ${abs % 60}m` : `${abs}m`;
  const prefix = marginMinutes > 0 ? "+" : marginMinutes < 0 ? "−" : "";

  const tier =
    marginMinutes > 10 ? colors.marginSafe :
    marginMinutes >= 0 ? colors.marginTight :
    colors.marginMissed;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "baseline",
        alignSelf: "flex-start",
        backgroundColor: tier.bg,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
        gap: 4,
      }}
    >
      <Text
        style={{
          color: tier.text,
          fontSize: 20,
          fontWeight: "700",
          fontFamily: "JetBrainsMono-Bold",
          lineHeight: 24,
        }}
      >
        {prefix}{label}
      </Text>
      <Text
        style={{
          color: tier.text,
          fontSize: 11,
          fontFamily: "DMSans-Regular",
          opacity: 0.75,
        }}
      >
        {marginMinutes === 0 ? "akkurat" : "margin"}
      </Text>
    </View>
  );
}
