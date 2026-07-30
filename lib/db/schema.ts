import {
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const newsStatusEnum = pgEnum("news_status", ["draft", "published"]);
export const localeEnum = pgEnum("locale", ["fr", "ar", "en"]);

export type LocalizedString = {
  fr?: string | null;
  ar?: string | null;
  en?: string | null;
};

export const admins = pgTable("admins", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const newsArticles = pgTable("news_articles", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  status: newsStatusEnum("status").notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  coverGradient: text("cover_gradient")
    .notNull()
    .default("from-emerald-700 to-slate-900"),
  coverUrl: text("cover_url"),
  viewCount: integer("view_count").notNull().default(0),
  metaTitle: jsonb("meta_title").$type<LocalizedString>(),
  metaDescription: jsonb("meta_description").$type<LocalizedString>(),
  ogImage: jsonb("og_image").$type<LocalizedString>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const newsTranslations = pgTable(
  "news_translations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    articleId: uuid("article_id")
      .notNull()
      .references(() => newsArticles.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull(),
    body: text("body").notNull(),
  },
  (t) => [uniqueIndex("news_translations_article_locale").on(t.articleId, t.locale)]
);

export const newsTags = pgTable(
  "news_tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    articleId: uuid("article_id")
      .notNull()
      .references(() => newsArticles.id, { onDelete: "cascade" }),
    tag: text("tag").notNull(),
  },
  (t) => [uniqueIndex("news_tags_article_tag").on(t.articleId, t.tag)]
);

export const newsPlayerTags = pgTable(
  "news_player_tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    articleId: uuid("article_id")
      .notNull()
      .references(() => newsArticles.id, { onDelete: "cascade" }),
    playerId: text("player_id").notNull(),
  },
  (t) => [
    uniqueIndex("news_player_tags_article_player").on(t.articleId, t.playerId),
  ]
);

export const newsMatchTags = pgTable(
  "news_match_tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    articleId: uuid("article_id")
      .notNull()
      .references(() => newsArticles.id, { onDelete: "cascade" }),
    matchId: text("match_id").notNull(),
  },
  (t) => [
    uniqueIndex("news_match_tags_article_match").on(t.articleId, t.matchId),
  ]
);

export const pageviewsDaily = pgTable(
  "pageviews_daily",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    date: date("date").notNull(),
    path: text("path").notNull(),
    locale: text("locale").notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [
    uniqueIndex("pageviews_daily_date_path_locale").on(
      t.date,
      t.path,
      t.locale
    ),
  ]
);
