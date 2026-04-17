import { useLanguage } from "@/contexts/LanguageContext";
import { translate, type Language } from "@shared/utils";
import en from "@shared/locales/en.json";
import no from "@shared/locales/no.json";
import nn from "@shared/locales/nn.json";

const translations: Record<Language, Record<string, string>> = { en, no, nn };

export function useTranslation() {
  const { language } = useLanguage();
  return (key: string, variables?: Record<string, string | number>) =>
    translate(translations, language, key, variables);
}
