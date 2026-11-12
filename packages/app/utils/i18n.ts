import AsyncStorage from "@react-native-async-storage/async-storage";
import { translate, translateList, type Language, type Translations } from "@shared/utils";

interface Option {
  value: string;
  name: string;
  icon: string;
}
import en from "@shared/locales/en.json";
import no from "@shared/locales/no.json";
import nn from "@shared/locales/nn.json";

export type { Language };

const translations: Translations = { en, no, nn };

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

  /** A string by dotted path ("trip.arrived"); nn → no → en fallback (shared translate). */
  t(key: string, variables?: Record<string, string | number>): string {
    const translation = translate(translations, this.currentLanguage, key, variables);
    if (translation === key) {
      console.warn(`Translation missing for key: ${key} in language: ${this.currentLanguage}`);
    }
    return translation;
  }

  /** A list of strings by dotted path ("drive.rush.4to6"). */
  list(key: string): string[] {
    return translateList(translations, this.currentLanguage, key);
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  getAllLanguages(): Option[] {
    return [
      { value: "nn", name: "nynorsk", icon: "🇳🇴" },
      { value: "no", name: "bokmal", icon: "🇩🇰" },
      { value: "en", name: "english", icon: "🇬🇧" },
    ];
  }
}

// Create singleton instance
export const i18n = new I18n();

// Convenience function
export const t = (
  key: string,
  variables?: Record<string, string | number>
): string => i18n.t(key, variables);
