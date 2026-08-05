"use client";

import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import type { Lineup, Match, Player, PlayerSeasonStats } from "@/lib/types";
import { FormationPitch } from "@/components/lineups/FormationPitch";
import { SubsList } from "@/components/lineups/SubsList";
import { PlayerAvatar } from "@/components/player/PlayerAvatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { displaySeasonRating, ratingTone } from "@/lib/rating";

export function LineupsPanel({
  match,
  homeLineup,
  awayLineup,
  statsById,
  labels,
}: {
  match: Match;
  homeLineup: Lineup;
  awayLineup: Lineup;
  statsById: Record<string, PlayerSeasonStats | null>;
  labels: {
    lineups: string;
    playerStats: string;
    substitutes: string;
    rating: string;
    goals: string;
    assists: string;
    player: string;
  };
}) {
  return (
    <Tabs defaultValue="pitch" className="flex min-w-0 flex-col gap-4">
      <TabsList variant="line" className="h-10">
        <TabsTrigger value="pitch" className="px-4">
          {labels.lineups}
        </TabsTrigger>
        <TabsTrigger value="player-stats" className="px-4">
          {labels.playerStats}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pitch" className="flex flex-col gap-6">
        <div className="flex items-center justify-between text-sm sm:text-base">
          <TeamFormationLabel
            badgeUrl={match.homeTeam.badgeUrl}
            name={match.homeTeam.shortName}
            formation={homeLineup.formation}
            align="start"
          />
          <TeamFormationLabel
            badgeUrl={match.awayTeam.badgeUrl}
            name={match.awayTeam.shortName}
            formation={awayLineup.formation}
            align="end"
          />
        </div>

        <FormationPitch
          homeLineup={homeLineup}
          awayLineup={awayLineup}
          statsById={statsById}
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <SubsList
            substitutes={homeLineup.substitutes}
            heading={`${match.homeTeam.shortName} — ${labels.substitutes}`}
            team="home"
          />
          <SubsList
            substitutes={awayLineup.substitutes}
            heading={`${match.awayTeam.shortName} — ${labels.substitutes}`}
            team="away"
          />
        </div>
      </TabsContent>

      <TabsContent value="player-stats" className="flex flex-col gap-6">
        <PlayerStatsTable
          teamName={match.homeTeam.shortName}
          badgeUrl={match.homeTeam.badgeUrl}
          players={[...homeLineup.startingXI, ...homeLineup.substitutes]}
          statsById={statsById}
          labels={labels}
        />
        <PlayerStatsTable
          teamName={match.awayTeam.shortName}
          badgeUrl={match.awayTeam.badgeUrl}
          players={[...awayLineup.startingXI, ...awayLineup.substitutes]}
          statsById={statsById}
          labels={labels}
        />
      </TabsContent>
    </Tabs>
  );
}

function TeamFormationLabel({
  badgeUrl,
  name,
  formation,
  align,
}: {
  badgeUrl: string;
  name: string;
  formation: string;
  align: "start" | "end";
}) {
  return (
    <div
      className={`flex items-center gap-2 ${align === "end" ? "flex-row-reverse text-end" : ""}`}
    >
      <Image
        src={badgeUrl}
        alt={name}
        width={24}
        height={24}
        className="size-6 shrink-0"
      />
      <span className="font-medium text-foreground">{name}</span>
      <span className="text-muted-foreground">{formation}</span>
    </div>
  );
}

function PlayerStatsTable({
  teamName,
  badgeUrl,
  players,
  statsById,
  labels,
}: {
  teamName: string;
  badgeUrl: string;
  players: Player[];
  statsById: Record<string, PlayerSeasonStats | null>;
  labels: {
    rating: string;
    goals: string;
    assists: string;
    player: string;
  };
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Image src={badgeUrl} alt={teamName} width={22} height={22} />
        <h3 className="text-base font-semibold text-foreground">{teamName}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="px-4 py-2.5 text-start font-medium">#</th>
              <th className="px-2 py-2.5 text-start font-medium">
                {labels.player}
              </th>
              <th className="px-2 py-2.5 text-center font-medium">
                {labels.rating}
              </th>
              <th className="px-2 py-2.5 text-center font-medium">
                {labels.goals}
              </th>
              <th className="px-4 py-2.5 text-center font-medium">
                {labels.assists}
              </th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => {
              const stats = statsById[player.id];
              const rating = displaySeasonRating(
                stats ?? { goals: 0, assists: 0 }
              );
              return (
                <tr
                  key={player.id}
                  className="border-b border-border last:border-0 hover:bg-muted/40"
                >
                  <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                    {player.shirtNumber}
                  </td>
                  <td className="px-2 py-2.5">
                    <Link
                      href={`/player/${player.slug}`}
                      className="flex cursor-pointer items-center gap-2.5 font-medium text-foreground hover:underline"
                    >
                      <PlayerAvatar
                        src={player.photoUrl}
                        alt={player.name}
                        size={28}
                        unoptimized={Boolean(
                          player.photoUrl?.startsWith("/media/")
                        )}
                      />
                      <span className="truncate">{player.name}</span>
                    </Link>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <span
                      className={cn(
                        "inline-block rounded px-1.5 py-0.5 text-xs font-bold tabular-nums",
                        ratingTone(rating)
                      )}
                    >
                      {rating.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-center tabular-nums">
                    {stats?.goals ?? 0}
                  </td>
                  <td className="px-4 py-2.5 text-center tabular-nums">
                    {stats?.assists ?? 0}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
