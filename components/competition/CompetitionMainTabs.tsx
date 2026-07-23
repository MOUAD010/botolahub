"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import type { Standing } from "@/lib/types";
import type { TopScorerEntry } from "@/lib/repositories/types";
import { FormBadges } from "@/components/standings/FormBadges";
import { PlayerAvatar } from "@/components/player/PlayerAvatar";
import { TeamOfTheWeek } from "@/components/home/TeamOfTheWeek";
import type { Lineup, PlayerSeasonStats } from "@/lib/types";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type VenueFilter = "all" | "home" | "away";
type StatCategory =
  | "general"
  | "attack"
  | "defense"
  | "passing"
  | "goalkeeping";

function formatDiff(diff: number): string {
  return diff > 0 ? `+${diff}` : `${diff}`;
}

function ratingTone(rating: number) {
  if (rating >= 7.5) return "bg-success text-success-foreground";
  if (rating >= 7) return "bg-emerald-600 text-white";
  if (rating >= 6.5) return "bg-amber-500 text-black";
  return "bg-muted text-muted-foreground";
}

/** Approximate home/away split from full standings for UI filters. */
function filterStandings(rows: Standing[], filter: VenueFilter): Standing[] {
  if (filter === "all") return rows;

  return rows
    .map((row) => {
      const homeShare = filter === "home" ? 0.58 : 0.42;
      const played = Math.max(1, Math.round(row.played * homeShare));
      const won = Math.round(row.won * homeShare);
      const drawn = Math.round(row.drawn * homeShare);
      const lost = Math.max(0, played - won - drawn);
      const goalsFor = Math.round(row.goalsFor * homeShare);
      const goalsAgainst = Math.round(row.goalsAgainst * homeShare);
      const points = won * 3 + drawn;
      return {
        ...row,
        played,
        won,
        drawn,
        lost,
        goalsFor,
        goalsAgainst,
        points,
      };
    })
    .sort((a, b) => b.points - a.points || b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst))
    .map((row, i) => ({ ...row, position: i + 1 }));
}

export function CompetitionMainTabs({
  standings,
  topScorers,
  totw,
  totwWeekLabel,
  totwStatsById,
  labels,
}: {
  standings: Standing[];
  topScorers: TopScorerEntry[];
  totw: Lineup;
  totwWeekLabel: string;
  totwStatsById: Record<string, PlayerSeasonStats | null>;
  labels: {
    standings: string;
    stats: string;
    details: string;
    media: string;
    all: string;
    home: string;
    away: string;
    team: string;
    played: string;
    won: string;
    drawn: string;
    lost: string;
    diff: string;
    goals: string;
    form: string;
    points: string;
    continental: string;
    relegation: string;
    playerStats: string;
    general: string;
    attack: string;
    defense: string;
    passing: string;
    goalkeeping: string;
    player: string;
    rating: string;
    assists: string;
    appearances: string;
    noMedia: string;
    detailsBody: string;
    countryLabel: string;
    countryValue: string;
    seasonLabel: string;
    seasonValue: string;
    teamsLabel: string;
    teamsValue: string;
  };
}) {
  const [venue, setVenue] = useState<VenueFilter>("all");
  const [statCat, setStatCat] = useState<StatCategory>("general");

  const filtered = useMemo(
    () => filterStandings(standings, venue),
    [standings, venue]
  );

  const hasContinental = standings.some((s) => s.zone === "continental");
  const hasRelegation = standings.some((s) => s.zone === "relegation");

  return (
    <Tabs defaultValue="standings" className="flex min-w-0 flex-col gap-4">
      <div className="overflow-x-auto border-b border-border">
        <TabsList variant="line" className="h-12 min-w-max bg-transparent p-0">
          <TabsTrigger value="standings" className="px-4 text-base">
            {labels.standings}
          </TabsTrigger>
          <TabsTrigger value="stats" className="px-4 text-base">
            {labels.stats}
          </TabsTrigger>
          <TabsTrigger value="details" className="px-4 text-base">
            {labels.details}
          </TabsTrigger>
          <TabsTrigger value="media" className="px-4 text-base">
            {labels.media}
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="standings" className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", labels.all],
              ["home", labels.home],
              ["away", labels.away],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setVenue(key)}
              className={cn(
                "cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                venue === key
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-3 py-3 text-start font-medium">#</th>
                <th className="px-2 py-3 text-start font-medium">
                  {labels.team}
                </th>
                <th className="px-2 py-3 text-center font-medium">
                  {labels.played}
                </th>
                <th className="px-2 py-3 text-center font-medium">
                  {labels.won}
                </th>
                <th className="px-2 py-3 text-center font-medium">
                  {labels.drawn}
                </th>
                <th className="px-2 py-3 text-center font-medium">
                  {labels.lost}
                </th>
                <th className="px-2 py-3 text-center font-medium">
                  {labels.diff}
                </th>
                <th className="px-2 py-3 text-center font-medium">
                  {labels.goals}
                </th>
                <th className="px-2 py-3 text-center font-medium">
                  {labels.form}
                </th>
                <th className="px-3 py-3 text-center font-bold">
                  {labels.points}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={`${venue}-${row.team.id}`}
                  className="border-b border-border last:border-0 hover:bg-muted/40"
                >
                  <td
                    className={cn(
                      "relative px-3 py-2.5 tabular-nums text-muted-foreground before:absolute before:inset-y-0 before:inset-s-0 before:w-1",
                      row.zone === "continental" && "before:bg-success",
                      row.zone === "relegation" && "before:bg-destructive"
                    )}
                  >
                    {row.position}
                  </td>
                  <td className="px-2 py-2.5">
                    <Link
                      href={`/team/${row.team.slug}`}
                      className="flex cursor-pointer items-center gap-2.5 font-medium text-foreground hover:underline"
                    >
                      <Image
                        src={row.team.badgeUrl}
                        alt=""
                        width={22}
                        height={22}
                        className="size-[22px]"
                      />
                      <span className="truncate">{row.team.name}</span>
                    </Link>
                  </td>
                  <td className="px-2 py-2.5 text-center tabular-nums">
                    {row.played}
                  </td>
                  <td className="px-2 py-2.5 text-center tabular-nums">
                    {row.won}
                  </td>
                  <td className="px-2 py-2.5 text-center tabular-nums">
                    {row.drawn}
                  </td>
                  <td className="px-2 py-2.5 text-center tabular-nums">
                    {row.lost}
                  </td>
                  <td className="px-2 py-2.5 text-center tabular-nums">
                    <span dir="ltr">
                      {formatDiff(row.goalsFor - row.goalsAgainst)}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-center tabular-nums text-muted-foreground">
                    <span dir="ltr">
                      {row.goalsFor}:{row.goalsAgainst}
                    </span>
                  </td>
                  <td className="px-2 py-2.5">
                    <FormBadges
                      form={row.form.slice(-5)}
                      label={labels.form}
                      className="justify-center"
                    />
                  </td>
                  <td className="px-3 py-2.5 text-center text-base font-bold tabular-nums">
                    {row.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(hasContinental || hasRelegation) && (
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {hasContinental && (
              <li className="flex items-center gap-2">
                <span className="inline-block h-3 w-1.5 rounded-sm bg-success" />
                {labels.continental}
              </li>
            )}
            {hasRelegation && (
              <li className="flex items-center gap-2">
                <span className="inline-block h-3 w-1.5 rounded-sm bg-destructive" />
                {labels.relegation}
              </li>
            )}
          </ul>
        )}
      </TabsContent>

      <TabsContent value="stats" className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-foreground">
          {labels.playerStats}
        </h2>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["general", labels.general],
              ["attack", labels.attack],
              ["defense", labels.defense],
              ["passing", labels.passing],
              ["goalkeeping", labels.goalkeeping],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatCat(key)}
              className={cn(
                "cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                statCat === key
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <PlayerStatsTable
          entries={topScorers}
          category={statCat}
          labels={labels}
        />
      </TabsContent>

      <TabsContent value="details" className="flex flex-col gap-5">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-base leading-relaxed text-muted-foreground">
            {labels.detailsBody}
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-muted/50 px-3 py-2.5">
              <dt className="text-xs text-muted-foreground">
                {labels.countryLabel}
              </dt>
              <dd className="text-base font-semibold text-foreground">
                {labels.countryValue}
              </dd>
            </div>
            <div className="rounded-lg bg-muted/50 px-3 py-2.5">
              <dt className="text-xs text-muted-foreground">
                {labels.seasonLabel}
              </dt>
              <dd className="text-base font-semibold text-foreground">
                {labels.seasonValue}
              </dd>
            </div>
            <div className="rounded-lg bg-muted/50 px-3 py-2.5">
              <dt className="text-xs text-muted-foreground">
                {labels.teamsLabel}
              </dt>
              <dd className="text-base font-semibold text-foreground">
                {labels.teamsValue}
              </dd>
            </div>
          </dl>
        </div>
        <TeamOfTheWeek
          lineup={totw}
          weekLabel={totwWeekLabel}
          statsById={totwStatsById}
        />
      </TabsContent>

      <TabsContent value="media">
        <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-border bg-card text-base text-muted-foreground">
          {labels.noMedia}
        </div>
      </TabsContent>
    </Tabs>
  );
}

function PlayerStatsTable({
  entries,
  category,
  labels,
}: {
  entries: TopScorerEntry[];
  category: StatCategory;
  labels: {
    player: string;
    goals: string;
    assists: string;
    appearances: string;
    rating: string;
  };
}) {
  const sorted = useMemo(() => {
    const copy = [...entries];
    if (category === "attack") {
      copy.sort((a, b) => b.stats.goals - a.stats.goals);
    } else if (category === "passing") {
      copy.sort((a, b) => b.stats.assists - a.stats.assists);
    } else if (category === "goalkeeping") {
      return copy.filter((e) => e.player.position === "GK");
    } else if (category === "defense") {
      return copy.filter((e) => e.player.position === "DF");
    }
    return copy;
  }, [entries, category]);

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="px-3 py-3 text-start font-medium">#</th>
            <th className="px-2 py-3 text-start font-medium">{labels.player}</th>
            <th className="px-2 py-3 text-center font-medium">{labels.goals}</th>
            <th className="px-2 py-3 text-center font-medium">
              {labels.assists}
            </th>
            <th className="px-2 py-3 text-center font-medium">
              {labels.appearances}
            </th>
            <th className="px-3 py-3 text-center font-medium">{labels.rating}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry, i) => (
            <tr
              key={entry.player.id}
              className="border-b border-border last:border-0 hover:bg-muted/40"
            >
              <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                {i + 1}
              </td>
              <td className="px-2 py-2.5">
                <Link
                  href={`/player/${entry.player.slug}`}
                  className="flex cursor-pointer items-center gap-2.5 font-medium text-foreground hover:underline"
                >
                  <Image
                    src={entry.team.badgeUrl}
                    alt=""
                    width={20}
                    height={20}
                    className="size-5"
                  />
                  <PlayerAvatar
                    src={entry.player.photoUrl}
                    alt={entry.player.name}
                    size={28}
                  />
                  <span className="truncate">{entry.player.name}</span>
                </Link>
              </td>
              <td className="px-2 py-2.5 text-center tabular-nums">
                {entry.stats.goals}
              </td>
              <td className="px-2 py-2.5 text-center tabular-nums">
                {entry.stats.assists}
              </td>
              <td className="px-2 py-2.5 text-center tabular-nums">
                {entry.stats.appearances}
              </td>
              <td className="px-3 py-2.5 text-center">
                <span
                  className={cn(
                    "inline-block rounded px-1.5 py-0.5 text-xs font-bold tabular-nums",
                    ratingTone(entry.stats.averageRating)
                  )}
                >
                  {entry.stats.averageRating.toFixed(2)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
