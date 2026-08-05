import type { Metadata } from "next";
import Image from "next/image";
import { cache } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/lib/i18n/routing";
import {
  getPrimaryCompetitionForTeam,
  standingsRepository,
  teamRepository,
} from "@/lib/repositories";
import type { PlayerPosition } from "@/lib/types";
import { FormBadges } from "@/components/standings/FormBadges";
import { AdSlot } from "@/components/ads/AdSlot";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { TeamPageTabs } from "@/components/team/TeamPageTabs";
import { buildCanonical, buildLanguageAlternates } from "@/lib/seo/alternates";
import { buildSportsTeamJsonLd, JsonLd } from "@/lib/seo/jsonld";

export const revalidate = 300;

export function generateStaticParams() {
  return [];
}

// Shared per-request so generateMetadata and the page body don't each fetch
// the same team separately.
const getTeam = cache((slug: string) => teamRepository.getBySlug(slug));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const team = await getTeam(slug);
  if (!team) return {};

  const description = `${team.name} — squad, form, standings, stats and trophies.`;

  return {
    title: team.name,
    description,
    alternates: {
      canonical: buildCanonical(locale, `/team/${slug}`),
      languages: buildLanguageAlternates(`/team/${slug}`),
    },
    openGraph: {
      title: team.name,
      description,
      url: buildCanonical(locale, `/team/${slug}`),
    },
    twitter: {
      card: "summary_large_image",
      title: team.name,
      description,
    },
  };
}

const POSITION_ORDER: PlayerPosition[] = ["GK", "DF", "MF", "FW"];

export default async function TeamPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const team = await getTeam(slug);
  if (!team) notFound();

  const competitionId = await getPrimaryCompetitionForTeam(team.id);

  const [
    squad,
    standing,
    allStandings,
    upcomingFixtures,
    recentMatches,
    trophies,
    t,
    tPlayer,
    tStandings,
    tHome,
    tNav,
    tCommon,
  ] = await Promise.all([
    teamRepository.getSquad(team.id),
    standingsRepository.getTeamStanding(competitionId, team.slug),
    standingsRepository.getStandings(competitionId),
    teamRepository.getUpcomingFixtures(team.slug),
    teamRepository.getRecentMatches(team.slug, 8),
    teamRepository.getTrophies(team.id),
    getTranslations({ locale, namespace: "team" }),
    getTranslations({ locale, namespace: "player" }),
    getTranslations({ locale, namespace: "standings" }),
    getTranslations({ locale, namespace: "home" }),
    getTranslations({ locale, namespace: "nav" }),
    getTranslations({ locale, namespace: "common" }),
  ]);

  const squadByPosition = POSITION_ORDER.map((position) => ({
    position,
    players: squad.filter((p) => p.position === position),
  })).filter((group) => group.players.length > 0);

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-5 px-4 py-5 sm:px-6 xl:px-8">
      <JsonLd data={buildSportsTeamJsonLd(team, `/${locale}/team/${slug}`)} />

      <Breadcrumbs
        locale={locale}
        items={[
          { name: tNav("home"), href: "/" },
          { name: tNav("botolaPro"), href: "/botola-pro" },
          { name: team.name, href: `/team/${slug}` },
        ]}
      />

      <header className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
        <Image
          src={team.badgeUrl}
          alt={team.name}
          width={80}
          height={80}
          className="mx-auto size-20 shrink-0 sm:mx-0"
        />
        <div className="min-w-0 flex-1 text-center sm:text-start">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {team.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {[team.city, team.venue, team.founded ? `${team.founded}` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {standing && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              <span className="rounded-md bg-primary/15 px-2.5 py-1 text-sm font-bold text-primary">
                #{standing.position} · {standing.points} {tStandings("points")}
              </span>
              <FormBadges
                form={standing.form.slice(-5)}
                label={tStandings("form")}
              />
            </div>
          )}
        </div>
        {trophies.length > 0 && (
          <div className="flex shrink-0 justify-center gap-3 sm:flex-col sm:items-end">
            <div className="text-center sm:text-end">
              <div className="text-2xl font-bold tabular-nums text-primary">
                {trophies.reduce((sum, tr) => sum + tr.count, 0)}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("trophies")}
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <TeamPageTabs
          team={team}
          squadByPosition={squadByPosition}
          standing={standing}
          allStandings={allStandings}
          recentMatches={recentMatches}
          upcomingFixtures={upcomingFixtures}
          trophies={trophies}
          labels={{
            matches: t("tabMatches"),
            squad: t("squad"),
            stats: t("tabStats"),
            standings: t("tabStandings"),
            trophies: t("trophies"),
            recentForm: t("recentForm"),
            latestMatches: t("latestMatches"),
            upcoming: t("upcomingFixtures"),
            noMatches: tHome("noMatches"),
            noTrophies: t("noTrophies"),
            played: tStandings("played"),
            won: tStandings("won"),
            drawn: tStandings("drawn"),
            lost: tStandings("lost"),
            goalsFor: tStandings("goalsFor"),
            goalsAgainst: tStandings("goalsAgainst"),
            goalDifference: tStandings("goalDifference"),
            points: tStandings("points"),
            form: tStandings("form"),
            team: tStandings("team"),
            positionLabels: {
              GK: tPlayer("positions.GK"),
              DF: tPlayer("positions.DF"),
              MF: tPlayer("positions.MF"),
              FW: tPlayer("positions.FW"),
            },
            seasons: t("seasons"),
          }}
        />

        <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:h-fit">
          <AdSlot placement="sidebar-rectangle" className="flex lg:flex" />
          {standing && (
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="mb-3 text-sm font-semibold text-foreground">
                {t("leaguePosition")}
              </h2>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold tabular-nums text-primary">
                  #{standing.position}
                </span>
                <span className="text-sm text-muted-foreground">
                  {standing.points} {tStandings("points")}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {tCommon("matchday")} · {standing.played} {tStandings("played")}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
