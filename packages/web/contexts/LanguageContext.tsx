"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Language } from "@shared/utils";

const STORAGE_KEY = "rekkferga-language";
const DEFAULT_LANG: Language = "no";
const LANGUAGES: readonly Language[] = ["en", "no", "nn"];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: DEFAULT_LANG,
  setLanguage: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLang] = useState<Language>(DEFAULT_LANG);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved && LANGUAGES.includes(saved)) setLang(saved);
    } catch {
      /* storage unavailable — keep the default */
    }
  }, []);

  // Screen readers pick their voice from <html lang>, so it follows the chosen language.
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLang(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* storage unavailable — applies to this visit only */
    }
  }, []);

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
