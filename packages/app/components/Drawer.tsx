import React from "react";
import { View, Text, Pressable, Animated, Dimensions } from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";

interface DrawerProps {
  isVisible: boolean;
  onClose: () => void;
  heightOffset: number;
  title: string;
  children: React.ReactNode;
  backgroundColor?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const DRAWER_WIDTH = screenWidth;

export default function Drawer({
  isVisible,
  onClose,
  heightOffset = 136,
  title = "",
  children,
  backgroundColor = "var(--color-background)",
}: DrawerProps) {
  const translateX = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isVisible) {
      // Animate from off-screen (right) to visible position
      translateX.setValue(0);
      Animated.timing(translateX, {
        toValue: -DRAWER_WIDTH,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      // Animate back to off-screen position
      Animated.timing(translateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [isVisible, translateX]);

  const handleClose = () => {
    Animated.timing(translateX, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      onClose();
    });
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <Pressable
        onPress={handleClose}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9998,
        }}
      >
        <View className="absolute inset-0" />
      </Pressable>

      {/* Drawer */}
      <Animated.View
        style={{
          position: "absolute",
          top: heightOffset,
          height: screenHeight,
          width: DRAWER_WIDTH,
          backgroundColor: backgroundColor,
          transform: [{ translateX }],
          elevation: 10,
          zIndex: 9999,
          // Position from right edge of screen
          right: -DRAWER_WIDTH,
        }}
      >
        {/* Drawer Header */}
        <View className="flex-row items-center justify-between px-4 pt-4 pb-8">
          <Text className="text-xl font-bold text-background-on">{title}</Text>
          <Pressable onPress={handleClose} hitSlop={8}>
            <FontAwesome6
              name="xmark"
              size={20}
              className="text-background-on"
            />
          </Pressable>
        </View>

        {children}
      </Animated.View>
    </>
  );
}
