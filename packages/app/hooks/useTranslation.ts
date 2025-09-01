import { useCallback } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { i18n } from "../utils/i18n";

export const useTranslation = () => {
  const { currentLanguage } = useLanguage();

  const t = useCallback(
    (key: string, variables?: Record<string, string | number>): string => {
      // This will re-run whenever currentLanguage changes
      return i18n.t(key, variables);
    },
    [currentLanguage]
  );

  return { t, currentLanguage };
};
