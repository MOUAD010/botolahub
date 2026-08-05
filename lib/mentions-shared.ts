export type MentionKind = "player" | "match";

export type MentionItem = {
  id: string;
  label: string;
  slug: string;
  mentionType: MentionKind;
  subtitle?: string;
};

export function isHintMention(item: MentionItem): boolean {
  return item.id.startsWith("__hint-");
}

/** Point mention anchors at the active locale path. */
export function localizeNewsMentions(html: string, locale: string): string {
  return html.replace(/<a\b([^>]*)>/gi, (full, attrs: string) => {
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
  });
}
