import React, { useState } from "react";
import { View, SafeAreaView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "../global.css";
import * as SystemUI from "expo-system-ui";
import { useFonts } from "expo-font";
import Header from "../components/Header";
import Settings from "../components/Settings";
import { LanguageProvider } from "../contexts/LanguageContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { ThemeWrapper } from "../components/ThemeWrapper";

SystemUI.setBackgroundColorAsync("transparent");

export default function Layout() {
  const insets = useSafeAreaInsets();

  const [fontsLoaded] = useFonts({
    "Montserrat-Regular": require("../assets/fonts/Montserrat-Regular.ttf"),
    "Montserrat-Bold": require("../assets/fonts/Montserrat-Bold.ttf"),
    "Oswald-Regular": require("../assets/fonts/Oswald-Regular.ttf"),
    "Oswald-Bold": require("../assets/fonts/Oswald-Bold.ttf"),
    "BebasNeue-Regular": require("../assets/fonts/BebasNeue-Regular.ttf"),
  });

  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  const toggleDrawer = () => {
    setIsDrawerVisible(!isDrawerVisible);
  };

  const closeDrawer = () => {
    setIsDrawerVisible(false);
  };

  return (
    <ThemeProvider>
      <ThemeWrapper>
        <LanguageProvider>
          <>
            <StatusBar style="auto" translucent />
            <SafeAreaView
              className="h-full"
              style={{
                backgroundColor: "transparent",
                paddingTop: insets.top,
                paddingLeft: insets.left,
                paddingBottom: insets.bottom,
                paddingRight: insets.right,
              }}
            >
              <View className="w-full max-w-2xl h-full">
                <View className="bg-background h-full">
                  <Header
                    onToggleDrawer={toggleDrawer}
                    isDrawerVisible={isDrawerVisible}
                  />
                  <Slot />
                </View>
              </View>
            </SafeAreaView>

            {/* Drawer rendered at root level for proper layering */}
            <Settings isDrawerVisible={isDrawerVisible} onClose={closeDrawer} />
          </>
        </LanguageProvider>
      </ThemeWrapper>
    </ThemeProvider>
  );
}
