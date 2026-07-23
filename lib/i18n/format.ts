import type { Locale } from "./routing";

const intlLocaleMap: Record<Locale, string> = {
  fr: "fr-MA",
  ar: "ar-MA",
  en: "en-GB",
};

export function toIntlLocale(locale: Locale): string {
  return intlLocaleMap[locale];
}

export function formatKickoffTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function formatMatchdayDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}
