import React, { createContext, useContext, useEffect, useState } from "react";
import { Appearance, ColorSchemeName } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

interface ThemeColors {
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  onPrimary: string;

  // Background colors
  background: string;
  onBackground: string;

  // Surface colors
  surface: string;
  surfaceVariant: string;
  onSurface: string;

  // Border colors
  border: string;
  borderVariant: string;

  // State colors
  error: string;
  onError: string;
  success: string;
  onSuccess: string;
}

const lightColors: ThemeColors = {
  // Primary colors
  primary: "#2196f3",
  primaryLight: "#bbdefb",
  primaryDark: "#1565c0",
  onPrimary: "#ffffff",

  // Background colors
  background: "#bbdefb",
  onBackground: "#000000",

  // Surface colors
  surface: "#ffffff",
  surfaceVariant: "#eeeeee",
  onSurface: "#000000",

  // Border colors
  border: "#e0e0e0",
  borderVariant: "#bdbdbd",

  // Error colors
  error: "#d32f2f",
  onError: "#ffffff",

  // Success colors
  success: "#388e3c",
  onSuccess: "#ffffff",
};

const darkColors: ThemeColors = {
  // Primary colors
  primary: "#90caf9",
  primaryLight: "#e3f2fd",
  primaryDark: "#42a5f5",
  onPrimary: "#000000",

  // Background colors
  background: "#000000",
  onBackground: "#ffffff",

  // Surface colors
  surface: "#121212",
  surfaceVariant: "#1e1e1e",
  onSurface: "#ffffff",

  // Border colors
  border: "#424242",
  borderVariant: "#616161",

  // Error colors
  error: "#ef5350",
  onError: "#000000",

  // Success colors
  success: "#66bb6a",
  onSuccess: "#000000",
};

// Legacy theme context for Settings.tsx compatibility
const LegacyThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

// New Material Design 2 color context
const ThemeColorsContext = createContext<ThemeColors>(lightColors);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  // Determine if we should show dark theme based on current mode and system preference
  const isDark =
    themeMode === "dark" || (themeMode === "system" && colorScheme === "dark");

  // Compute colors based on the effective theme - this will update when either themeMode or colorScheme changes
  const colors = isDark ? darkColors : lightColors;

  useEffect(() => {
    // Load saved theme mode on app start
    loadThemeMode();
  }, []);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setColorScheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  const loadThemeMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem("themeMode");
      if (savedMode && ["light", "dark", "system"].includes(savedMode)) {
        setThemeModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      console.error("Failed to load theme mode:", error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem("themeMode", mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error("Failed to save theme mode:", error);
    }
  };

  const legacyThemeValue: ThemeContextType = {
    themeMode,
    isDark,
    setThemeMode,
  };

  return (
    <LegacyThemeContext.Provider value={legacyThemeValue}>
      <ThemeColorsContext.Provider value={colors}>
        {children}
      </ThemeColorsContext.Provider>
    </LegacyThemeContext.Provider>
  );
};

// Legacy theme hook for Settings.tsx compatibility
export const useTheme = () => {
  const context = useContext(LegacyThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// New Material Design 2 colors hook
export const useThemeColors = () => {
  const context = useContext(ThemeColorsContext);
  if (!context) {
    throw new Error("useThemeColors must be used within a ThemeProvider");
  }
  return context;
};

// Theme mode utilities
export const getAllThemeModes = () => {
  return [
    { value: "light", name: "light", icon: "☀️" },
    { value: "dark", name: "dark", icon: "🌙" },
    { value: "system", name: "system", icon: "🖥️" },
  ];
};
