import React from "react";
import { View, Text } from "react-native";
import { ThemedActivityIndicator } from "./ThemedActivityIndicator";
import { ThemedIcon, GenericThemedIcon } from "./ThemedIcon";
import { useThemeColors } from "../contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

export const ThemeExample: React.FC = () => {
  const { primary, secondary, textPrimary } = useThemeColors();

  return (
    <View className="p-4 space-y-4 bg-surface rounded-xl mb-4">
      <Text className="text-lg font-bold mb-4">Theme Examples</Text>

      {/* ActivityIndicator Examples */}
      <View className="space-y-2">
        <Text className="font-semibold">ActivityIndicators:</Text>

        <View className="flex-row space-x-4 items-center">
          <ThemedActivityIndicator variant="primary" size="small" />
          <Text>Primary (small)</Text>
        </View>

        <View className="flex-row space-x-4 items-center">
          <ThemedActivityIndicator variant="secondary" size="large" />
          <Text>Secondary (large)</Text>
        </View>

        <View className="flex-row space-x-4 items-center">
          <ThemedActivityIndicator variant="error" />
          <Text>Error</Text>
        </View>

        <View className="flex-row space-x-4 items-center">
          <ThemedActivityIndicator variant="success" />
          <Text>Success</Text>
        </View>
      </View>

      {/* Icon Examples */}
      <View className="space-y-2">
        <Text className="font-semibold">Icons:</Text>
        <Text className="text-sm text-gray-600 mb-2">
          FontAwesome6 icons support different styles using boolean props:
          solid, regular, light, thin, duotone, sharp, sharpLight, sharpSolid,
          brand
        </Text>

        <View className="flex-row space-x-4 items-center">
          <ThemedIcon name="house" variant="primary" size={24} />
          <Text>Home (primary)</Text>
        </View>

        <View className="flex-row space-x-4 items-center">
          <ThemedIcon name="star" variant="secondary" size={24} />
          <Text>Star (secondary)</Text>
        </View>

        <View className="flex-row space-x-4 items-center">
          <ThemedIcon name="heart" variant="error" size={24} />
          <Text>Heart (error)</Text>
        </View>

        <View className="flex-row space-x-4 items-center">
          <ThemedIcon name="circle-check" variant="success" size={24} />
          <Text>Check (success)</Text>
        </View>

        <View className="flex-row space-x-4 items-center">
          <ThemedIcon name="heart" variant="text" size={24} regular={true} />
          <Text>Heart (regular)</Text>
        </View>

        <View className="flex-row space-x-4 items-center">
          <ThemedIcon name="heart" variant="text" size={24} solid={true} />
          <Text>Heart (solid)</Text>
        </View>

        <View className="flex-row space-x-4 items-center">
          <GenericThemedIcon
            IconComponent={Ionicons}
            name="heart"
            variant="text"
            size={24}
          />
          <Text>Heart (text)</Text>
        </View>
      </View>

      {/* Direct Theme Usage Example */}
      <View className="space-y-2">
        <Text className="font-semibold">Direct Theme Usage:</Text>
        <Text style={{ color: primary }}>
          This text uses primary color directly
        </Text>
        <Text style={{ color: secondary }}>
          This text uses secondary color directly
        </Text>
        <Text style={{ color: textPrimary }}>
          This text uses text color directly
        </Text>
      </View>
    </View>
  );
};
