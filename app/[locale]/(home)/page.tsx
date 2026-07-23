import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/lib/i18n/routing";
import { Link } from "@/lib/i18n/navigation";
import {
  matchRepository,
  playerRepository,
  standingsRepository,
} from "@/lib/repositories";
import { BOTOLA_PRO } from "@/data/matches.mock";
import { teamOfTheWeek, totwWeekLabel } from "@/data/totw.mock";
import type { Match, Standing, PlayerSeasonStats } from "@/lib/types";
import { MatchCard } from "@/components/match/MatchCard";
import { AdSlot } from "@/components/ads/AdSlot";
import { FormBadges } from "@/components/standings/FormBadges";
import { TeamOfTheWeek } from "@/components/home/TeamOfTheWeek";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  const t = await getTranslations({ locale, namespace: "home" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: buildCanonical(locale, "/"),
      languages: buildLanguageAlternates("/"),
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [matches, standings, t, tCommon, tStandings] = await Promise.all([
    matchRepository.getByCompetition(BOTOLA_PRO.id),
    standingsRepository.getStandings(BOTOLA_PRO.id),
    getTranslations({ locale, namespace: "home" }),
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "standings" }),
  ]);

  const totwStatsEntries = await Promise.all(
    teamOfTheWeek.startingXI.map(
      async (p) =>
        [p.id, await playerRepository.getSeasonStats(p.id)] as const
    )
  );
  const totwStatsById: Record<string, PlayerSeasonStats | null> =
    Object.fromEntries(totwStatsEntries);

  const live = matches.filter((m) => m.status === "live");
  const finished = matches.filter((m) => m.status === "finished");
  const upcoming = matches.filter((m) => m.status === "upcoming");

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-5 px-4 py-5 sm:px-6 xl:px-8">
      <h1 className="sr-only">{t("fixturesHeading")}</h1>

      <div className="grid gap-5 xl:grid-cols-[minmax(280px,380px)_minmax(0,1fr)_300px]">
        {/* Matches column */}
        <section className="min-w-0 order-1">
          <FixturesTabs
            all={matches}
            live={live}
            finished={finished}
            upcoming={upcoming}
            noMatchesLabel={t("noMatches")}
            tabLabels={{
              all: tCommon("all"),
              live: tCommon("live"),
              finished: tCommon("finished"),
              upcoming: tCommon("upcoming"),
            }}
          />
        </section>

        {/* Center: Team of the Week */}
        <section className="min-w-0 order-3 xl:order-2">
          <TeamOfTheWeek
            lineup={teamOfTheWeek}
            weekLabel={totwWeekLabel}
            statsById={totwStatsById}
          />
          <div className="mt-5">
            <StandingsSnippet
              standings={standings}
              heading={t("standingsHeading")}
              viewFullLabel={t("viewFullStandings")}
              formLabel={tStandings("form")}
            />
          </div>
        </section>

        {/* Ads column */}
        <aside className="flex flex-col gap-5 order-2 xl:order-3 xl:sticky xl:top-20 xl:h-fit">
          <AdSlot placement="sidebar-rectangle" />
          <AdSlot placement="sidebar-rectangle" />
        </aside>
      </div>
    </div>
  );
}

function MatchList({
  matches,
  emptyLabel,
}: {
  matches: Match[];
  emptyLabel: string;
}) {
  if (matches.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-8 text-center text-base text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-2.5">
        <span className="text-sm font-semibold text-foreground">Botola Pro</span>
      </div>
      <div className="flex flex-col divide-y divide-border">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} variant="row" />
        ))}
      </div>
    </div>
  );
}

function FixturesTabs({
  all,
  live,
  finished,
  upcoming,
  noMatchesLabel,
  tabLabels,
}: {
  all: Match[];
  live: Match[];
  finished: Match[];
  upcoming: Match[];
  noMatchesLabel: string;
  tabLabels: { all: string; live: string; finished: string; upcoming: string };
}) {
  return (
    <Tabs defaultValue="all" className="flex min-w-0 flex-col gap-3">
      <div className="overflow-x-auto">
        <TabsList className="h-11 w-full min-w-max sm:w-auto">
          <TabsTrigger value="all" className="px-3">
            {tabLabels.all}
          </TabsTrigger>
          <TabsTrigger value="live" className="px-3">
            {tabLabels.live}
            {live.length > 0 && (
              <span className="ms-1.5 inline-flex size-2 rounded-full bg-live motion-safe:animate-pulse motion-reduce:animate-none" />
            )}
            {live.length > 0 && (
              <span className="ms-1 text-xs tabular-nums">({live.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="finished" className="px-3">
            {tabLabels.finished}
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="px-3">
            {tabLabels.upcoming}
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="all">
        <MatchList matches={all} emptyLabel={noMatchesLabel} />
      </TabsContent>
      <TabsContent value="live">
        <MatchList matches={live} emptyLabel={noMatchesLabel} />
      </TabsContent>
      <TabsContent value="finished">
        <MatchList matches={finished} emptyLabel={noMatchesLabel} />
      </TabsContent>
      <TabsContent value="upcoming">
        <MatchList matches={upcoming} emptyLabel={noMatchesLabel} />
      </TabsContent>
    </Tabs>
  );
}

function StandingsSnippet({
  standings,
  heading,
  viewFullLabel,
  formLabel,
}: {
  standings: Standing[];
  heading: string;
  viewFullLabel: string;
  formLabel: string;
}) {
  const top = standings.slice(0, 5);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold text-foreground">{heading}</h2>
      </div>
      <ol className="flex flex-col">
        {top.map((row) => (
          <li
            key={row.team.id}
            className="flex items-center gap-2.5 border-b border-border px-4 py-2.5 last:border-0"
          >
            <span
              aria-hidden="true"
              className="w-5 shrink-0 text-sm font-semibold text-muted-foreground"
            >
              {row.position}
            </span>
            <Image
              src={row.team.badgeUrl}
              alt={row.team.name}
              width={24}
              height={24}
              className="size-6 shrink-0"
            />
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">
              {row.team.shortName}
            </span>
            <FormBadges
              form={row.form.slice(-3)}
              label={formLabel}
              className="hidden sm:flex"
            />
            <span className="w-8 shrink-0 text-end text-sm font-bold tabular-nums text-foreground">
              {row.points}
            </span>
          </li>
        ))}
      </ol>
      <Link
        href="/botola-pro"
        className="flex min-h-12 cursor-pointer items-center justify-center gap-1 border-t border-border px-4 text-sm font-medium text-link hover:bg-muted/50"
      >
        {viewFullLabel}
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
