import type { PlayerMatchRating, PlayerSeasonStats } from "@/lib/types";
import { players } from "./players.mock";

const SEASON = "2025/26";

function seed(id: string): number {
  return parseInt(id.replace("p", ""), 10);
}

export const playerSeasonStats: PlayerSeasonStats[] = players.map((p) => {
  const n = seed(p.id);
  const isGK = p.position === "GK";
  const isFW = p.position === "FW";
  const isMF = p.position === "MF";

  return {
    playerId: p.id,
    season: SEASON,
    appearances: 8 + (n % 6),
    goals: isGK ? 0 : isFW ? n % 9 : isMF ? n % 4 : n % 2,
    assists: isGK ? 0 : n % 5,
    yellowCards: n % 4,
    redCards: n % 17 === 0 ? 1 : 0,
    averageRating: Math.round((6.2 + ((n % 20) / 20) * 1.6) * 10) / 10,
  };
});

export function getSeasonStatsByPlayerId(
  playerId: string
): PlayerSeasonStats | undefined {
  return playerSeasonStats.find((s) => s.playerId === playerId);
}

const RECENT_OPPONENTS = [
  "WAC",
  "RCA",
  "FAR",
  "RSB",
  "MAT",
  "OCS",
  "HUSA",
  "DHJ",
  "FUS",
  "CM",
];

export const playerMatchRatings: PlayerMatchRating[] = players.flatMap((p) => {
  const n = seed(p.id);
  return Array.from({ length: 8 }, (_, i) => {
    const rating =
      Math.round((6.0 + (((n + i * 3) % 25) / 25) * 2.5) * 10) / 10;
    const resultRoll = (n + i) % 3;
    const result: "W" | "D" | "L" =
      resultRoll === 0 ? "W" : resultRoll === 1 ? "D" : "L";
    const homeGoals = result === "W" ? 2 : result === "D" ? 1 : 0;
    const awayGoals = result === "L" ? 2 : result === "D" ? 1 : 1;

    return {
      matchId: `hist-${p.id}-${i}`,
      playerId: p.id,
      date: new Date(
        Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
      opponentShortName: RECENT_OPPONENTS[(n + i) % RECENT_OPPONENTS.length],
      rating,
      minutes: 60 + ((n + i) % 31),
      goals: p.position === "FW" ? (n + i) % 3 : (n + i) % 2 === 0 ? 0 : 0,
      assists: p.position === "GK" ? 0 : (n + i) % 4 === 0 ? 1 : 0,
      yellowCards: (n + i) % 5 === 0 ? 1 : 0,
      redCards: 0,
      result,
      score: `${homeGoals}-${awayGoals}`,
    };
  });
});

export function getRecentRatingsByPlayerId(
  playerId: string,
  limit = 12
): PlayerMatchRating[] {
  return playerMatchRatings
    .filter((r) => r.playerId === playerId)
    .slice(0, limit);
}
