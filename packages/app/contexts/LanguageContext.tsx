import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { i18n, Language } from "../utils/i18n";

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => Promise<void>;
  refreshLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
}) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(
    i18n.getCurrentLanguage()
  );
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Load initial language
    const loadLanguage = async () => {
      await i18n.loadLanguage();
      setCurrentLanguage(i18n.getCurrentLanguage());
    };
    loadLanguage();

    // Listen for language changes from i18n utility
    const unsubscribe = i18n.addListener(() => {
      setCurrentLanguage(i18n.getCurrentLanguage());
      setRefreshKey((prev) => prev + 1);
    });

    // Cleanup listener on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  const setLanguage = async (language: Language) => {
    await i18n.setLanguage(language);
    setCurrentLanguage(language);
    // Trigger a refresh across the app
    setRefreshKey((prev) => prev + 1);
  };

  const refreshLanguage = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <LanguageContext.Provider
      value={{ currentLanguage, setLanguage, refreshLanguage }}
    >
      {children}
    </LanguageContext.Provider>
  );
};
