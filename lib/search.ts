import { desc, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { fixtures, players, teams } from "@/lib/db/schema";
import { hydrateFixtures } from "@/lib/repositories/postgres";

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

export async function searchCatalog(
  query: string,
  limit = 12
): Promise<SearchResult[]> {
  const q = normalize(query);
  if (q.length < 1) return [];

  const results: SearchResult[] = [];
  const pattern = `%${q}%`;

  const teamRows = await db
    .select()
    .from(teams)
    .where(
      or(
        ilike(teams.name, pattern),
        ilike(teams.shortName, pattern),
        ilike(teams.venueCity, pattern)
      )
    )
    .limit(limit);

  for (const team of teamRows) {
    results.push({
      kind: "team",
      id: team.id,
      href: `/team/${team.slug}`,
      title: team.name,
      subtitle: team.shortName,
      imageUrl: team.logoPath ?? undefined,
    });
  }

  const playerRows = await db
    .select()
    .from(players)
    .where(ilike(players.name, pattern))
    .limit(limit);

  const teamIds = [
    ...new Set(playerRows.map((p) => p.teamId).filter(Boolean)),
  ] as string[];
  const teamMap = new Map<string, (typeof teams.$inferSelect)>();
  if (teamIds.length) {
    const rows = await db.select().from(teams).where(inArray(teams.id, teamIds));
    for (const t of rows) teamMap.set(t.id, t);
  }

  for (const player of playerRows) {
    const team = player.teamId ? teamMap.get(player.teamId) : undefined;
    results.push({
      kind: "player",
      id: player.id,
      href: `/player/${player.slug}`,
      title: player.name,
      subtitle: team
        ? `${team.shortName} · #${player.shirtNumber}`
        : `#${player.shirtNumber}`,
      imageUrl: player.photoPath ?? undefined,
    });
  }

  const fixtureRows = await db
    .select()
    .from(fixtures)
    .orderBy(desc(fixtures.kickoff))
    .limit(60);
  const matches = await hydrateFixtures(fixtureRows);
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
    .sort(
      (a, b) => order[a.kind] - order[b.kind] || a.title.localeCompare(b.title)
    )
    .slice(0, limit);
}
