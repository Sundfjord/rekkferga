import React from "react";
import { View, Image, Pressable } from "react-native";
import { ThemedIcon } from "./ThemedIcon";
import { useTheme } from "../contexts/ThemeContext";

interface HeaderProps {
  onToggleDrawer: () => void;
  isDrawerVisible: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleDrawer, isDrawerVisible }) => {
  const { themeMode, isDark } = useTheme();

  // Function to get the appropriate image based on theme
  const getHeaderImage = () => {
    switch (themeMode) {
      case "light":
        return require("../assets/images/logo-light.png");
      case "dark":
        return require("../assets/images/logo-dark.png");
      case "system":
        // For system mode, use isDark to determine which image
        return isDark
          ? require("../assets/images/logo-dark.png")
          : require("../assets/images/logo-light.png");
      default:
        return require("../assets/images/logo-light.png");
    }
  };

  return (
    <View className="flex-row justify-center pt-4 bg-primary">
      <Image
        source={getHeaderImage()}
        style={{ height: 60, width: 137 }}
        accessibilityLabel="Logo"
        resizeMode="contain"
      />
      <View className="absolute top-2 right-2">
        <Pressable
          hitSlop={8}
          accessibilityLabel="Innstillingar"
          onPress={onToggleDrawer}
        >
          <ThemedIcon
            name="gear"
            size={24}
            variant={isDrawerVisible ? "onBackground" : "onPrimary"}
          />
        </Pressable>
      </View>
    </View>
  );
};

export default Header;
