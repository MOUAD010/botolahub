"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import type { Locale } from "@/lib/i18n/routing";
import { toIntlLocale } from "@/lib/i18n/format";
import type { PlayerMatchRating, PlayerSeasonStats, Team } from "@/lib/types";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ratingTone, ratingToneSoft } from "@/lib/rating";
import { cn } from "@/lib/utils";

function resultTone(result?: "W" | "D" | "L") {
  if (result === "W") return "bg-success text-success-foreground";
  if (result === "L") return "bg-destructive text-white";
  return "bg-muted text-muted-foreground";
}

export function PlayerProfileTabs({
  ratings,
  seasonStats,
  team,
  seasonLabel,
  competitionName,
  locale,
  labels,
}: {
  ratings: PlayerMatchRating[];
  seasonStats: PlayerSeasonStats | null;
  team?: Team | null;
  seasonLabel: string;
  competitionName: string;
  locale: Locale;
  labels: {
    matches: string;
    season: string;
    career: string;
    rating: string;
    goals: string;
    assists: string;
    appearances: string;
    minutes: string;
    yellow: string;
    red: string;
    vs: string;
    noData: string;
    seasonOverview: string;
    attacking: string;
    discipline: string;
    perMatch: string;
    contributions: string;
    goalsPerMatch: string;
    assistsPerMatch: string;
    cards: string;
    careerSoon: string;
  };
}) {
  const activeLocale = (useLocale() as Locale) || locale;
  const dateFormatter = new Intl.DateTimeFormat(toIntlLocale(activeLocale), {
    day: "numeric",
    month: "short",
  });

  return (
    <Tabs defaultValue="matches" className="flex min-w-0 flex-col gap-4">
      <TabsList variant="line" className="h-11">
        <TabsTrigger value="matches" className="px-4">
          {labels.matches}
        </TabsTrigger>
        <TabsTrigger value="season" className="px-4">
          {labels.season}
        </TabsTrigger>
        <TabsTrigger value="career" className="px-4">
          {labels.career}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="matches">
        {ratings.length === 0 ? (
          <p className="text-base text-muted-foreground">{labels.noData}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-3 py-3 text-start font-medium">
                    {labels.vs}
                  </th>
                  <th className="px-2 py-3 text-center font-medium"> </th>
                  <th className="px-2 py-3 text-center font-medium">
                    {labels.rating}
                  </th>
                  <th className="px-2 py-3 text-center font-medium">
                    {labels.minutes}
                  </th>
                  <th className="px-2 py-3 text-center font-medium">
                    {labels.goals}
                  </th>
                  <th className="px-2 py-3 text-center font-medium">
                    {labels.assists}
                  </th>
                  <th className="px-2 py-3 text-center font-medium">
                    {labels.yellow}
                  </th>
                  <th className="px-3 py-3 text-center font-medium">
                    {labels.red}
                  </th>
                </tr>
              </thead>
              <tbody>
                {ratings.map((row) => (
                  <tr
                    key={row.matchId}
                    className="border-b border-border last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-foreground">
                          {row.opponentShortName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {dateFormatter.format(new Date(row.date))}
                          {row.score ? ` · ${row.score}` : ""}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center">
                      {row.result && (
                        <span
                          className={cn(
                            "inline-flex size-6 items-center justify-center rounded-full text-xs font-bold",
                            resultTone(row.result)
                          )}
                        >
                          {row.result}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-3 text-center">
                      <span
                        className={cn(
                          "inline-block rounded px-1.5 py-0.5 text-xs font-bold tabular-nums",
                          ratingTone(row.rating)
                        )}
                      >
                        {row.rating.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center tabular-nums text-foreground">
                      {row.minutes ?? "—"}
                    </td>
                    <td className="px-2 py-3 text-center tabular-nums">
                      {row.goals ?? 0}
                    </td>
                    <td className="px-2 py-3 text-center tabular-nums">
                      {row.assists ?? 0}
                    </td>
                    <td className="px-2 py-3 text-center tabular-nums">
                      {row.yellowCards ?? 0}
                    </td>
                    <td className="px-3 py-3 text-center tabular-nums">
                      {row.redCards ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TabsContent>

      <TabsContent value="season">
        {seasonStats ? (
          <SeasonPanel
            stats={seasonStats}
            team={team}
            seasonLabel={seasonLabel}
            competitionName={competitionName}
            labels={labels}
          />
        ) : (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-base text-muted-foreground">
            {labels.noData}
          </p>
        )}
      </TabsContent>

      <TabsContent value="career">
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-base text-muted-foreground">
          {labels.careerSoon}
        </p>
      </TabsContent>
    </Tabs>
  );
}

function SeasonPanel({
  stats,
  team,
  seasonLabel,
  competitionName,
  labels,
}: {
  stats: PlayerSeasonStats;
  team?: Team | null;
  seasonLabel: string;
  competitionName: string;
  labels: {
    rating: string;
    goals: string;
    assists: string;
    appearances: string;
    yellow: string;
    red: string;
    seasonOverview: string;
    attacking: string;
    discipline: string;
    perMatch: string;
    contributions: string;
    goalsPerMatch: string;
    assistsPerMatch: string;
    cards: string;
  };
}) {
  const apps = Math.max(stats.appearances, 1);
  const contributions = stats.goals + stats.assists;
  const goalsPerMatch = stats.goals / apps;
  const assistsPerMatch = stats.assists / apps;
  const cardsTotal = stats.yellowCards + stats.redCards;

  return (
    <div className="flex flex-col gap-5">
      {/* Season hero */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              {labels.seasonOverview}
            </p>
            <p className="mt-0.5 text-base font-semibold text-foreground">
              {competitionName}
              <span className="text-muted-foreground"> · {seasonLabel}</span>
            </p>
          </div>
          {team && (
            <div className="flex items-center gap-2 rounded-lg bg-background/60 px-2.5 py-1.5">
              <Image
                src={team.badgeUrl}
                alt={team.name}
                width={28}
                height={28}
                className="size-7"
              />
              <span className="text-sm font-medium text-foreground">
                {team.shortName}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
          <HeroStat
            label={labels.rating}
            value={stats.averageRating.toFixed(1)}
            accent={
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-2xl font-bold tabular-nums sm:text-3xl",
                  // ratingToneSoft(stats.averageRating)
                )}
              >
                {stats.averageRating.toFixed(1)}
              </span>
            }
          />
          <HeroStat
            label={labels.appearances}
            value={String(stats.appearances)}
          />
          <HeroStat label={labels.goals} value={String(stats.goals)} highlight />
          <HeroStat label={labels.assists} value={String(stats.assists)} />
        </div>
      </div>

      {/* Attacking + rates */}
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <h3 className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            {labels.attacking}
          </h3>
          <div className="flex flex-col gap-4">
            <StatBar
              label={labels.goals}
              value={stats.goals}
              max={Math.max(stats.goals, 10)}
              tone="primary"
            />
            <StatBar
              label={labels.assists}
              value={stats.assists}
              max={Math.max(stats.assists, 10)}
              tone="sky"
            />
            <StatBar
              label={labels.contributions}
              value={contributions}
              max={Math.max(contributions, 12)}
              tone="emerald"
            />
          </div>
          <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-4">
            <MiniMetric
              label={labels.contributions}
              value={String(contributions)}
            />
            <MiniMetric
              label={labels.goalsPerMatch}
              value={goalsPerMatch.toFixed(2)}
            />
            <MiniMetric
              label={labels.assistsPerMatch}
              value={assistsPerMatch.toFixed(2)}
            />
          </dl>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <h3 className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            {labels.discipline}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <DisciplineCard
              label={labels.yellow}
              value={stats.yellowCards}
              color="bg-amber-400"
            />
            <DisciplineCard
              label={labels.red}
              value={stats.redCards}
              color="bg-red-500"
            />
          </div>
          <div className="mt-4 rounded-lg bg-muted/40 px-3 py-3">
            <p className="text-xs text-muted-foreground">{labels.cards}</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
              {cardsTotal}
              <span className="ms-1 text-sm font-normal text-muted-foreground">
                / {stats.appearances} {labels.appearances.toLowerCase()}
              </span>
            </p>
          </div>
          <div className="mt-4">
            <h3 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              {labels.perMatch}
            </h3>
            <dl className="grid grid-cols-2 gap-2">
              <MiniMetric
                label={labels.goalsPerMatch}
                value={goalsPerMatch.toFixed(2)}
              />
              <MiniMetric
                label={labels.assistsPerMatch}
                value={assistsPerMatch.toFixed(2)}
              />
            </dl>
          </div>
        </section>
      </div>
    </div>
  );
}

function HeroStat({
  label,
  value,
  highlight,
  accent,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  accent?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 bg-card px-4 py-4 sm:px-5 sm:py-5">
      <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      {accent ?? (
        <span
          className={cn(
            "text-2xl font-bold tabular-nums sm:text-3xl",
            highlight ? "text-primary" : "text-foreground"
          )}
        >
          {value}
        </span>
      )}
    </div>
  );
}

function StatBar({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: "primary" | "sky" | "emerald";
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const bar =
    tone === "primary"
      ? "bg-primary"
      : tone === "sky"
        ? "bg-sky-500"
        : "bg-emerald-500";

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-bold tabular-nums text-foreground">
          {value}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", bar)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 px-2.5 py-2 text-center">
      <dt className="text-[10px] leading-tight text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-base font-bold tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}

function DisciplineCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-3">
      <span className={cn("size-4 shrink-0 rounded-sm shadow-sm", color)} />
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold tabular-nums text-foreground">{value}</p>
      </div>
    </div>
  );
}
