import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  newsArticles,
  newsMatchTags,
  newsPlayerTags,
  newsTags,
  newsTranslations,
  type LocalizedString,
} from "@/lib/db/schema";
import type { Locale } from "@/lib/i18n/routing";

export type NewsListItem = {
  id: string;
  slug: string;
  status: "draft" | "published";
  publishedAt: string | null;
  coverGradient: string;
  coverUrl: string | null;
  viewCount: number;
  title: Record<Locale, string>;
  excerpt: Record<Locale, string>;
  tags: string[];
};

export type NewsArticleDetail = NewsListItem & {
  body: Record<Locale, string>;
  metaTitle: LocalizedString | null;
  metaDescription: LocalizedString | null;
  ogImage: LocalizedString | null;
  playerIds: string[];
  matchIds: string[];
};

function emptyLocaleRecord(): Record<Locale, string> {
  return { fr: "", ar: "", en: "" };
}

async function hydrateArticles(
  rows: (typeof newsArticles.$inferSelect)[]
): Promise<NewsListItem[]> {
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const [translations, tags] = await Promise.all([
    db
      .select()
      .from(newsTranslations)
      .where(inArray(newsTranslations.articleId, ids)),
    db.select().from(newsTags).where(inArray(newsTags.articleId, ids)),
  ]);

  return rows.map((row) => {
    const title = emptyLocaleRecord();
    const excerpt = emptyLocaleRecord();
    for (const t of translations.filter((x) => x.articleId === row.id)) {
      title[t.locale] = t.title;
      excerpt[t.locale] = t.excerpt;
    }
    return {
      id: row.id,
      slug: row.slug,
      status: row.status,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      coverGradient: row.coverGradient,
      coverUrl: row.coverUrl,
      viewCount: row.viewCount,
      title,
      excerpt,
      tags: tags.filter((t) => t.articleId === row.id).map((t) => t.tag),
    };
  });
}

export async function listPublishedNews(): Promise<NewsListItem[]> {
  const rows = await db
    .select()
    .from(newsArticles)
    .where(eq(newsArticles.status, "published"))
    .orderBy(desc(newsArticles.publishedAt));
  return hydrateArticles(rows);
}

export async function listAllNews(): Promise<NewsListItem[]> {
  const rows = await db
    .select()
    .from(newsArticles)
    .orderBy(desc(newsArticles.updatedAt));
  return hydrateArticles(rows);
}

export async function getNewsBySlug(
  slug: string,
  opts?: { includeDraft?: boolean }
): Promise<NewsArticleDetail | null> {
  const [row] = await db
    .select()
    .from(newsArticles)
    .where(eq(newsArticles.slug, slug))
    .limit(1);

  if (!row) return null;
  if (!opts?.includeDraft && row.status !== "published") return null;

  const [translations, tags, players, matches] = await Promise.all([
    db
      .select()
      .from(newsTranslations)
      .where(eq(newsTranslations.articleId, row.id)),
    db.select().from(newsTags).where(eq(newsTags.articleId, row.id)),
    db
      .select()
      .from(newsPlayerTags)
      .where(eq(newsPlayerTags.articleId, row.id)),
    db
      .select()
      .from(newsMatchTags)
      .where(eq(newsMatchTags.articleId, row.id)),
  ]);

  const title = emptyLocaleRecord();
  const excerpt = emptyLocaleRecord();
  const body = emptyLocaleRecord();
  for (const t of translations) {
    title[t.locale] = t.title;
    excerpt[t.locale] = t.excerpt;
    body[t.locale] = t.body;
  }

  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    coverGradient: row.coverGradient,
    coverUrl: row.coverUrl,
    viewCount: row.viewCount,
    title,
    excerpt,
    body,
    tags: tags.map((t) => t.tag),
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    ogImage: row.ogImage,
    playerIds: players.map((p) => p.playerId),
    matchIds: matches.map((m) => m.matchId),
  };
}

export async function getNewsById(id: string): Promise<NewsArticleDetail | null> {
  const [row] = await db
    .select()
    .from(newsArticles)
    .where(eq(newsArticles.id, id))
    .limit(1);
  if (!row) return null;
  return getNewsBySlug(row.slug, { includeDraft: true });
}

export async function incrementNewsViews(slug: string): Promise<void> {
  await db
    .update(newsArticles)
    .set({ viewCount: sql`${newsArticles.viewCount} + 1` })
    .where(
      and(eq(newsArticles.slug, slug), eq(newsArticles.status, "published"))
    );
}

export type UpsertNewsInput = {
  slug: string;
  status: "draft" | "published";
  publishedAt?: string | null;
  coverGradient?: string;
  coverUrl?: string | null;
  metaTitle?: LocalizedString | null;
  metaDescription?: LocalizedString | null;
  ogImage?: LocalizedString | null;
  translations: Record<
    Locale,
    { title: string; excerpt: string; body: string }
  >;
  tags?: string[];
  playerIds?: string[];
  matchIds?: string[];
};

export async function createNews(input: UpsertNewsInput): Promise<string> {
  const publishedAt =
    input.status === "published"
      ? input.publishedAt
        ? new Date(input.publishedAt)
        : new Date()
      : input.publishedAt
        ? new Date(input.publishedAt)
        : null;

  const [row] = await db
    .insert(newsArticles)
    .values({
      slug: input.slug,
      status: input.status,
      publishedAt,
      coverGradient: input.coverGradient ?? "from-emerald-700 to-slate-900",
      coverUrl: input.coverUrl ?? null,
      metaTitle: input.metaTitle ?? null,
      metaDescription: input.metaDescription ?? null,
      ogImage: input.ogImage ?? null,
      updatedAt: new Date(),
    })
    .returning();

  await replaceArticleRelations(row.id, input);
  return row.id;
}

export async function updateNews(
  id: string,
  input: UpsertNewsInput
): Promise<void> {
  const publishedAt =
    input.status === "published"
      ? input.publishedAt
        ? new Date(input.publishedAt)
        : new Date()
      : null;

  await db
    .update(newsArticles)
    .set({
      slug: input.slug,
      status: input.status,
      publishedAt,
      coverGradient: input.coverGradient ?? "from-emerald-700 to-slate-900",
      coverUrl: input.coverUrl ?? null,
      metaTitle: input.metaTitle ?? null,
      metaDescription: input.metaDescription ?? null,
      ogImage: input.ogImage ?? null,
      updatedAt: new Date(),
    })
    .where(eq(newsArticles.id, id));

  await db.delete(newsTranslations).where(eq(newsTranslations.articleId, id));
  await db.delete(newsTags).where(eq(newsTags.articleId, id));
  await db.delete(newsPlayerTags).where(eq(newsPlayerTags.articleId, id));
  await db.delete(newsMatchTags).where(eq(newsMatchTags.articleId, id));
  await replaceArticleRelations(id, input);
}

async function replaceArticleRelations(id: string, input: UpsertNewsInput) {
  await db.insert(newsTranslations).values(
    (["fr", "ar", "en"] as const).map((locale) => ({
      articleId: id,
      locale,
      title: input.translations[locale].title,
      excerpt: input.translations[locale].excerpt,
      body: input.translations[locale].body,
    }))
  );

  const tags = (input.tags ?? []).map((t) => t.trim()).filter(Boolean);
  if (tags.length) {
    await db.insert(newsTags).values(tags.map((tag) => ({ articleId: id, tag })));
  }

  const playerIds = [...new Set(input.playerIds ?? [])];
  if (playerIds.length) {
    await db
      .insert(newsPlayerTags)
      .values(playerIds.map((playerId) => ({ articleId: id, playerId })));
  }

  const matchIds = [...new Set(input.matchIds ?? [])];
  if (matchIds.length) {
    await db
      .insert(newsMatchTags)
      .values(matchIds.map((matchId) => ({ articleId: id, matchId })));
  }
}

export async function deleteNews(id: string): Promise<void> {
  await db.delete(newsArticles).where(eq(newsArticles.id, id));
}

export async function getNewsStats() {
  const [stats] = await db
    .select({
      published: sql<number>`count(*) filter (where ${newsArticles.status} = 'published')::int`,
      drafts: sql<number>`count(*) filter (where ${newsArticles.status} = 'draft')::int`,
      totalViews: sql<number>`coalesce(sum(${newsArticles.viewCount}), 0)::int`,
    })
    .from(newsArticles);

  return {
    published: stats?.published ?? 0,
    drafts: stats?.drafts ?? 0,
    totalViews: stats?.totalViews ?? 0,
  };
}
