import type { Metadata } from "next";
import Image from "next/image";
import { cache } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { type Locale } from "@/lib/i18n/routing";
import { formatKickoffTime, formatMatchdayDate } from "@/lib/i18n/format";
import {
  matchRepository,
  playerRepository,
  standingsRepository,
  teamRepository,
} from "@/lib/repositories";
import { ensureFixtureDetails } from "@/lib/api-football/sync";
import { displaySeasonRating } from "@/lib/rating";
import type {
  Match,
  MatchGoalEvent,
  MatchStats,
  PlayerSeasonStats,
} from "@/lib/types";
import { MatchStatusBadge } from "@/components/match/MatchStatusBadge";
import { ScoreDisplay } from "@/components/match/ScoreDisplay";
import { MatchTabs } from "@/components/match/MatchTabs";
import { MatchStandingsTable } from "@/components/standings/MatchStandingsTable";
import { AdSlot } from "@/components/ads/AdSlot";
import { StatsComparisonRow } from "@/components/stats/StatsComparisonRow";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { LineupsPanel } from "@/components/match/LineupsPanel";
import { MatchOverview } from "@/components/match/MatchOverview";
import { buildCanonical, buildLanguageAlternates } from "@/lib/seo/alternates";
import { buildSportsEventJsonLd, JsonLd } from "@/lib/seo/jsonld";

export const revalidate = 30;

export function generateStaticParams() {
  return [];
}

// Shared per-request so generateMetadata and the page body don't each fetch
// the same match separately.
const getMatch = cache((slug: string) => matchRepository.getBySlug(slug));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const match = await getMatch(slug);
  if (!match) return {};

  const title = `${match.homeTeam.name} vs ${match.awayTeam.name}`;
  const description =
    match.status === "upcoming"
      ? `${match.homeTeam.name} - ${match.awayTeam.name}, ${formatMatchdayDate(match.kickoff, locale as Locale)} ${formatKickoffTime(match.kickoff, locale as Locale)}`
      : `${match.homeTeam.name} ${match.homeScore}-${match.awayScore} ${match.awayTeam.name}`;

  return {
    title,
    description,
    alternates: {
      canonical: buildCanonical(locale, `/match/${slug}`),
      languages: buildLanguageAlternates(`/match/${slug}`),
    },
    openGraph: {
      title,
      description,
      url: buildCanonical(locale, `/match/${slug}`),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function MatchPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const match = await getMatch(slug);
  if (!match) notFound();

  // On-demand: pull lineups/stats/events once (Free plan — 3 req per match)
  if (match.status === "finished" || match.status === "live") {
    await ensureFixtureDetails(match.id).catch(() => false);
  }

  const competitionId = match.competitionId;

  const [homeStanding, awayStanding, t, tCommon, tStandings, tPlayer] =
    await Promise.all([
      standingsRepository.getTeamStanding(competitionId, match.homeTeam.slug),
      standingsRepository.getTeamStanding(competitionId, match.awayTeam.slug),
      getTranslations({ locale, namespace: "match" }),
      getTranslations({ locale, namespace: "common" }),
      getTranslations({ locale, namespace: "standings" }),
      getTranslations({ locale, namespace: "player" }),
    ]);

  const [standings, lineups, matchStats, goalEvents, timeline, homeRecent, awayRecent, allMatches] =
    await Promise.all([
      standingsRepository.getStandings(competitionId),
      matchRepository.getLineups(match.id),
      matchRepository.getStats(match.id),
      matchRepository.getGoalEvents(match.id),
      matchRepository.getTimelineEvents(match.id),
      teamRepository.getRecentMatches(match.homeTeam.slug, 5),
      teamRepository.getRecentMatches(match.awayTeam.slug, 5),
      matchRepository.getByCompetition(competitionId),
    ]);

  const previousMeetings = allMatches
    .filter(
      (m) =>
        m.id !== match.id &&
        m.status === "finished" &&
        ((m.homeTeam.slug === match.homeTeam.slug &&
          m.awayTeam.slug === match.awayTeam.slug) ||
          (m.homeTeam.slug === match.awayTeam.slug &&
            m.awayTeam.slug === match.homeTeam.slug))
    )
    .sort(
      (a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime()
    );

  const homeLineup = lineups.find((l) => l.teamId === match.homeTeam.id);
  const awayLineup = lineups.find((l) => l.teamId === match.awayTeam.id);

  const allLineupPlayers = lineups.flatMap((l) => [
    ...l.startingXI,
    ...l.substitutes,
  ]);

  const goalsByPlayerApiId = new Map<number, number>();
  for (const g of goalEvents) {
    if (g.detail === "Own Goal") continue;
    goalsByPlayerApiId.set(
      g.playerApiId,
      (goalsByPlayerApiId.get(g.playerApiId) ?? 0) + 1
    );
  }

  const playerIds = allLineupPlayers.map((p) => p.id);
  const seasonById = await playerRepository.getSeasonStatsForPlayers(playerIds);

  const statsEntries = allLineupPlayers.map((p) => {
    const season = seasonById[p.id] ?? null;
    const apiIdMatch = p.slug.match(/-(\d+)$/) || p.id.match(/(\d+)$/);
    const apiId = apiIdMatch ? Number(apiIdMatch[1]) : 0;
    const matchGoals = goalsByPlayerApiId.get(apiId) ?? 0;
    const rating =
      season != null
        ? season.averageRating
        : displaySeasonRating({ goals: matchGoals, assists: 0 });
    const merged: PlayerSeasonStats = {
      playerId: p.id,
      season: season?.season ?? String(new Date().getFullYear()),
      appearances: season?.appearances ?? 0,
      goals: season?.goals ?? matchGoals,
      assists: season?.assists ?? 0,
      yellowCards: season?.yellowCards ?? 0,
      redCards: season?.redCards ?? 0,
      averageRating: rating,
    };
    return [p.id, merged] as const;
  });
  const statsById: Record<string, PlayerSeasonStats | null> =
    Object.fromEntries(statsEntries);

  const homeGoals = goalEvents.filter((e) => e.side === "home");
  const awayGoals = goalEvents.filter((e) => e.side === "away");

  const kickoffLabel = `${formatMatchdayDate(match.kickoff, locale as Locale)} · ${formatKickoffTime(match.kickoff, locale as Locale)}`;
  const statusLabel =
    match.status === "live"
      ? `${match.minute}'`
      : match.status === "finished"
        ? tCommon("finished")
        : formatKickoffTime(match.kickoff, locale as Locale);

  const tNav = await getTranslations({ locale, namespace: "nav" });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 xl:px-8">
      <h1 className="sr-only">
        {match.homeTeam.name} vs {match.awayTeam.name}
      </h1>
      <JsonLd data={buildSportsEventJsonLd(match, `/${locale}/match/${slug}`)} />
      <AdSlot placement="header-leaderboard" />

      <Breadcrumbs
        locale={locale}
        items={[
          { name: tNav("home"), href: "/" },
          { name: tNav("botolaPro"), href: "/botola-pro" },
          {
            name: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
            href: `/match/${slug}`,
          },
        ]}
      />

      <MatchHeader
        match={match}
        statusLabel={statusLabel}
        kickoffLabel={kickoffLabel}
        matchdayLabel={tCommon("matchday")}
        venueLabel={tCommon("venue")}
        homeGoals={homeGoals}
        awayGoals={awayGoals}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <MatchTabs
          defaultValue="overview"
          tabs={[
            {
              value: "overview",
              label: t("overview"),
              content: (
                <MatchOverview
                  match={match}
                  locale={locale as Locale}
                  homeStanding={homeStanding}
                  awayStanding={awayStanding}
                  homeLineup={homeLineup}
                  awayLineup={awayLineup}
                  timeline={timeline}
                  homeRecent={homeRecent.filter((m) => m.id !== match.id)}
                  awayRecent={awayRecent.filter((m) => m.id !== match.id)}
                  previousMeetings={previousMeetings}
                  labels={{
                    matchInfo: t("matchInfo"),
                    matchday: tCommon("matchday"),
                    venue: tCommon("venue"),
                    kickoff: t("kickoff"),
                    timeline: t("timeline"),
                    noEvents: t("noEvents"),
                    teamComparison: t("teamComparison"),
                    position: tStandings("position"),
                    points: tStandings("points"),
                    played: tStandings("played"),
                    won: tStandings("won"),
                    drawn: tStandings("drawn"),
                    lost: tStandings("lost"),
                    goalsFor: tStandings("goalsFor"),
                    goalsAgainst: tStandings("goalsAgainst"),
                    form: tStandings("form"),
                    formations: t("formations"),
                    coach: t("coach"),
                    recentForm: t("recentForm"),
                    previousMeetings: t("previousMeetings"),
                    noPreviousMeetings: t("noPreviousMeetings"),
                    goal: t("eventGoal"),
                    penalty: t("eventPenalty"),
                    ownGoal: t("eventOwnGoal"),
                    yellowCard: t("eventYellow"),
                    redCard: t("eventRed"),
                    substitution: t("eventSubst"),
                  }}
                />
              ),
            },
            {
              value: "lineups",
              label: t("lineups"),
              content:
                homeLineup && awayLineup ? (
                  <LineupsPanel
                    match={match}
                    homeLineup={homeLineup}
                    awayLineup={awayLineup}
                    statsById={statsById}
                    labels={{
                      lineups: t("lineups"),
                      playerStats: t("playerStats"),
                      substitutes: t("substitutes"),
                      rating: tPlayer("rating"),
                      goals: tCommon("goals"),
                      assists: tPlayer("assists"),
                      player: tPlayer("profile"),
                    }}
                  />
                ) : (
                  <p className="rounded-lg border border-dashed border-border p-8 text-center text-base text-muted-foreground">
                    {t("noLineups")}
                  </p>
                ),
            },
            {
              value: "stats",
              label: t("stats"),
              content: (
                <StatsTab
                  stats={matchStats}
                  labels={{
                    possession: t("possession"),
                    shots: t("shots"),
                    shotsOnTarget: t("shotsOnTarget"),
                    corners: t("corners"),
                    fouls: t("fouls"),
                    yellowCards: t("yellowCards"),
                    redCards: t("redCards"),
                  }}
                  noStatsLabel={t("noStats")}
                />
              ),
            },
            {
              value: "standings",
              label: t("standings"),
              content: (
                <MatchStandingsTable
                  standings={standings}
                  match={match}
                  locale={locale}
                />
              ),
            },
          ]}
        />

        <aside className="flex flex-col gap-6 lg:sticky lg:top-20 lg:h-fit">
          <AdSlot placement="sidebar-rectangle" />
          <AdSlot placement="sidebar-rectangle" />
        </aside>
      </div>
    </div>
  );
}

function formatGoalMinute(g: MatchGoalEvent): string {
  if (g.extraMinute) return `${g.minute}+${g.extraMinute}'`;
  return `${g.minute}'`;
}

function shortScorerName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return parts[parts.length - 1];
}

function MatchHeader({
  match,
  statusLabel,
  kickoffLabel,
  matchdayLabel,
  venueLabel,
  homeGoals,
  awayGoals,
}: {
  match: Match;
  statusLabel: string;
  kickoffLabel: string;
  matchdayLabel: string;
  venueLabel: string;
  homeGoals: MatchGoalEvent[];
  awayGoals: MatchGoalEvent[];
}) {
  return (
    <header className="flex flex-col items-center gap-4 border-b border-border pb-6">
      <p className="text-xs text-muted-foreground">
        {matchdayLabel} {match.matchday}
        {match.venue && (
          <>
            <span aria-hidden="true"> · </span>
            <span className="sr-only">{venueLabel}: </span>
            {match.venue}
          </>
        )}
      </p>

      <div className="flex w-full items-center justify-center gap-4 sm:gap-10">
        <TeamBlock
          name={match.homeTeam.name}
          badgeUrl={match.homeTeam.badgeUrl}
          slug={match.homeTeam.slug}
        />

        <div className="flex flex-col items-center gap-2">
          <MatchStatusBadge status={match.status} label={statusLabel} />
          {match.status === "upcoming" ? (
            <p className="text-fluid-lg font-semibold text-foreground">
              {kickoffLabel}
            </p>
          ) : (
            <ScoreDisplay
              homeScore={match.homeScore}
              awayScore={match.awayScore}
              status={match.status}
            />
          )}
        </div>

        <TeamBlock
          name={match.awayTeam.name}
          badgeUrl={match.awayTeam.badgeUrl}
          slug={match.awayTeam.slug}
        />
      </div>

      {(homeGoals.length > 0 || awayGoals.length > 0) && (
        <div className="grid w-full max-w-2xl grid-cols-2 gap-4 text-xs sm:text-sm">
          <ul className="flex flex-col items-end gap-0.5 text-muted-foreground">
            {homeGoals.map((g, i) => (
              <li key={`h-${g.minute}-${g.playerApiId}-${i}`}>
                <span className="text-foreground">
                  {shortScorerName(g.playerName)}
                </span>
                {g.detail === "Penalty" && (
                  <span className="text-muted-foreground"> (P)</span>
                )}
                {g.detail === "Own Goal" && (
                  <span className="text-muted-foreground"> (OG)</span>
                )}{" "}
                {formatGoalMinute(g)}
              </li>
            ))}
          </ul>
          <ul className="flex flex-col items-start gap-0.5 text-muted-foreground">
            {awayGoals.map((g, i) => (
              <li key={`a-${g.minute}-${g.playerApiId}-${i}`}>
                {formatGoalMinute(g)}{" "}
                <span className="text-foreground">
                  {shortScorerName(g.playerName)}
                </span>
                {g.detail === "Penalty" && (
                  <span className="text-muted-foreground"> (P)</span>
                )}
                {g.detail === "Own Goal" && (
                  <span className="text-muted-foreground"> (OG)</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}

function TeamBlock({
  name,
  badgeUrl,
  slug,
}: {
  name: string;
  badgeUrl: string;
  slug: string;
}) {
  return (
    <Link
      href={`/team/${slug}`}
      className="flex min-w-0 max-w-[9rem] flex-1 flex-col items-center gap-2 text-center sm:max-w-[12rem]"
    >
      <Image
        src={badgeUrl}
        alt={name}
        width={56}
        height={56}
        className="size-[56px] shrink-0 sm:size-14"
      />
      <span className="line-clamp-2 text-sm font-semibold text-foreground sm:text-base">
        {name}
      </span>
    </Link>
  );
}

function StatsTab({
  stats,
  labels,
  noStatsLabel,
}: {
  stats: MatchStats | null;
  labels: Record<
    | "possession"
    | "shots"
    | "shotsOnTarget"
    | "corners"
    | "fouls"
    | "yellowCards"
    | "redCards",
    string
  >;
  noStatsLabel: string;
}) {
  if (!stats) {
    return (
      <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        {noStatsLabel}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-border bg-card p-4">
      <StatsComparisonRow
        label={labels.possession}
        homeValue={stats.home.possession}
        awayValue={stats.away.possession}
        suffix="%"
      />
      <StatsComparisonRow
        label={labels.shots}
        homeValue={stats.home.shots}
        awayValue={stats.away.shots}
      />
      <StatsComparisonRow
        label={labels.shotsOnTarget}
        homeValue={stats.home.shotsOnTarget}
        awayValue={stats.away.shotsOnTarget}
      />
      <StatsComparisonRow
        label={labels.corners}
        homeValue={stats.home.corners}
        awayValue={stats.away.corners}
      />
      <StatsComparisonRow
        label={labels.fouls}
        homeValue={stats.home.fouls}
        awayValue={stats.away.fouls}
      />
      <StatsComparisonRow
        label={labels.yellowCards}
        homeValue={stats.home.yellowCards}
        awayValue={stats.away.yellowCards}
      />
      <StatsComparisonRow
        label={labels.redCards}
        homeValue={stats.home.redCards}
        awayValue={stats.away.redCards}
      />
    </div>
  );
}
