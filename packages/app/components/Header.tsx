import React, { useState } from "react";
import { View, Image, Pressable, Text, StyleSheet } from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import { useTheme, useThemeColors, ThemeMode } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { i18n, Language } from "../utils/i18n";

const ICON_COLOR = "#9ca3af"; // muted gray — matches web's text-gray-400
const ICON_COLOR_ACTIVE = "#2196f3";

type Section = "lang" | "theme" | null;

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
  { value: "light", label: "Light", icon: "sun" },
  { value: "dark",  label: "Dark",  icon: "moon" },
  { value: "system", label: "System", icon: "circle-half-stroke" },
];

export default function Header() {
  const { themeMode, setThemeMode } = useTheme();
  const { surface, onSurface, border } = useThemeColors();
  const { currentLanguage, setLanguage } = useLanguage();
  const [open, setOpen] = useState<Section>(null);

  const languages = i18n.getAllLanguages();
  // const currentLang = languages.find((l) => l.value === currentLanguage);
  const currentTheme = THEME_OPTIONS.find((t) => t.value === themeMode)!;

  const toggle = (section: Section) =>
    setOpen((prev) => (prev === section ? null : section));

  return (
    <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
      {/* Main row */}
      <View style={styles.row}>
        <Image
          source={require("../assets/images/logo-revised.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.controls}>
          {/* Language selector */}
          <Pressable onPress={() => toggle("lang")} style={styles.selectorButton} hitSlop={8}>
            {/* <Text style={styles.flag}>{currentLang?.icon ?? "🌐"}</Text> */}
            <Text style={[styles.selectorLabel, { color: ICON_COLOR }]}>
              {currentLanguage.toUpperCase()}
            </Text>
            <FontAwesome6
              name={open === "lang" ? "chevron-up" : "chevron-down"}
              size={10}
              color={ICON_COLOR}
            />
          </Pressable>

          {/* Divider */}
          <View style={[styles.dividerV, { backgroundColor: border }]} />

          {/* Theme selector */}
          <Pressable onPress={() => toggle("theme")} style={styles.selectorButton} hitSlop={8}>
            <FontAwesome6
              name={currentTheme.icon}
              size={15}
              color={ICON_COLOR}
            />
            <FontAwesome6
              name={open === "theme" ? "chevron-up" : "chevron-down"}
              size={10}
              color={ICON_COLOR}
            />
          </Pressable>
        </View>
      </View>

      {/* Language dropdown */}
      {open === "lang" && (
        <View style={[styles.dropdown, { borderTopColor: border }]}>
          {languages.map((lang) => {
            const active = currentLanguage === lang.value;
            return (
              <Pressable
                key={lang.value}
                onPress={() => { setLanguage(lang.value as Language); setOpen(null); }}
                style={[styles.dropdownItem, active && styles.dropdownItemActive]}
              >
                <Text style={styles.flag}>{lang.icon as string}</Text>
                <Text style={[styles.dropdownLabel, { color: onSurface }, active && styles.dropdownLabelActive]}>
                  {lang.name.charAt(0).toUpperCase() + lang.name.slice(1)}
                </Text>
                {active && <FontAwesome6 name="check" size={11} color={ICON_COLOR_ACTIVE} style={styles.checkIcon} />}
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Theme dropdown */}
      {open === "theme" && (
        <View style={[styles.dropdown, { borderTopColor: border }]}>
          {THEME_OPTIONS.map((opt) => {
            const active = themeMode === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => { setThemeMode(opt.value); setOpen(null); }}
                style={[styles.dropdownItem, active && styles.dropdownItemActive]}
              >
                <FontAwesome6
                  name={opt.icon}
                  size={15}
                  color={active ? ICON_COLOR_ACTIVE : ICON_COLOR}
                />
                <Text style={[styles.dropdownLabel, { color: onSurface }, active && styles.dropdownLabelActive]}>
                  {opt.label}
                </Text>
                {active && <FontAwesome6 name="check" size={11} color={ICON_COLOR_ACTIVE} style={styles.checkIcon} />}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 10,
    zIndex: 50,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  logo: {
    height: 50,
    width: 80,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  selectorButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  flag: {
    fontSize: 17,
    lineHeight: 21,
  },
  selectorLabel: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  dividerV: {
    width: 1,
    height: 18,
    opacity: 0.5,
  },
  dropdown: {
    borderTopWidth: 1,
    paddingVertical: 4,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  dropdownItemActive: {
    backgroundColor: "rgba(33,150,243,0.08)",
  },
  dropdownLabel: {
    fontSize: 14,
  },
  dropdownLabelActive: {
    fontWeight: "600",
  },
  checkIcon: {
    marginLeft: "auto" as any,
  },
});
