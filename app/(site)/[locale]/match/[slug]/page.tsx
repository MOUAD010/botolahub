import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { routing, type Locale } from "@/lib/i18n/routing";
import { formatKickoffTime, formatMatchdayDate } from "@/lib/i18n/format";
import {
  matchRepository,
  playerRepository,
  standingsRepository,
} from "@/lib/repositories";
import { BOTOLA_PRO, matches } from "@/data/matches.mock";
import type {
  Match,
  MatchStats,
  PlayerSeasonStats,
} from "@/lib/types";
import { MatchStatusBadge } from "@/components/match/MatchStatusBadge";
import { ScoreDisplay } from "@/components/match/ScoreDisplay";
import { MatchTabs } from "@/components/match/MatchTabs";
import { MatchCard } from "@/components/match/MatchCard";
import { MatchStandingsTable } from "@/components/standings/MatchStandingsTable";
import { FormBadges } from "@/components/standings/FormBadges";
import { AdSlot } from "@/components/ads/AdSlot";
import { StatsComparisonRow } from "@/components/stats/StatsComparisonRow";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { LineupsPanel } from "@/components/match/LineupsPanel";
import { buildCanonical, buildLanguageAlternates } from "@/lib/seo/alternates";
import { buildSportsEventJsonLd, JsonLd } from "@/lib/seo/jsonld";

export const revalidate = 30;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    matches.map((match) => ({ locale, slug: match.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const match = await matchRepository.getBySlug(slug);
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
  };
}

export default async function MatchPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const match = await matchRepository.getBySlug(slug);
  if (!match) notFound();

  const [homeStanding, awayStanding, allMatches, t, tCommon, tStandings, tPlayer] =
    await Promise.all([
      standingsRepository.getTeamStanding(BOTOLA_PRO.id, match.homeTeam.slug),
      standingsRepository.getTeamStanding(BOTOLA_PRO.id, match.awayTeam.slug),
      matchRepository.getByCompetition(BOTOLA_PRO.id),
      getTranslations({ locale, namespace: "match" }),
      getTranslations({ locale, namespace: "common" }),
      getTranslations({ locale, namespace: "standings" }),
      getTranslations({ locale, namespace: "player" }),
    ]);

  const [standings, lineups, matchStats] = await Promise.all([
    standingsRepository.getStandings(BOTOLA_PRO.id),
    matchRepository.getLineups(match.id),
    matchRepository.getStats(match.id),
  ]);

  const homeLineup = lineups.find((l) => l.teamId === match.homeTeam.id);
  const awayLineup = lineups.find((l) => l.teamId === match.awayTeam.id);

  const allLineupPlayers = lineups.flatMap((l) => [
    ...l.startingXI,
    ...l.substitutes,
  ]);
  const statsEntries = await Promise.all(
    allLineupPlayers.map(
      async (p) => [p.id, await playerRepository.getSeasonStats(p.id)] as const
    )
  );
  const statsById: Record<string, PlayerSeasonStats | null> =
    Object.fromEntries(statsEntries);

  const h2h = allMatches.filter(
    (m) =>
      m.id !== match.id &&
      m.status === "finished" &&
      ((m.homeTeam.slug === match.homeTeam.slug &&
        m.awayTeam.slug === match.awayTeam.slug) ||
        (m.homeTeam.slug === match.awayTeam.slug &&
          m.awayTeam.slug === match.homeTeam.slug))
  );

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
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <MatchTabs
          defaultValue="lineups"
          tabs={[
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
            {
              value: "h2h",
              label: t("h2h"),
              content: (
                <H2HTab matches={h2h} noDataLabel={t("noPreviousMeetings")} />
              ),
            },
            {
              value: "media",
              label: t("media"),
              content: <MediaTab label={t("noMedia")} />,
            },
            {
              value: "overview",
              label: t("overview"),
              content: (
                <OverviewTab
                  match={match}
                  homeStanding={homeStanding}
                  awayStanding={awayStanding}
                  leaguePositionLabel={t("leaguePosition")}
                  pointsLabel={tStandings("points")}
                  formLabel={tStandings("form")}
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

function MatchHeader({
  match,
  statusLabel,
  kickoffLabel,
  matchdayLabel,
  venueLabel,
}: {
  match: Match;
  statusLabel: string;
  kickoffLabel: string;
  matchdayLabel: string;
  venueLabel: string;
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

function MediaTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card p-12 text-center">
      <div className="flex aspect-video w-full max-w-lg items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <span className="text-base font-medium">{label}</span>
      </div>
    </div>
  );
}

function OverviewTab({
  match,
  homeStanding,
  awayStanding,
  leaguePositionLabel,
  pointsLabel,
  formLabel,
}: {
  match: Match;
  homeStanding: Awaited<
    ReturnType<typeof standingsRepository.getTeamStanding>
  >;
  awayStanding: Awaited<
    ReturnType<typeof standingsRepository.getTeamStanding>
  >;
  leaguePositionLabel: string;
  pointsLabel: string;
  formLabel: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          {leaguePositionLabel}
        </h2>
        <div className="flex flex-col gap-3">
          <TeamStandingRow
            name={match.homeTeam.shortName}
            badgeUrl={match.homeTeam.badgeUrl}
            standing={homeStanding}
            pointsLabel={pointsLabel}
            formLabel={formLabel}
          />
          <TeamStandingRow
            name={match.awayTeam.shortName}
            badgeUrl={match.awayTeam.badgeUrl}
            standing={awayStanding}
            pointsLabel={pointsLabel}
            formLabel={formLabel}
          />
        </div>
      </div>
    </div>
  );
}

function TeamStandingRow({
  name,
  badgeUrl,
  standing,
  pointsLabel,
  formLabel,
}: {
  name: string;
  badgeUrl: string;
  standing: Awaited<
    ReturnType<typeof standingsRepository.getTeamStanding>
  >;
  pointsLabel: string;
  formLabel: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-5 shrink-0 text-xs font-semibold text-muted-foreground">
        {standing?.position ?? "–"}
      </span>
      <Image
        src={badgeUrl}
        alt={name}
        width={22}
        height={22}
        className="size-[22px] shrink-0"
      />
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
        {name}
      </span>
      {standing && (
        <FormBadges form={standing.form.slice(-5)} label={formLabel} />
      )}
      <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">
        {standing?.points ?? "–"}{" "}
        <span className="font-normal text-muted-foreground">
          {pointsLabel}
        </span>
      </span>
    </div>
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

function H2HTab({
  matches: h2hMatches,
  noDataLabel,
}: {
  matches: Match[];
  noDataLabel: string;
}) {
  if (h2hMatches.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        {noDataLabel}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {h2hMatches.map((m) => (
        <MatchCard key={m.id} match={m} />
      ))}
    </div>
  );
}
