import React, { useEffect } from "react";
import { Platform } from "react-native";
import { useTheme } from "../contexts/ThemeContext";

interface ThemeWrapperProps {
  children: React.ReactNode;
}

export const ThemeWrapper: React.FC<ThemeWrapperProps> = ({ children }) => {
  const { themeMode, isDark } = useTheme();

  useEffect(() => {
    if (Platform.OS !== "web") return;

    // Apply theme class to document root for CSS variables to work
    const root = document.documentElement;

    // Remove all theme classes first
    root.classList.remove("light", "dark", "system");

    // Add the appropriate theme class
    if (themeMode === "system") {
      root.classList.add("system");
    } else {
      root.classList.add(themeMode);
    }

    // Also add a data attribute for additional styling if needed
    root.setAttribute("data-theme", themeMode);
    root.setAttribute("data-is-dark", isDark.toString());
  }, [themeMode, isDark]);

  return <>{children}</>;
};
