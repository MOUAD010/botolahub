import type { Lineup, Player } from "@/lib/types";
import { getPlayerById } from "./players.mock";

/** Curated Team of the Week XI — formation 4-3-3 */
const TOTW_IDS = [
  "p0001", // GK
  "p0003",
  "p0004",
  "p0021",
  "p0022", // DF
  "p0009",
  "p0010",
  "p0027", // MF
  "p0015",
  "p0033",
  "p0016", // FW
] as const;

function pick(id: string): Player {
  const player = getPlayerById(id);
  if (!player) throw new Error(`TOTW missing player ${id}`);
  return player;
}

export const teamOfTheWeek: Lineup = {
  matchId: "totw-md-current",
  teamId: "totw",
  formation: "4-3-3",
  startingXI: TOTW_IDS.map(pick),
  substitutes: [],
};

export const totwWeekLabel = "Matchday 12";
