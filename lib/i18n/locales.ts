import type { Locale } from "./routing";

export const localeConfig: Record<
  Locale,
  { label: string; dir: "ltr" | "rtl"; htmlLang: string }
> = {
  fr: { label: "Français", dir: "ltr", htmlLang: "fr" },
  ar: { label: "العربية", dir: "rtl", htmlLang: "ar" },
  en: { label: "English", dir: "ltr", htmlLang: "en" },
};

export function getDirection(locale: Locale): "ltr" | "rtl" {
  return localeConfig[locale].dir;
}
