import { apiFootballGet } from "./client";

export type AfLeagueRow = {
  league: {
    id: number;
    name: string;
    type: string;
    logo: string;
  };
  country: { name: string; code: string | null; flag: string | null };
  seasons: Array<{
    year: number;
    start: string;
    end: string;
    current: boolean;
    coverage: Record<string, unknown>;
  }>;
};

export type AfTeamRow = {
  team: {
    id: number;
    name: string;
    code: string | null;
    country: string;
    founded: number | null;
    national: boolean;
    logo: string;
  };
  venue: {
    id: number | null;
    name: string | null;
    address: string | null;
    city: string | null;
    capacity: number | null;
    surface: string | null;
    image: string | null;
  };
};

export type AfStandingRow = {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  group: string;
  form: string | null;
  status: string | null;
  description: string | null;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
};

export type AfFixtureRow = {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;
    timestamp: number;
    periods: { first: number | null; second: number | null };
    venue: { id: number | null; name: string | null; city: string | null };
    status: {
      long: string;
      short: string;
      elapsed: number | null;
      extra: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
    round: string;
    standings: boolean;
  };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
  events?: unknown[];
  lineups?: unknown[];
  statistics?: unknown[];
  players?: unknown[];
};

export type AfSquadPlayer = {
  id: number;
  name: string;
  age: number | null;
  number: number | null;
  position: string | null;
  photo: string;
};

export type AfSquadRow = {
  team: { id: number; name: string; logo: string };
  players: AfSquadPlayer[];
};

export type AfStatusResponse = {
  account: { firstname: string; lastname: string; email: string };
  subscription: { plan: string; end: string; active: boolean };
  requests: { current: number; limit_day: number };
};

export async function getStatus() {
  return apiFootballGet<AfStatusResponse>("status");
}

export async function getLeagueById(id: number) {
  return apiFootballGet<AfLeagueRow[]>("leagues", { id });
}

export async function getTeamsByLeague(league: number, season: number) {
  return apiFootballGet<AfTeamRow[]>("teams", { league, season });
}

export async function getStandings(league: number, season: number) {
  return apiFootballGet<
    Array<{
      league: {
        id: number;
        name: string;
        country: string;
        logo: string;
        flag: string | null;
        season: number;
        standings: AfStandingRow[][];
      };
    }>
  >("standings", { league, season });
}

export async function getFixturesByLeague(league: number, season: number) {
  return apiFootballGet<AfFixtureRow[]>("fixtures", { league, season });
}

export async function getFixturesLive(leagueIds?: string) {
  return apiFootballGet<AfFixtureRow[]>("fixtures", {
    live: leagueIds ?? "all",
  });
}

export async function getFixturesByDate(date: string, league?: number) {
  return apiFootballGet<AfFixtureRow[]>("fixtures", {
    date,
    ...(league ? { league } : {}),
  });
}

export async function getFixtureById(id: number) {
  return apiFootballGet<AfFixtureRow[]>("fixtures", { id });
}

export async function getFixtureEvents(fixture: number) {
  return apiFootballGet<unknown[]>("fixtures/events", { fixture });
}

export async function getFixtureLineups(fixture: number) {
  return apiFootballGet<unknown[]>("fixtures/lineups", { fixture });
}

export async function getFixtureStatistics(fixture: number) {
  return apiFootballGet<unknown[]>("fixtures/statistics", { fixture });
}

export async function getSquad(team: number) {
  return apiFootballGet<AfSquadRow[]>("players/squads", { team });
}

export async function getTopScorers(league: number, season: number) {
  return apiFootballGet<unknown[]>("players/topscorers", { league, season });
}
