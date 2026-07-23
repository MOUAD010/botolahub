import { matches } from "@/data/matches.mock";
import { players } from "@/data/players.mock";
import { teams, getTeamById } from "@/data/teams.mock";

export type SearchResultKind = "team" | "player" | "match";

export interface SearchResult {
  kind: SearchResultKind;
  id: string;
  href: string;
  title: string;
  subtitle: string;
  imageUrl?: string;
}

function normalize(q: string): string {
  return q
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function searchCatalog(query: string, limit = 12): SearchResult[] {
  const q = normalize(query);
  if (q.length < 1) return [];

  const results: SearchResult[] = [];

  for (const team of teams) {
    const hay = normalize(`${team.name} ${team.shortName} ${team.city ?? ""}`);
    if (!hay.includes(q)) continue;
    results.push({
      kind: "team",
      id: team.id,
      href: `/team/${team.slug}`,
      title: team.name,
      subtitle: team.shortName,
      imageUrl: team.badgeUrl,
    });
  }

  for (const player of players) {
    const hay = normalize(player.name);
    if (!hay.includes(q)) continue;
    const team = getTeamById(player.teamId);
    results.push({
      kind: "player",
      id: player.id,
      href: `/player/${player.slug}`,
      title: player.name,
      subtitle: team
        ? `${team.shortName} · #${player.shirtNumber}`
        : `#${player.shirtNumber}`,
      imageUrl: player.photoUrl,
    });
  }

  for (const match of matches) {
    const hay = normalize(
      `${match.homeTeam.name} ${match.awayTeam.name} ${match.homeTeam.shortName} ${match.awayTeam.shortName}`
    );
    if (!hay.includes(q)) continue;
    results.push({
      kind: "match",
      id: match.id,
      href: `/match/${match.slug}`,
      title: `${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`,
      subtitle:
        match.status === "upcoming"
          ? "Upcoming"
          : match.status === "live"
            ? "Live"
            : `${match.homeScore}–${match.awayScore}`,
      imageUrl: match.homeTeam.badgeUrl,
    });
  }

  const order: Record<SearchResultKind, number> = {
    team: 0,
    player: 1,
    match: 2,
  };

  return results
    .sort((a, b) => order[a.kind] - order[b.kind] || a.title.localeCompare(b.title))
    .slice(0, limit);
}
