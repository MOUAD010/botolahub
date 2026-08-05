import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { DirectionProvider } from "@/components/ui/direction";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Header } from "@/components/layout/Header";
import { MatchTicker } from "@/components/layout/MatchTicker";
import { routing, type Locale } from "@/lib/i18n/routing";
import { getDirection } from "@/lib/i18n/locales";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";
import { buildLanguageAlternates } from "@/lib/seo/alternates";
import {
  getHomeFixtures,
} from "@/lib/repositories";
import { PageviewTracker } from "@/components/analytics/PageviewTracker";
import { AdNetworkScript } from "@/components/ads/AdNetworkScript";
import "../../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  display: "swap",
  // Only the ar locale ever applies this font (see `bodyFont` below); without
  // this, Next.js eagerly preloads its ~160KB file on every fr/en page too.
  preload: false,
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      template: `%s | ${SITE_NAME}`,
      default: t("title"),
    },
    description: t("description"),
    alternates: {
      canonical: `/${locale}`,
      languages: buildLanguageAlternates("/"),
    },
    openGraph: {
      siteName: SITE_NAME,
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const dir = getDirection(locale as Locale);
  const bodyFont =
    dir === "rtl" ? "var(--font-arabic)" : "var(--font-geist-sans)";
  const arabicFontClass = dir === "rtl" ? notoSansArabic.variable : "";

  const weekMatches = await getHomeFixtures(7);

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${arabicFontClass} h-full antialiased`}
      style={{ "--font-sans": bodyFont } as React.CSSProperties}
    >
      <body className="flex min-h-full flex-col font-sans">
        <NextIntlClientProvider>
          <DirectionProvider direction={dir}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <TooltipProvider>
                <a
                  href="#main-content"
                  className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:inset-s-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-primary focus-visible:px-4 focus-visible:py-2 focus-visible:text-primary-foreground"
                >
                  Skip to content
                </a>
                <div className="sticky top-0 z-40">
                  <MatchTicker matches={weekMatches} />
                  <Header />
                </div>
                <main id="main-content" className="flex flex-1 flex-col">
                  {children}
                </main>
                <PageviewTracker />
                <AdNetworkScript />
              </TooltipProvider>
            </ThemeProvider>
          </DirectionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
