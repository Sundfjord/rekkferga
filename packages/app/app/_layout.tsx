import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "../global.css";
import * as SystemUI from "expo-system-ui";
import { useFonts } from "expo-font";
import Header from "../components/Header";
import { LanguageProvider } from "../contexts/LanguageContext";
import { ThemeProvider, useThemeColors } from "../contexts/ThemeContext";
import { ThemeWrapper } from "../components/ThemeWrapper";

SystemUI.setBackgroundColorAsync("transparent");

function AppShell() {
  const { background } = useThemeColors();

  return (
    <SafeAreaView className="h-full" style={{ backgroundColor: background }}>
      <View className="w-full max-w-2xl h-full" style={{ backgroundColor: background }}>
        <Header />
        <Slot />
      </View>
    </SafeAreaView>
  );
}

export default function Layout() {
  useFonts({
    "Montserrat-Regular": require("../assets/fonts/Montserrat-Regular.ttf"),
    "Montserrat-Bold": require("../assets/fonts/Montserrat-Bold.ttf"),
    "Oswald-Regular": require("../assets/fonts/Oswald-Regular.ttf"),
    "Oswald-Bold": require("../assets/fonts/Oswald-Bold.ttf"),
    "BebasNeue-Regular": require("../assets/fonts/BebasNeue-Regular.ttf"),
  });

  return (
    <ThemeProvider>
      <ThemeWrapper>
        <LanguageProvider>
          <>
            <StatusBar style="auto" translucent />
            <AppShell />
          </>
        </LanguageProvider>
      </ThemeWrapper>
    </ThemeProvider>
  );
}
