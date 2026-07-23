import {
  MockMatchRepository,
  MockPlayerRepository,
  MockStandingsRepository,
  MockTeamRepository,
} from "./mock";
import type {
  MatchRepository,
  PlayerRepository,
  StandingsRepository,
  TeamRepository,
} from "./types";

// Swap point: replace these with API-backed implementations later.
// Every page imports the repositories from here, never from ./mock
// directly, so that swap is a one-file change.
export const matchRepository: MatchRepository = new MockMatchRepository();
export const teamRepository: TeamRepository = new MockTeamRepository();
export const standingsRepository: StandingsRepository =
  new MockStandingsRepository();
export const playerRepository: PlayerRepository = new MockPlayerRepository();

export type {
  MatchRepository,
  PlayerRepository,
  StandingsRepository,
  TeamRepository,
  TopScorerEntry,
} from "./types";
