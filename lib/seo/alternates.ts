import { routing } from "@/lib/i18n/routing";

/**
 * Builds the `alternates.languages` map Next.js expects for hreflang tags,
 * given a locale-agnostic path (e.g. "/botola-pro").
 */
export function buildLanguageAlternates(
  path: string
): Record<string, string> {
  const normalized = path === "/" ? "" : path;
  const languages: Record<string, string> = {};

  for (const locale of routing.locales) {
    languages[locale] = `/${locale}${normalized}`;
  }
  languages["x-default"] = `/${routing.defaultLocale}${normalized}`;

  return languages;
}

/**
 * Builds the locale-prefixed canonical URL for a locale-agnostic path.
 * Metadata `alternates.canonical` is resolved as a literal relative URL
 * against metadataBase — it does NOT go through next-intl's Link routing,
 * so the locale segment must be added explicitly here.
 */
export function buildCanonical(locale: string, path: string): string {
  const normalized = path === "/" ? "" : path;
  return `/${locale}${normalized}`;
}
