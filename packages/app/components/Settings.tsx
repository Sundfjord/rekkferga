import React from "react";
import { View } from "react-native";
import { useTranslation } from "@/hooks/useTranslation";
import { i18n, Language } from "../utils/i18n";
import { useLanguage } from "../contexts/LanguageContext";
import {
  getAllThemeModes,
  ThemeMode,
  useTheme,
} from "../contexts/ThemeContext";
import Drawer from "./Drawer";
import Dropdown from "./Dropdown";

interface SettingsProps {
  isDrawerVisible: boolean;
  onClose: () => void;
}

export default function Settings({ isDrawerVisible, onClose }: SettingsProps) {
  const { t } = useTranslation();
  const { currentLanguage, setLanguage } = useLanguage();
  const { themeMode, setThemeMode } = useTheme();
  const languageOptions = i18n.getAllLanguages();
  const themeOptions = getAllThemeModes();
  const selectedLanguage = i18n.getLanguageName(currentLanguage);

  return (
    <Drawer
      title={t("settings")}
      isVisible={isDrawerVisible}
      onClose={onClose}
      heightOffset={76}
    >
      <View className="flex-1 gap-4">
        <Dropdown
          title={t("language")}
          options={languageOptions}
          selectedOption={selectedLanguage}
          onPressOption={async (option) => {
            setLanguage(option.value as Language);
          }}
        />
        <View className="h-px mx-4 bg-background-on" />
        <Dropdown
          title={t("theme")}
          options={themeOptions}
          selectedOption={themeMode}
          onPressOption={async (option) => {
            setThemeMode(option.value as ThemeMode);
          }}
        />
      </View>
    </Drawer>
  );
}
