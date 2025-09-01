# Theme Usage Guide

This guide explains how to use the new Material Design 2 theme system for React Native components, while maintaining compatibility with the existing theme switching functionality.

## Overview

The theme system provides two main features:

1. **Theme Mode Switching** - Manual control over light/dark/system themes (legacy functionality)
2. **Material Design 2 Colors** - Automatic color theming based on the current theme mode

## Available Hooks

### `useTheme()` - Theme Mode Control

Use this hook for theme switching functionality (compatibility with existing code):

```tsx
import { useTheme } from "../contexts/ThemeContext";

const MyComponent = () => {
  const { themeMode, isDark, setThemeMode } = useTheme();

  return (
    <View>
      <Text>Current theme: {themeMode}</Text>
      <Text>Is dark: {isDark ? "Yes" : "No"}</Text>
      <Button onPress={() => setThemeMode("dark")} title="Set Dark" />
    </View>
  );
};
```

### `useThemeColors()` - Material Design 2 Colors

Use this hook for accessing themed colors (new functionality):

```tsx
import { useThemeColors } from "../contexts/ThemeContext";

const MyComponent = () => {
  const { primary, secondary, textPrimary } = useThemeColors();

  return (
    <View>
      <Text style={{ color: primary }}>Primary colored text</Text>
      <Text style={{ color: secondary }}>Secondary colored text</Text>
      <Text style={{ color: textPrimary }}>Default text color</Text>
    </View>
  );
};
```

## Available Colors

### Primary Colors

- `primary` - Main primary color (Material Blue)
- `primaryLight` - Lighter variant
- `primaryDark` - Darker variant
- `primaryText` - Text color for primary elements
- `textOnPrimary` - Text color when on primary surface

### Secondary Colors

- `secondary` - Main secondary color (Material Orange)
- `secondaryLight` - Lighter variant
- `secondaryDark` - Darker variant
- `secondaryText` - Text color for secondary elements
- `textOnSecondary` - Text color when on secondary surface

### Surface Colors

- `surface` - Main surface color
- `surfaceVariant` - Variant surface color
- `background` - Background color

### Text Colors

- `textPrimary` - Primary text color
- `textSecondary` - Secondary text color
- `textDisabled` - Disabled text color

### State Colors

- `error` - Error state color
- `errorText` - Text on error surface
- `success` - Success state color
- `successText` - Text on success surface

## Using Themed Components

### ThemedActivityIndicator

Automatically uses the correct color based on the current theme:

```tsx
import { ThemedActivityIndicator } from '../components/ThemedActivityIndicator';

// Different variants
<ThemedActivityIndicator variant="primary" size="large" />
<ThemedActivityIndicator variant="secondary" size="small" />
<ThemedActivityIndicator variant="error" />
<ThemedActivityIndicator variant="success" />
<ThemedActivityIndicator variant="surface" />
```

### ThemedIcon

Automatically uses the correct color based on the current theme:

```tsx
import { ThemedIcon } from '../components/ThemedIcon';

// Different variants
<ThemedIcon name="home" variant="primary" size={24} />
<ThemedIcon name="star" variant="secondary" size={24} />
<ThemedIcon name="heart" variant="error" size={24} />
<ThemedIcon name="checkmark-circle" variant="success" size={24} />
<ThemedIcon name="settings" variant="text" size={24} />
```

## Using Theme Colors Directly

### With useThemeColors Hook

```tsx
import { useThemeColors } from "../contexts/ThemeContext";

const MyComponent = () => {
  const { primary, secondary, textPrimary } = useThemeColors();

  return (
    <View>
      <Text style={{ color: primary }}>Primary colored text</Text>
      <Text style={{ color: secondary }}>Secondary colored text</Text>
      <Text style={{ color: textPrimary }}>Default text color</Text>
    </View>
  );
};
```

### With Style Props

```tsx
const MyComponent = () => {
  const { primary, secondary } = useThemeColors();

  return (
    <View style={{ backgroundColor: primary }}>
      <Text style={{ color: secondary }}>Styled text</Text>
    </View>
  );
};
```

## Migration from Hardcoded Colors

### Before (Hardcoded)

```tsx
<ActivityIndicator color="#1976d2" size="large" />
<Icon name="home" color="#ff9800" size={24} />
<Text style={{ color: '#212121' }}>Text</Text>
```

### After (Themed)

```tsx
<ThemedActivityIndicator variant="primary" size="large" />
<ThemedIcon name="home" variant="secondary" size={24} />
<Text style={{ color: textPrimary }}>Text</Text>
```

## Theme Variants

### Primary Variant

- Use for main actions, primary buttons, and important UI elements
- Automatically provides good contrast in both light and dark themes

### Secondary Variant

- Use for secondary actions, links, and supporting UI elements
- Provides visual hierarchy and variety

### Surface Variant

- Use for text on surface backgrounds
- Ensures readability across different surfaces

### Error Variant

- Use for error states, validation messages, and destructive actions
- Provides clear visual feedback

### Success Variant

- Use for success states, confirmations, and positive feedback
- Provides clear visual confirmation

## Best Practices

1. **Use themed components** instead of hardcoded colors
2. **Choose appropriate variants** for semantic meaning
3. **Test in both themes** to ensure good contrast
4. **Use the useThemeColors hook** for custom styling needs
5. **Use the useTheme hook** for theme mode switching
6. **Avoid mixing** themed and hardcoded colors

## Example Implementation

```tsx
import React from "react";
import { View, Text } from "react-native";
import { ThemedActivityIndicator } from "./ThemedActivityIndicator";
import { ThemedIcon } from "./ThemedIcon";
import { useThemeColors } from "../contexts/ThemeContext";
import { useTheme } from "../contexts/ThemeContext";

export const MyComponent = () => {
  const { primary, surface } = useThemeColors();
  const { themeMode, setThemeMode } = useTheme();

  return (
    <View style={{ backgroundColor: surface }}>
      <ThemedIcon name="star" variant="primary" size={24} />
      <Text style={{ color: primary }}>Primary text</Text>
      <ThemedActivityIndicator variant="secondary" />
      <Text>Current theme: {themeMode}</Text>
      <Button onPress={() => setThemeMode("dark")} title="Switch to Dark" />
    </View>
  );
};
```

## Troubleshooting

### Theme not updating

- Ensure `ThemeProvider` wraps your app
- Check that `Appearance.addChangeListener` is working
- Verify system theme changes are detected

### Colors not applying

- Check that components are within `ThemeProvider`
- Use `useThemeColors()` for colors, not `useTheme()`
- Verify proper import paths

### Theme mode not switching

- Use `useTheme()` hook for theme mode control
- Check that `setThemeMode` is being called
- Verify AsyncStorage permissions

### Performance issues

- Theme context only updates when system theme changes
- Colors are computed once per theme change
- Minimal performance impact
