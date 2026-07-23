import { getTrophiesByTeamId } from "@/data/trophies.mock";
import type {
  Lineup,
  Match,
  MatchStats,
  Player,
  PlayerMatchRating,
  PlayerSeasonStats,
  Standing,
  Team,
  TeamTrophy,
} from "@/lib/types";
import { matches, matchStats, getMatchBySlug, BOTOLA_PRO } from "@/data/matches.mock";
import { teams, getTeamBySlug, getTeamById } from "@/data/teams.mock";
import { standings } from "@/data/standings.mock";
import { getLineupsByMatchId } from "@/data/lineups.mock";
import {
  getPlayerBySlug,
  getPlayersByTeamId,
  getPlayerById,
} from "@/data/players.mock";
import {
  getRecentRatingsByPlayerId,
  getSeasonStatsByPlayerId,
  playerSeasonStats,
} from "@/data/player-stats.mock";
import type {
  MatchRepository,
  PlayerRepository,
  StandingsRepository,
  TeamRepository,
  TopScorerEntry,
} from "./types";

export class MockMatchRepository implements MatchRepository {
  async getByCompetition(competitionId: string): Promise<Match[]> {
    return matches.filter((m) => m.competitionId === competitionId);
  }

  async getByMatchday(
    competitionId: string,
    matchday: number
  ): Promise<Match[]> {
    return matches.filter(
      (m) => m.competitionId === competitionId && m.matchday === matchday
    );
  }

  async getBySlug(slug: string): Promise<Match | null> {
    return getMatchBySlug(slug) ?? null;
  }

  async getStats(matchId: string): Promise<MatchStats | null> {
    return matchStats.find((s) => s.matchId === matchId) ?? null;
  }

  async getLineups(matchId: string): Promise<Lineup[]> {
    return getLineupsByMatchId(matchId);
  }
}

export class MockTeamRepository implements TeamRepository {
  async getAll(): Promise<Team[]> {
    return teams;
  }

  async getBySlug(slug: string): Promise<Team | null> {
    return getTeamBySlug(slug) ?? null;
  }

  async getById(id: string): Promise<Team | null> {
    return getTeamById(id) ?? null;
  }

  async getSquad(teamId: string): Promise<Player[]> {
    return getPlayersByTeamId(teamId);
  }

  async getUpcomingFixtures(teamSlug: string, limit = 5): Promise<Match[]> {
    return matches
      .filter(
        (m) =>
          m.status === "upcoming" &&
          (m.homeTeam.slug === teamSlug || m.awayTeam.slug === teamSlug)
      )
      .slice(0, limit);
  }

  async getRecentMatches(teamSlug: string, limit = 8): Promise<Match[]> {
    const finished = matches
      .filter(
        (m) =>
          m.status === "finished" &&
          (m.homeTeam.slug === teamSlug || m.awayTeam.slug === teamSlug)
      )
      .sort(
        (a, b) =>
          new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime()
      );

    if (finished.length >= limit) return finished.slice(0, limit);

    const team = getTeamBySlug(teamSlug);
    const standing = standings.find((s) => s.team.slug === teamSlug);
    if (!team || !standing) return finished;

    const opponents = teams.filter((t) => t.slug !== teamSlug);
    const synthesized: Match[] = standing.form.map((result, i) => {
      const opponent = opponents[(i * 3) % opponents.length]!;
      const isHome = i % 2 === 0;
      const homeScore =
        result === "W" ? (isHome ? 2 : 1) : result === "D" ? 1 : isHome ? 0 : 2;
      const awayScore =
        result === "W" ? (isHome ? 0 : 2) : result === "D" ? 1 : isHome ? 2 : 0;
      const kickoff = new Date(
        Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000
      ).toISOString();

      return {
        id: `form-${teamSlug}-${i}`,
        slug: `form-${teamSlug}-${opponent.slug}-${i}`,
        competitionId: BOTOLA_PRO.id,
        matchday: Math.max(1, standing.played - i),
        homeTeam: isHome ? team : opponent,
        awayTeam: isHome ? opponent : team,
        homeScore,
        awayScore,
        status: "finished" as const,
        kickoff,
        venue: isHome ? team.venue : opponent.venue,
      };
    });

    const seen = new Set(finished.map((m) => m.id));
    const merged = [
      ...finished,
      ...synthesized.filter((m) => !seen.has(m.id)),
    ];
    return merged.slice(0, limit);
  }

  async getTrophies(teamId: string): Promise<TeamTrophy[]> {
    return getTrophiesByTeamId(teamId);
  }
}

export class MockStandingsRepository implements StandingsRepository {
  async getStandings(_competitionId: string): Promise<Standing[]> {
    return standings;
  }

  async getTeamStanding(
    _competitionId: string,
    teamSlug: string
  ): Promise<Standing | null> {
    return standings.find((s) => s.team.slug === teamSlug) ?? null;
  }
}

export class MockPlayerRepository implements PlayerRepository {
  async getBySlug(slug: string): Promise<Player | null> {
    return getPlayerBySlug(slug) ?? null;
  }

  async getSeasonStats(playerId: string): Promise<PlayerSeasonStats | null> {
    return getSeasonStatsByPlayerId(playerId) ?? null;
  }

  async getRecentRatings(
    playerId: string,
    limit = 12
  ): Promise<PlayerMatchRating[]> {
    return getRecentRatingsByPlayerId(playerId, limit);
  }

  async getTopScorers(limit = 10): Promise<TopScorerEntry[]> {
    return [...playerSeasonStats]
      .sort((a, b) => b.goals - a.goals)
      .slice(0, limit)
      .map((stats) => {
        const player = getPlayerById(stats.playerId);
        const team = player ? getTeamById(player.teamId) : undefined;
        if (!player || !team) {
          throw new Error(
            `Inconsistent mock data for player ${stats.playerId}`
          );
        }
        return { player, team, stats };
      });
  }
}
