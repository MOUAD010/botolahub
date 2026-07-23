import type { Match, MatchStats } from "@/lib/types";
import { getTeamBySlug } from "./teams.mock";

export const BOTOLA_PRO = {
  id: "botola-pro",
  slug: "botola-pro",
  name: "Botola Pro",
  shortName: "Botola Pro",
  country: "Morocco",
} as const;

const CURRENT_MATCHDAY = 14;

function todayAt(hour: number, minute: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);
  return d.toISOString();
}

function team(slug: string) {
  const t = getTeamBySlug(slug);
  if (!t) throw new Error(`Unknown team slug in mock fixtures: ${slug}`);
  return t;
}

export const matches: Match[] = [
  {
    id: "500101",
    slug: "wydad-ac-raja-ca-500101",
    competitionId: BOTOLA_PRO.id,
    matchday: CURRENT_MATCHDAY,
    homeTeam: team("wydad-ac"),
    awayTeam: team("raja-ca"),
    homeScore: 3,
    awayScore: 1,
    status: "finished",
    kickoff: todayAt(13, 0),
    venue: "Complexe Sportif Mohammed V",
  },
  {
    id: "500102",
    slug: "as-far-rs-berkane-500102",
    competitionId: BOTOLA_PRO.id,
    matchday: CURRENT_MATCHDAY,
    homeTeam: team("as-far"),
    awayTeam: team("rs-berkane"),
    homeScore: 1,
    awayScore: 1,
    status: "finished",
    kickoff: todayAt(15, 0),
    venue: "Complexe Sportif Prince Moulay Abdellah",
  },
  {
    id: "500103",
    slug: "moghreb-tetouan-hassania-agadir-500103",
    competitionId: BOTOLA_PRO.id,
    matchday: CURRENT_MATCHDAY,
    homeTeam: team("moghreb-tetouan"),
    awayTeam: team("hassania-agadir"),
    homeScore: 2,
    awayScore: 2,
    status: "live",
    kickoff: todayAt(17, 0),
    minute: 63,
    venue: "Stade Saniat Rmel",
  },
  {
    id: "500104",
    slug: "difaa-el-jadidi-fus-rabat-500104",
    competitionId: BOTOLA_PRO.id,
    matchday: CURRENT_MATCHDAY,
    homeTeam: team("difaa-el-jadidi"),
    awayTeam: team("fus-rabat"),
    homeScore: null,
    awayScore: null,
    status: "upcoming",
    kickoff: todayAt(19, 0),
    venue: "Stade El Abdi",
  },
  {
    id: "500105",
    slug: "chabab-mohammedia-union-touarga-500105",
    competitionId: BOTOLA_PRO.id,
    matchday: CURRENT_MATCHDAY,
    homeTeam: team("chabab-mohammedia"),
    awayTeam: team("union-touarga"),
    homeScore: null,
    awayScore: null,
    status: "upcoming",
    kickoff: todayAt(19, 0),
    venue: "Stade Municipal El Bachir",
  },
  {
    id: "500106",
    slug: "wydad-fes-rapide-oued-zem-500106",
    competitionId: BOTOLA_PRO.id,
    matchday: CURRENT_MATCHDAY,
    homeTeam: team("wydad-fes"),
    awayTeam: team("rapide-oued-zem"),
    homeScore: null,
    awayScore: null,
    status: "upcoming",
    kickoff: todayAt(20, 0),
    venue: "Complexe Sportif de Fès",
  },
  {
    id: "500107",
    slug: "racing-casablanca-youssoufia-berrechid-500107",
    competitionId: BOTOLA_PRO.id,
    matchday: CURRENT_MATCHDAY,
    homeTeam: team("racing-casablanca"),
    awayTeam: team("youssoufia-berrechid"),
    homeScore: null,
    awayScore: null,
    status: "upcoming",
    kickoff: todayAt(20, 0),
    venue: "Complexe Sportif Mohammed V",
  },
  {
    id: "500108",
    slug: "olympique-safi-ittihad-tanger-500108",
    competitionId: BOTOLA_PRO.id,
    matchday: CURRENT_MATCHDAY,
    homeTeam: team("olympique-safi"),
    awayTeam: team("ittihad-tanger"),
    homeScore: null,
    awayScore: null,
    status: "upcoming",
    kickoff: todayAt(21, 0),
    venue: "Stade El Massira",
  },
];

export const matchStats: MatchStats[] = [
  {
    matchId: "500101",
    home: {
      possession: 58,
      shots: 14,
      shotsOnTarget: 7,
      corners: 6,
      fouls: 9,
      yellowCards: 2,
      redCards: 0,
    },
    away: {
      possession: 42,
      shots: 9,
      shotsOnTarget: 3,
      corners: 3,
      fouls: 12,
      yellowCards: 3,
      redCards: 0,
    },
  },
  {
    matchId: "500102",
    home: {
      possession: 51,
      shots: 10,
      shotsOnTarget: 4,
      corners: 5,
      fouls: 8,
      yellowCards: 1,
      redCards: 0,
    },
    away: {
      possession: 49,
      shots: 8,
      shotsOnTarget: 3,
      corners: 4,
      fouls: 10,
      yellowCards: 2,
      redCards: 0,
    },
  },
  {
    matchId: "500103",
    home: {
      possession: 47,
      shots: 11,
      shotsOnTarget: 6,
      corners: 4,
      fouls: 7,
      yellowCards: 1,
      redCards: 0,
    },
    away: {
      possession: 53,
      shots: 13,
      shotsOnTarget: 5,
      corners: 7,
      fouls: 6,
      yellowCards: 2,
      redCards: 0,
    },
  },
];

export function getMatchBySlug(slug: string): Match | undefined {
  return matches.find((match) => match.slug === slug);
}

export function getMatchById(id: string): Match | undefined {
  return matches.find((match) => match.id === id);
}

export function getMatchStatsByMatchId(matchId: string): MatchStats | undefined {
  return matchStats.find((stats) => stats.matchId === matchId);
}
