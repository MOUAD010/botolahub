import type {
  Lineup,
  Match,
  MatchGoalEvent,
  MatchStats,
  MatchTimelineEvent,
  Player,
  PlayerMatchRating,
  PlayerSeasonStats,
  Standing,
  Team,
} from "@/lib/types";

export interface MatchRepository {
  getByCompetition(competitionId: string): Promise<Match[]>;
  getByMatchday(competitionId: string, matchday: number): Promise<Match[]>;
  getBySlug(slug: string): Promise<Match | null>;
  getStats(matchId: string): Promise<MatchStats | null>;
  getLineups(matchId: string): Promise<Lineup[]>;
  getGoalEvents(matchId: string): Promise<MatchGoalEvent[]>;
  getTimelineEvents(matchId: string): Promise<MatchTimelineEvent[]>;
}

export interface TeamRepository {
  getAll(): Promise<Team[]>;
  getBySlug(slug: string): Promise<Team | null>;
  getById(id: string): Promise<Team | null>;
  getSquad(teamId: string): Promise<Player[]>;
  getUpcomingFixtures(teamSlug: string, limit?: number): Promise<Match[]>;
  getRecentMatches(teamSlug: string, limit?: number): Promise<Match[]>;
  getTrophies(teamId: string): Promise<import("@/lib/types").TeamTrophy[]>;
}

export interface StandingsRepository {
  getStandings(competitionId: string): Promise<Standing[]>;
  getTeamStanding(
    competitionId: string,
    teamSlug: string
  ): Promise<Standing | null>;
}

export interface TopScorerEntry {
  player: Player;
  team: Team;
  stats: PlayerSeasonStats;
}

export interface PlayerRepository {
  getBySlug(slug: string): Promise<Player | null>;
  getSeasonStats(playerId: string): Promise<PlayerSeasonStats | null>;
  getSeasonStatsForPlayers(
    playerIds: string[]
  ): Promise<Record<string, PlayerSeasonStats | null>>;
  getRecentRatings(
    playerId: string,
    limit?: number
  ): Promise<PlayerMatchRating[]>;
  getTopScorers(limit?: number): Promise<TopScorerEntry[]>;
}
