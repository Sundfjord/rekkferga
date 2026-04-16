import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function TripScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center gap-4">
      <Text className="text-surface-on opacity-50 text-sm">Trip view — coming in Phase 3</Text>
      <TouchableOpacity onPress={() => router.back()}>
        <Text className="text-blue-500 text-sm">← Back</Text>
      </TouchableOpacity>
    </View>
  );
}
