import {
  PostgresMatchRepository,
  PostgresPlayerRepository,
  PostgresStandingsRepository,
  PostgresTeamRepository,
} from "./postgres";
import type {
  MatchRepository,
  PlayerRepository,
  StandingsRepository,
  TeamRepository,
} from "./types";

export const matchRepository: MatchRepository = new PostgresMatchRepository();
export const teamRepository: TeamRepository = new PostgresTeamRepository();
export const standingsRepository: StandingsRepository =
  new PostgresStandingsRepository();
export const playerRepository: PlayerRepository = new PostgresPlayerRepository();

export {
  getCompetition,
  getFixturesAroundNow,
  getHomeFixtures,
  getMatchById,
  getPlayerById,
  getPrimaryCompetitionForTeam,
  getTeamOfTheWeekFromDb,
  listFixturesForMentions,
  listPlayersForMentions,
} from "./postgres";

export type {
  MatchRepository,
  PlayerRepository,
  StandingsRepository,
  TeamRepository,
  TopScorerEntry,
} from "./types";
