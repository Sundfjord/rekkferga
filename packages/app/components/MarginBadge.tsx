import React from "react";
import { View, Text } from "react-native";
import { marginTier, formatMarginLabel } from "@shared/utils";
import { useThemeColors } from "../contexts/ThemeContext";

interface MarginBadgeProps {
  marginMinutes: number | null;
}

export default function MarginBadge({ marginMinutes }: MarginBadgeProps) {
  const colors = useThemeColors();

  if (marginMinutes === null) return null;

  const { prefix, label } = formatMarginLabel(marginMinutes);
  const tierName = marginTier(marginMinutes);
  const tierColors = { safe: colors.marginSafe, tight: colors.marginTight, missed: colors.marginMissed };
  const tier = tierColors[tierName];

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
