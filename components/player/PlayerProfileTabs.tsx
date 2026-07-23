"use client";

import { useLocale } from "next-intl";
import type { Locale } from "@/lib/i18n/routing";
import { toIntlLocale } from "@/lib/i18n/format";
import type { PlayerMatchRating, PlayerSeasonStats } from "@/lib/types";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

function ratingTone(rating: number) {
  if (rating >= 7.5) return "bg-success text-success-foreground";
  if (rating >= 7) return "bg-emerald-600 text-white";
  if (rating >= 6.5) return "bg-amber-500 text-black";
  return "bg-muted text-muted-foreground";
}

function resultTone(result?: "W" | "D" | "L") {
  if (result === "W") return "bg-success text-success-foreground";
  if (result === "L") return "bg-destructive text-white";
  return "bg-muted text-muted-foreground";
}

export function PlayerProfileTabs({
  ratings,
  seasonStats,
  locale,
  labels,
}: {
  ratings: PlayerMatchRating[];
  seasonStats: PlayerSeasonStats | null;
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
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              {
                label: labels.rating,
                value: seasonStats.averageRating.toFixed(1),
              },
              { label: labels.appearances, value: seasonStats.appearances },
              { label: labels.goals, value: seasonStats.goals },
              { label: labels.assists, value: seasonStats.assists },
              { label: labels.yellow, value: seasonStats.yellowCards },
              { label: labels.red, value: seasonStats.redCards },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border bg-card p-4"
              >
                <dt className="text-sm text-muted-foreground">{item.label}</dt>
                <dd className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-base text-muted-foreground">{labels.noData}</p>
        )}
      </TabsContent>

      <TabsContent value="career">
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-base text-muted-foreground">
          {labels.noData}
        </p>
      </TabsContent>
    </Tabs>
  );
}
