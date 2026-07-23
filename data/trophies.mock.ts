import type { TeamTrophy } from "@/lib/types";
import { getTeamBySlug } from "./teams.mock";

function teamId(slug: string): string {
  const t = getTeamBySlug(slug);
  if (!t) throw new Error(`Unknown team for trophies: ${slug}`);
  return t.id;
}

export const trophies: TeamTrophy[] = [
  {
    id: "tr-wac-botola",
    teamId: teamId("wydad-ac"),
    name: "Botola Pro",
    shortName: "Botola",
    count: 22,
    seasons: ["2021/22", "2020/21", "2018/19", "2016/17", "2014/15"],
  },
  {
    id: "tr-wac-throne",
    teamId: teamId("wydad-ac"),
    name: "Throne Cup",
    shortName: "Coupe du Trône",
    count: 9,
    seasons: ["2001", "1998", "1997", "1989", "1981"],
  },
  {
    id: "tr-wac-caf",
    teamId: teamId("wydad-ac"),
    name: "CAF Champions League",
    shortName: "CAF CL",
    count: 3,
    seasons: ["2021/22", "2016/17", "1992"],
  },
  {
    id: "tr-wac-super",
    teamId: teamId("wydad-ac"),
    name: "CAF Super Cup",
    shortName: "CAF SC",
    count: 1,
    seasons: ["2018"],
  },
  {
    id: "tr-rca-botola",
    teamId: teamId("raja-ca"),
    name: "Botola Pro",
    shortName: "Botola",
    count: 13,
    seasons: ["2019/20", "2012/13", "2010/11", "2008/09", "2003/04"],
  },
  {
    id: "tr-rca-caf",
    teamId: teamId("raja-ca"),
    name: "CAF Champions League",
    shortName: "CAF CL",
    count: 3,
    seasons: ["1999", "1997", "1989"],
  },
  {
    id: "tr-far-botola",
    teamId: teamId("as-far"),
    name: "Botola Pro",
    shortName: "Botola",
    count: 13,
    seasons: ["2022/23", "2007/08", "1983/84"],
  },
  {
    id: "tr-far-throne",
    teamId: teamId("as-far"),
    name: "Throne Cup",
    shortName: "Coupe du Trône",
    count: 12,
    seasons: ["2020", "2008", "2007"],
  },
  {
    id: "tr-rsb-caf",
    teamId: teamId("rs-berkane"),
    name: "CAF Confederation Cup",
    shortName: "CAF CC",
    count: 2,
    seasons: ["2021/22", "2019/20"],
  },
];

export function getTrophiesByTeamId(teamId: string): TeamTrophy[] {
  return trophies.filter((t) => t.teamId === teamId);
}
