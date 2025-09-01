import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function MapWeb() {
  return (
    <View className="flex-1 justify-center items-center">
      <Ionicons name="phone-portrait-outline" size={100} color="#3a4a5d" />
      <Text className="text-lg mt-4 max-w-xs text-center">
        Kart er berre tilgjengeleg på mobile einingar.
      </Text>
    </View>
  );
}
