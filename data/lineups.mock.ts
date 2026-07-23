import type { Lineup, Player } from "@/lib/types";
import { getTeamBySlug } from "./teams.mock";
import { getPlayerById } from "./players.mock";

function players(ids: string[]): Player[] {
  return ids.map((id) => {
    const p = getPlayerById(id);
    if (!p) throw new Error(`Unknown player id in mock lineup: ${id}`);
    return p;
  });
}

export const lineups: Lineup[] = [
  {
    matchId: "500101",
    teamId: getTeamBySlug("wydad-ac")!.id,
    formation: "4-3-3",
    startingXI: players([
      "p0001",
      "p0003",
      "p0004",
      "p0005",
      "p0006",
      "p0009",
      "p0010",
      "p0011",
      "p0015",
      "p0016",
      "p0017",
    ]),
    substitutes: players([
      "p0002",
      "p0007",
      "p0008",
      "p0012",
      "p0013",
      "p0014",
      "p0018",
    ]),
  },
  {
    matchId: "500101",
    teamId: getTeamBySlug("raja-ca")!.id,
    formation: "4-2-3-1",
    startingXI: players([
      "p0019",
      "p0021",
      "p0022",
      "p0023",
      "p0024",
      "p0027",
      "p0028",
      "p0029",
      "p0030",
      "p0031",
      "p0033",
    ]),
    substitutes: players([
      "p0020",
      "p0025",
      "p0026",
      "p0032",
      "p0034",
      "p0035",
      "p0036",
    ]),
  },
  {
    matchId: "500103",
    teamId: getTeamBySlug("moghreb-tetouan")!.id,
    formation: "4-3-3",
    startingXI: players([
      "p0073",
      "p0075",
      "p0076",
      "p0077",
      "p0078",
      "p0081",
      "p0082",
      "p0083",
      "p0087",
      "p0088",
      "p0089",
    ]),
    substitutes: players([
      "p0074",
      "p0079",
      "p0080",
      "p0084",
      "p0085",
      "p0086",
      "p0090",
    ]),
  },
  {
    matchId: "500103",
    teamId: getTeamBySlug("hassania-agadir")!.id,
    formation: "4-2-3-1",
    startingXI: players([
      "p0109",
      "p0111",
      "p0112",
      "p0113",
      "p0114",
      "p0117",
      "p0118",
      "p0119",
      "p0120",
      "p0121",
      "p0123",
    ]),
    substitutes: players([
      "p0110",
      "p0115",
      "p0116",
      "p0122",
      "p0124",
      "p0125",
      "p0126",
    ]),
  },
];

export function getLineupsByMatchId(matchId: string): Lineup[] {
  return lineups.filter((l) => l.matchId === matchId);
}

export function getLineupForTeamInMatch(
  matchId: string,
  teamId: string
): Lineup | undefined {
  return lineups.find((l) => l.matchId === matchId && l.teamId === teamId);
}
