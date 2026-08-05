import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/lib/i18n/routing";
import {
  getTeamOfTheWeekFromDb,
  matchRepository,
  standingsRepository,
} from "@/lib/repositories";
import { BOTOLA_2 } from "@/lib/api-football/constants";
import { AdSlot } from "@/components/ads/AdSlot";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { CompetitionHeader } from "@/components/competition/CompetitionHeader";
import { CompetitionMatchesSidebar } from "@/components/competition/CompetitionMatchesSidebar";
import { CompetitionMainTabs } from "@/components/competition/CompetitionMainTabs";
import { buildCanonical, buildLanguageAlternates } from "@/lib/seo/alternates";

export const revalidate = 60;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "competition2" });
  const title = t("metaTitle");
  const description = t("metaDescription");

  return {
    title,
    description,
    alternates: {
      canonical: buildCanonical(locale, "/botola-2"),
      languages: buildLanguageAlternates("/botola-2"),
    },
    openGraph: { title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function Botola2Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [matches, standings, totw, t, tNav, tCommon, tStandings, tPlayer] =
    await Promise.all([
      matchRepository.getByCompetition(BOTOLA_2.id),
      standingsRepository.getStandings(BOTOLA_2.id),
      getTeamOfTheWeekFromDb(BOTOLA_2.id),
      getTranslations({ locale, namespace: "competition2" }),
      getTranslations({ locale, namespace: "nav" }),
      getTranslations({ locale, namespace: "common" }),
      getTranslations({ locale, namespace: "standings" }),
      getTranslations({ locale, namespace: "player" }),
    ]);

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-5 px-4 py-5 sm:px-6 xl:px-8">
      <Breadcrumbs
        locale={locale}
        items={[
          { name: tNav("home"), href: "/" },
          { name: tNav("botola2"), href: "/botola-2" },
        ]}
      />

      <CompetitionHeader
        name={t("name")}
        logoUrl="/media/leagues/201.png"
        country={t("country")}
        season={t("season")}
        seasonProgress={42}
        seasonStart={t("seasonStart")}
        seasonEnd={t("seasonEnd")}
        favouriteLabel={t("favourite")}
        followersLabel={t("followers")}
      />

      <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)_280px]">
        <div className="order-2 min-w-0 xl:order-1">
          <CompetitionMatchesSidebar
            matches={matches}
            labels={{
              matches: t("matches"),
              byRound: t("byRound"),
              byDate: t("byDate"),
              round: tCommon("matchday"),
              finished: tCommon("finished"),
              live: tCommon("live"),
              featured: t("featured"),
            }}
          />
        </div>

        <div className="order-1 min-w-0 xl:order-2">
          <CompetitionMainTabs
            standings={standings}
            matches={matches}
            topScorers={[]}
            totw={totw}
            labels={{
              standings: t("tabStandings"),
              stats: t("tabStats"),
              details: t("tabDetails"),
              media: t("tabMedia"),
              all: t("filterAll"),
              home: t("filterHome"),
              away: t("filterAway"),
              team: tStandings("team"),
              played: tStandings("played"),
              won: tStandings("won"),
              drawn: tStandings("drawn"),
              lost: tStandings("lost"),
              diff: tStandings("goalDifference"),
              goals: tCommon("goals"),
              form: tStandings("form"),
              points: tStandings("points"),
              continental: tStandings("continental"),
              relegation: tStandings("relegation"),
              playerStats: t("playerStats"),
              general: t("statGeneral"),
              attack: t("statAttack"),
              defense: t("statDefense"),
              passing: t("statPassing"),
              goalkeeping: t("statGoalkeeping"),
              player: tPlayer("profile"),
              rating: tPlayer("rating"),
              assists: tPlayer("assists"),
              appearances: tPlayer("appearances"),
              noMedia: t("noMedia"),
              live: tCommon("live"),
              detailsBody: t("detailsBody"),
              countryLabel: t("countryLabel"),
              countryValue: t("country"),
              seasonLabel: t("seasonLabel"),
              seasonValue: t("season"),
              teamsLabel: t("teamsLabel"),
              teamsValue: "16",
            }}
          />
        </div>

        <aside className="order-3 flex flex-col gap-5 xl:sticky xl:top-20 xl:h-fit">
          <AdSlot placement="sidebar-rectangle" className="flex lg:flex" />
          <AdSlot placement="sidebar-rectangle" className="flex lg:flex" />
        </aside>
      </div>
    </div>
  );
}
