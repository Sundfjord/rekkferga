import React from "react";
import { useThemeColors } from "../contexts/ThemeContext";
import { FontAwesome6 } from "@expo/vector-icons";

interface ThemedIconProps {
  name: keyof typeof FontAwesome6.glyphMap;
  variant?:
    | "primary"
    | "onPrimary"
    | "background"
    | "onBackground"
    | "surface"
    | "onSurface"
    | "error"
    | "success"
    | "text";
  size?: number;
  style?: any;
  solid?: boolean;
  regular?: boolean;
  light?: boolean;
  thin?: boolean;
  duotone?: boolean;
  sharp?: boolean;
  sharpLight?: boolean;
  sharpSolid?: boolean;
  brand?: boolean;
}

export const ThemedIcon: React.FC<ThemedIconProps> = ({
  name,
  variant = "text",
  size = 24,
  style,
  solid,
  regular,
  light,
  ...props
}) => {
  const {
    primary,
    onPrimary,
    background,
    onBackground,
    surface,
    onSurface,
    error,
    success,
  } = useThemeColors();

  const getColor = () => {
    switch (variant) {
      case "primary":
        return primary;
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
      case "success":
        return success;
      default:
        return onPrimary;
    }
  };

  return (
    <FontAwesome6
      name={name}
      size={size}
      color={getColor()}
      style={style}
      solid={solid}
      regular={regular}
      {...props}
    />
  );
};

// Generic themed icon component for other icon libraries
interface GenericThemedIconProps {
  IconComponent: React.ComponentType<any>;
  name: string;
  variant?:
    | "primary"
    | "onPrimary"
    | "background"
    | "onBackground"
    | "surface"
    | "onSurface"
    | "error"
    | "success"
    | "text";
  size?: number;
  style?: any;
  [key: string]: any; // Allow additional props
}

export const GenericThemedIcon: React.FC<GenericThemedIconProps> = ({
  IconComponent,
  name,
  variant = "text",
  size = 24,
  style,
  ...props
}) => {
  const {
    primary,
    onPrimary,
    background,
    onBackground,
    surface,
    onSurface,
    error,
    success,
  } = useThemeColors();

  const getColor = () => {
    switch (variant) {
      case "primary":
        return primary;
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
      case "success":
        return success;
      default:
        return onPrimary;
    }
  };

  return (
    <IconComponent
      name={name}
      size={size}
      color={getColor()}
      style={style}
      {...props}
    />
  );
};
