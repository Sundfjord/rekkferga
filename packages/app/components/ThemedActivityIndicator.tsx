import React from "react";
import { ActivityIndicator, ActivityIndicatorProps } from "react-native";
import { useThemeColors } from "../contexts/ThemeContext";

interface ThemedActivityIndicatorProps
  extends Omit<ActivityIndicatorProps, "color"> {
  variant?:
    | "primary"
    | "onPrimary"
    | "background"
    | "onBackground"
    | "surface"
    | "onSurface"
    | "error"
    | "onError"
    | "success"
    | "onSuccess";
  size?: "small" | "large";
}

export const ThemedActivityIndicator: React.FC<
  ThemedActivityIndicatorProps
> = ({ variant = "primary", size = "large", ...props }) => {
  const {
    primary,
    onPrimary,
    background,
    onBackground,
    surface,
    onSurface,
    error,
    onError,
    success,
    onSuccess,
  } = useThemeColors();

  const getColor = () => {
    switch (variant) {
      case "onPrimary":
        return onPrimary;
      case "background":
        return background;
      case "onBackground":
        return onBackground;
      case "surface":
        return surface;
      case "onSurface":
        return onSurface;
      case "error":
        return error;
      case "onError":
        return onError;
      case "success":
        return success;
      case "onSuccess":
        return onSuccess;
      default:
        return primary;
    }
  };

  return <ActivityIndicator color={getColor()} size={size} {...props} />;
};
