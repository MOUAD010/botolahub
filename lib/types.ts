export interface Competition {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  country: string;
}

export interface Team {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  badgeUrl: string;
  founded?: number;
  venue?: string;
  city?: string;
}

export interface TeamTrophy {
  id: string;
  teamId: string;
  name: string;
  shortName: string;
  count: number;
  seasons: string[];
}

export type MatchStatus = "upcoming" | "live" | "finished";

export interface Match {
  id: string;
  slug: string;
  competitionId: string;
  matchday: number;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  kickoff: string;
  minute?: number;
  venue?: string;
}

export interface TeamMatchStats {
  possession: number;
  shots: number;
  shotsOnTarget: number;
  corners: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
}

export interface MatchStats {
  matchId: string;
  home: TeamMatchStats;
  away: TeamMatchStats;
}

export interface MatchGoalEvent {
  minute: number;
  extraMinute?: number;
  playerName: string;
  playerApiId: number;
  teamApiId: number;
  /** Which side the goal is credited to on the scoreboard */
  side: "home" | "away";
  detail: string;
}

export type MatchEventKind = "goal" | "yellow" | "red" | "subst" | "var";

export interface MatchTimelineEvent {
  minute: number;
  extraMinute?: number;
  kind: MatchEventKind;
  side: "home" | "away";
  detail: string;
  playerName: string;
  /** Second player (assist / player on for subst) */
  secondaryName?: string;
}

export type StandingZone = "continental" | "relegation" | null;

export interface Standing {
  position: number;
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  form: Array<"W" | "D" | "L">;
  zone: StandingZone;
}

export type PlayerPosition = "GK" | "DF" | "MF" | "FW";

export interface Player {
  id: string;
  slug: string;
  name: string;
  shirtNumber: number;
  position: PlayerPosition;
  teamId: string;
  nationality?: string;
  dateOfBirth?: string;
  age?: number;
  /** Optional headshot URL; missing → PlayerAvatar placeholder */
  photoUrl?: string;
  preferredFoot?: "left" | "right" | "both";
  heightCm?: number;
}

/**
 * startingXI is ordered GK first, then outfield lines from defense to
 * attack, left-to-right within each line — FormationPitch derives (x%, y%)
 * from this order plus `formation`, it never reads baked-in coordinates.
 */
export interface Lineup {
  matchId: string;
  teamId: string;
  formation: string;
  coachName?: string;
  startingXI: Player[];
  substitutes: Player[];
}

export interface PlayerSeasonStats {
  playerId: string;
  season: string;
  appearances: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  averageRating: number;
}

export interface PlayerMatchRating {
  matchId: string;
  playerId: string;
  date: string;
  opponentShortName: string;
  rating: number;
  minutes?: number;
  goals?: number;
  assists?: number;
  yellowCards?: number;
  redCards?: number;
  result?: "W" | "D" | "L";
  score?: string;
}
