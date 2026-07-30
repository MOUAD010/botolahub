import { players } from "@/data/players.mock";
import { matches } from "@/data/matches.mock";

export type MentionKind = "player" | "match";

export type MentionItem = {
  id: string;
  label: string;
  slug: string;
  mentionType: MentionKind;
  subtitle?: string;
};

export function searchMentions(rawQuery: string): MentionItem[] {
  const q = rawQuery.trim().toLowerCase();

  if (q === "player" || q.startsWith("player ")) {
    const term = q === "player" ? "" : q.slice("player ".length).trim();
    return players
      .filter((p) => !term || p.name.toLowerCase().includes(term))
      .slice(0, 8)
      .map((p) => ({
        id: p.id,
        label: p.name,
        slug: p.slug,
        mentionType: "player" as const,
        subtitle: `#${p.shirtNumber} · ${p.position}`,
      }));
  }

  if (q === "match" || q.startsWith("match ")) {
    const term = q === "match" ? "" : q.slice("match ".length).trim();
    return matches
      .filter((m) => {
        if (!term) return true;
        const hay =
          `${m.homeTeam.name} ${m.awayTeam.name} ${m.homeTeam.shortName} ${m.awayTeam.shortName} ${m.slug}`.toLowerCase();
        return hay.includes(term);
      })
      .slice(0, 8)
      .map((m) => ({
        id: m.id,
        label: `${m.homeTeam.shortName} vs ${m.awayTeam.shortName}`,
        slug: m.slug,
        mentionType: "match" as const,
        subtitle: `${m.homeTeam.name} vs ${m.awayTeam.name}`,
      }));
  }

  if (!q || "player".startsWith(q) || "match".startsWith(q)) {
    const hints: MentionItem[] = [];
    if (!q || "player".startsWith(q)) {
      hints.push({
        id: "__hint-player",
        label: "player …",
        slug: "",
        mentionType: "player",
        subtitle: "Type @player then a name",
      });
    }
    if (!q || "match".startsWith(q)) {
      hints.push({
        id: "__hint-match",
        label: "match …",
        slug: "",
        mentionType: "match",
        subtitle: "Type @match then a fixture",
      });
    }
    return hints;
  }

  return [];
}

export function isHintMention(item: MentionItem): boolean {
  return item.id.startsWith("__hint-");
}

/** Point mention anchors at the active locale path. */
export function localizeNewsMentions(html: string, locale: string): string {
  return html.replace(
    /<a\b([^>]*)>/gi,
    (full, attrs: string) => {
      const typeMatch = attrs.match(/\bdata-mention-type="(player|match)"/i);
      if (!typeMatch) return full;
      const type = typeMatch[1].toLowerCase();
      const slugMatch = attrs.match(/\bdata-slug="([^"]+)"/i);
      const slug = slugMatch?.[1];
      if (!slug) return full;

      const href = `/${locale}/${type}/${slug}`;
      if (/\bhref="/i.test(attrs)) {
        return `<a${attrs.replace(/\bhref="[^"]*"/i, `href="${href}"`)}>`;
      }
      return `<a${attrs} href="${href}">`;
    }
  );
}
