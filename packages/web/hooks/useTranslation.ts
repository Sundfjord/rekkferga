import { useLanguage } from "@/contexts/LanguageContext";
import { translate, translateList, type Translations } from "@shared/utils";
import en from "@shared/locales/en.json";
import no from "@shared/locales/no.json";
import nn from "@shared/locales/nn.json";

const translations: Translations = { en, no, nn };

export type Translate = ((key: string, variables?: Record<string, string | number>) => string) & {
  /** A list of strings, e.g. t.list("drive.rush.4to6"). */
  list: (key: string) => string[];
};

/** `t("group.key", vars)` for strings, `t.list("group.key")` for lists. */
export function useTranslation(): Translate {
  const { language } = useLanguage();
  return Object.assign(
    (key: string, variables?: Record<string, string | number>) => translate(translations, language, key, variables),
    { list: (key: string) => translateList(translations, language, key) },
  );
}
