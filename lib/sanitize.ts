import DOMPurify from "isomorphic-dompurify";

export function sanitizeNewsHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: [
      "target",
      "rel",
      "class",
      "data-type",
      "data-mention-type",
      "data-id",
      "data-slug",
      "data-label",
    ],
  });
}

export function isEmptyHtml(html: string): boolean {
  const text = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
  return text.length === 0;
}
