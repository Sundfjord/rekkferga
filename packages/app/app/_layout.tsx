import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: background, paddingTop: insets.top }}>
      <View style={{ flex: 1, width: "100%", maxWidth: 672, backgroundColor: background }}>
        <Header />
        <View style={{ flex: 1 }}>
          <Slot />
        </View>
      </View>
    </View>
  );
}

export default function Layout() {
  useFonts({
    // Design system fonts
    "Syne-SemiBold": require("@expo-google-fonts/syne/600SemiBold/Syne_600SemiBold.ttf"),
    "Syne-Bold": require("@expo-google-fonts/syne/700Bold/Syne_700Bold.ttf"),
    "DMSans-Regular": require("@expo-google-fonts/dm-sans/400Regular/DMSans_400Regular.ttf"),
    "DMSans-Medium": require("@expo-google-fonts/dm-sans/500Medium/DMSans_500Medium.ttf"),
    "DMSans-SemiBold": require("@expo-google-fonts/dm-sans/600SemiBold/DMSans_600SemiBold.ttf"),
    "JetBrainsMono-Medium": require("@expo-google-fonts/jetbrains-mono/500Medium/JetBrainsMono_500Medium.ttf"),
    "JetBrainsMono-Bold": require("@expo-google-fonts/jetbrains-mono/700Bold/JetBrainsMono_700Bold.ttf"),
    // Legacy fonts kept in case referenced elsewhere
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
