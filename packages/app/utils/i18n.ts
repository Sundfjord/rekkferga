import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Language } from "@shared/utils";

interface Option {
  value: string;
  name: string;
  icon: string;
}
import en from "@shared/locales/en.json";
import no from "@shared/locales/no.json";
import nn from "@shared/locales/nn.json";

export type { Language };

interface Translations {
  [key: string]: string;
}

const translations: Record<Language, Translations> = { en, no, nn };

class I18n {
  private currentLanguage: Language = "no"; // Default to Norwegian (Bokmål)
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Do not call loadLanguage here — AsyncStorage is not available at module
    // initialization time (before the React Native runtime is ready).
    // Call i18n.loadLanguage() explicitly from your root component instead.
  }

  async loadLanguage() {
    try {
      const savedLanguage = await AsyncStorage.getItem("selectedLanguage");
      if (savedLanguage && ["en", "no", "nn"].includes(savedLanguage)) {
        this.currentLanguage = savedLanguage as Language;
      }
    } catch (error) {
      console.log("Failed to load language setting:", error);
    }
  }

  async setLanguage(language: Language) {
    try {
      this.currentLanguage = language;
      await AsyncStorage.setItem("selectedLanguage", language);
      // Notify all listeners that language has changed
      this.notifyListeners();
    } catch (error) {
      console.log("Failed to save language setting:", error);
    }
  }

  // Add listener for language changes
  addListener(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback); // Return cleanup function
  }

  // Remove listener
  removeListener(callback: () => void) {
    this.listeners.delete(callback);
  }

  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach((callback) => callback());
  }

  t(key: string, variables?: Record<string, string | number>): string {
    let translation = translations[this.currentLanguage]?.[key];

    // If translation not found, try fallback logic
    if (!translation) {
      // Nynorsk falls back to Bokmål, then English, then key
      if (this.currentLanguage === "nn") {
        translation = translations.no[key] || translations.en[key] || key;
      } else {
        // Other languages fall back to English, then key
        translation = translations.en[key] || key;
      }

      if (translation === key) {
        console.warn(
          `Translation missing for key: ${key} in language: ${this.currentLanguage}`
        );
      }
    }

    // Replace variables if provided
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        translation = translation.replace(
          new RegExp(`{${key}}`, "g"),
          String(value)
        );
      });
    }

    return translation;
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  getLanguageName(language: Language): string {
    const names = {
      en: "english",
      no: "bokmal",
      nn: "nynorsk",
    };
    return names[language];
  }

  getLanguageCode(language: Language): string {
    return language;
  }

  getAllLanguages(): Option[] {
    return [
      { value: "nn", name: "nynorsk", icon: "🇳🇴" },
      { value: "no", name: "bokmal", icon: "🇩🇰" },
      { value: "en", name: "english", icon: "🇬🇧" },
    ];
  }

  // Debug method to check fallback behavior
  debugTranslation(key: string): {
    current: string | undefined;
    fallback: string | undefined;
    final: string;
  } {
    const current = translations[this.currentLanguage]?.[key];
    let fallback: string | undefined;

    if (this.currentLanguage === "nn" && !current) {
      fallback = translations.no[key];
    } else if (!current) {
      fallback = translations.en[key];
    }

    const final = this.t(key);

    return { current, fallback, final };
  }
}

// Create singleton instance
export const i18n = new I18n();

// Convenience function
export const t = (
  key: string,
  variables?: Record<string, string | number>
): string => i18n.t(key, variables);

// Debug function to check fallback behavior
export const debugTranslation = (key: string) => i18n.debugTranslation(key);
