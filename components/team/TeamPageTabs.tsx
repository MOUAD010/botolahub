"use client";

import Image from "next/image";
import { Trophy } from "lucide-react";
import { useLocale } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { formatMatchdayDate } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/routing";
import type {
  Match,
  Player,
  PlayerPosition,
  Standing,
  Team,
  TeamTrophy,
} from "@/lib/types";
import { FormBadges } from "@/components/standings/FormBadges";
import { PlayerAvatar } from "@/components/player/PlayerAvatar";
import { MatchCard } from "@/components/match/MatchCard";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

function formatDiff(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

function resultForTeam(
  match: Match,
  teamSlug: string
): "W" | "D" | "L" | null {
  if (match.status !== "finished" || match.homeScore == null || match.awayScore == null) {
    return null;
  }
  const isHome = match.homeTeam.slug === teamSlug;
  const forScore = isHome ? match.homeScore : match.awayScore;
  const againstScore = isHome ? match.awayScore : match.homeScore;
  if (forScore > againstScore) return "W";
  if (forScore < againstScore) return "L";
  return "D";
}

export function TeamPageTabs({
  team,
  squadByPosition,
  standing,
  allStandings,
  recentMatches,
  upcomingFixtures,
  trophies,
  labels,
}: {
  team: Team;
  squadByPosition: Array<{ position: PlayerPosition; players: Player[] }>;
  standing: Standing | null;
  allStandings: Standing[];
  recentMatches: Match[];
  upcomingFixtures: Match[];
  trophies: TeamTrophy[];
  labels: {
    matches: string;
    squad: string;
    stats: string;
    standings: string;
    trophies: string;
    recentForm: string;
    latestMatches: string;
    upcoming: string;
    noMatches: string;
    noTrophies: string;
    played: string;
    won: string;
    drawn: string;
    lost: string;
    goalsFor: string;
    goalsAgainst: string;
    goalDifference: string;
    points: string;
    form: string;
    team: string;
    positionLabels: Record<PlayerPosition, string>;
    seasons: string;
  };
}) {
  const locale = useLocale() as Locale;

  return (
    <Tabs defaultValue="matches" className="flex min-w-0 flex-col gap-4">
      <div className="overflow-x-auto border-b border-border">
        <TabsList variant="line" className="h-12 min-w-max bg-transparent p-0">
          <TabsTrigger value="matches" className="px-4 text-base">
            {labels.matches}
          </TabsTrigger>
          <TabsTrigger value="stats" className="px-4 text-base">
            {labels.stats}
          </TabsTrigger>
          <TabsTrigger value="standings" className="px-4 text-base">
            {labels.standings}
          </TabsTrigger>
          <TabsTrigger value="squad" className="px-4 text-base">
            {labels.squad}
          </TabsTrigger>
          <TabsTrigger value="trophies" className="px-4 text-base">
            {labels.trophies}
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="matches" className="flex flex-col gap-6">
        {standing && (
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-base font-semibold text-foreground">
              {labels.recentForm}
            </h2>
            <FormBadges
              form={standing.form}
              label={labels.form}
              className="gap-1.5 [&_span]:size-7 [&_span]:text-xs"
            />
          </section>
        )}

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-foreground">
            {labels.latestMatches}
          </h2>
          {recentMatches.length > 0 ? (
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
              {recentMatches.map((match) => {
                const result = resultForTeam(match, team.slug);
                const opponent =
                  match.homeTeam.slug === team.slug
                    ? match.awayTeam
                    : match.homeTeam;
                const isHome = match.homeTeam.slug === team.slug;
                return (
                  <li key={match.id}>
                    <Link
                      href={
                        match.slug.startsWith("form-")
                          ? `/team/${opponent.slug}`
                          : `/match/${match.slug}`
                      }
                      className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                    >
                      <span className="w-16 shrink-0 text-xs text-muted-foreground">
                        {formatMatchdayDate(match.kickoff, locale)}
                      </span>
                      <span
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                          result === "W" &&
                            "bg-success text-success-foreground",
                          result === "D" && "bg-muted text-muted-foreground",
                          result === "L" &&
                            "bg-destructive/15 text-destructive"
                        )}
                      >
                        {result ?? "–"}
                      </span>
                      <Image
                        src={opponent.badgeUrl}
                        alt=""
                        width={24}
                        height={24}
                        className="size-6"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                        {isHome ? "vs" : "@"} {opponent.name}
                      </span>
                      <span className="font-bold tabular-nums text-foreground">
                        {match.homeScore}–{match.awayScore}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
              {labels.noMatches}
            </p>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-foreground">
            {labels.upcoming}
          </h2>
          {upcomingFixtures.length > 0 ? (
            <div className="flex flex-col gap-3">
              {upcomingFixtures.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
              {labels.noMatches}
            </p>
          )}
        </section>
      </TabsContent>

      <TabsContent value="stats" className="flex flex-col gap-4">
        {standing ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: labels.played, value: standing.played },
                { label: labels.won, value: standing.won },
                { label: labels.drawn, value: standing.drawn },
                { label: labels.lost, value: standing.lost },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-border bg-card p-4 text-center"
                >
                  <div className="text-2xl font-bold tabular-nums text-foreground">
                    {item.value}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatRow
                label={labels.goalsFor}
                value={standing.goalsFor}
              />
              <StatRow
                label={labels.goalsAgainst}
                value={standing.goalsAgainst}
              />
              <StatRow
                label={labels.goalDifference}
                value={formatDiff(
                  standing.goalsFor - standing.goalsAgainst
                )}
              />
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">
                  {labels.points}
                </span>
                <span className="text-3xl font-bold tabular-nums text-primary">
                  {standing.points}
                </span>
              </div>
              <div className="mt-4">
                <p className="mb-2 text-sm text-muted-foreground">
                  {labels.recentForm}
                </p>
                <FormBadges form={standing.form} label={labels.form} />
              </div>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">—</p>
        )}
      </TabsContent>

      <TabsContent value="standings">
        <ClientStandingsTable
          standings={allStandings}
          highlightSlug={team.slug}
          labels={labels}
        />
      </TabsContent>

      <TabsContent value="squad" className="flex flex-col gap-6">
        {squadByPosition.map((group) => (
          <div key={group.position} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-muted-foreground">
              {labels.positionLabels[group.position]}
            </h3>
            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
              {group.players.map((player) => (
                <li key={player.id}>
                  <Link
                    href={`/player/${player.slug}`}
                    className="flex min-h-12 cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-muted/50"
                  >
                    <PlayerAvatar
                      src={player.photoUrl}
                      alt={player.name}
                      size={32}
                    />
                    <span className="w-6 shrink-0 text-center text-sm font-semibold tabular-nums text-muted-foreground">
                      {player.shirtNumber}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-base font-medium text-foreground">
                      {player.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </TabsContent>

      <TabsContent value="trophies">
        {trophies.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
            {labels.noTrophies}
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {trophies.map((trophy) => (
              <li
                key={trophy.id}
                className="flex gap-4 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Trophy className="size-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-semibold text-foreground">
                      {trophy.name}
                    </h3>
                    <span className="text-2xl font-bold tabular-nums text-primary">
                      ×{trophy.count}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {labels.seasons}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {trophy.seasons.join(" · ")}
                    {trophy.count > trophy.seasons.length ? "…" : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </TabsContent>
    </Tabs>
  );
}

function StatRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-xl font-bold tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}

function ClientStandingsTable({
  standings,
  highlightSlug,
  labels,
}: {
  standings: Standing[];
  highlightSlug: string;
  labels: {
    team: string;
    played: string;
    won: string;
    drawn: string;
    lost: string;
    goalDifference: string;
    points: string;
    form: string;
  };
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="px-3 py-3 text-start font-medium">#</th>
            <th className="px-2 py-3 text-start font-medium">{labels.team}</th>
            <th className="px-2 py-3 text-center font-medium">
              {labels.played}
            </th>
            <th className="px-2 py-3 text-center font-medium">{labels.won}</th>
            <th className="px-2 py-3 text-center font-medium">
              {labels.drawn}
            </th>
            <th className="px-2 py-3 text-center font-medium">{labels.lost}</th>
            <th className="px-2 py-3 text-center font-medium">
              {labels.goalDifference}
            </th>
            <th className="px-2 py-3 text-center font-bold">{labels.points}</th>
            <th className="px-3 py-3 text-center font-medium">{labels.form}</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row) => {
            const highlighted = row.team.slug === highlightSlug;
            return (
              <tr
                key={row.team.id}
                className={cn(
                  "border-b border-border last:border-0",
                  highlighted
                    ? "bg-primary/12 hover:bg-primary/15"
                    : "hover:bg-muted/40"
                )}
              >
                <td
                  className={cn(
                    "relative px-3 py-2.5 tabular-nums before:absolute before:inset-y-0 before:inset-s-0 before:w-1",
                    highlighted
                      ? "font-bold text-primary before:bg-primary"
                      : "text-muted-foreground",
                    row.zone === "continental" &&
                      !highlighted &&
                      "before:bg-success",
                    row.zone === "relegation" &&
                      !highlighted &&
                      "before:bg-destructive"
                  )}
                >
                  {row.position}
                </td>
                <td className="px-2 py-2.5">
                  <Link
                    href={`/team/${row.team.slug}`}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 font-medium hover:underline",
                      highlighted ? "text-primary" : "text-foreground"
                    )}
                  >
                    <Image
                      src={row.team.badgeUrl}
                      alt=""
                      width={22}
                      height={22}
                      className="size-[22px]"
                    />
                    <span className={cn(highlighted && "font-bold")}>
                      {row.team.name}
                    </span>
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
                <td
                  className={cn(
                    "px-2 py-2.5 text-center font-bold tabular-nums",
                    highlighted && "text-primary"
                  )}
                >
                  {row.points}
                </td>
                <td className="px-3 py-2.5">
                  <FormBadges
                    form={row.form.slice(-5)}
                    label={labels.form}
                    className="justify-center"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
