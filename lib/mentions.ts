import "server-only";

import { asc, desc, ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import { fixtures, players } from "@/lib/db/schema";
import { hydrateFixtures } from "@/lib/repositories/postgres";
import type { MentionItem } from "@/lib/mentions-shared";

export type { MentionItem, MentionKind } from "@/lib/mentions-shared";
export {
  isHintMention,
  localizeNewsMentions,
} from "@/lib/mentions-shared";

function hints(q: string): MentionItem[] {
  const items: MentionItem[] = [];
  if (!q || "player".startsWith(q)) {
    items.push({
      id: "__hint-player",
      label: "player …",
      slug: "",
      mentionType: "player",
      subtitle: "Type @player then a name",
    });
  }
  if (!q || "match".startsWith(q)) {
    items.push({
      id: "__hint-match",
      label: "match …",
      slug: "",
      mentionType: "match",
      subtitle: "Type @match then a fixture",
    });
  }
  return items;
}

export async function searchMentions(rawQuery: string): Promise<MentionItem[]> {
  const q = rawQuery.trim().toLowerCase();

  if (q === "player" || q.startsWith("player ")) {
    const term = q === "player" ? "" : q.slice("player ".length).trim();
    const rows = term
      ? await db
          .select()
          .from(players)
          .where(ilike(players.name, `%${term}%`))
          .orderBy(asc(players.name))
          .limit(8)
      : await db.select().from(players).orderBy(asc(players.name)).limit(8);

    return rows.map((p) => ({
      id: p.id,
      label: p.name,
      slug: p.slug,
      mentionType: "player" as const,
      subtitle: `#${p.shirtNumber} · ${p.position}`,
    }));
  }

  if (q === "match" || q.startsWith("match ")) {
    const term = q === "match" ? "" : q.slice("match ".length).trim();
    const rows = await db
      .select()
      .from(fixtures)
      .orderBy(desc(fixtures.kickoff))
      .limit(term ? 80 : 8);
    const matches = await hydrateFixtures(rows);
    const filtered = term
      ? matches
          .filter((m) => {
            const hay =
              `${m.homeTeam.name} ${m.awayTeam.name} ${m.homeTeam.shortName} ${m.awayTeam.shortName} ${m.slug}`.toLowerCase();
            return hay.includes(term);
          })
          .slice(0, 8)
      : matches;

    return filtered.map((m) => ({
      id: m.id,
      label: `${m.homeTeam.shortName} vs ${m.awayTeam.shortName}`,
      slug: m.slug,
      mentionType: "match" as const,
      subtitle: `${m.homeTeam.name} vs ${m.awayTeam.name}`,
    }));
  }

  if (!q || "player".startsWith(q) || "match".startsWith(q)) {
    return hints(q);
  }

  return [];
}
