import {
  boolean,
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

/* ─── Football domain (API-Football sync) ─── */

export const competitions = pgTable("competitions", {
  id: text("id").primaryKey(), // slug e.g. botola-pro
  apiId: integer("api_id").notNull().unique(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  type: text("type").notNull(),
  country: text("country").notNull().default("Morocco"),
  logoPath: text("logo_path"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const competitionSeasons = pgTable(
  "competition_seasons",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    competitionId: text("competition_id")
      .notNull()
      .references(() => competitions.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    startDate: text("start_date"),
    endDate: text("end_date"),
    current: integer("current").notNull().default(0), // 1/0
    coverage: jsonb("coverage"),
  },
  (t) => [
    uniqueIndex("competition_seasons_comp_year").on(t.competitionId, t.year),
  ]
);

export const teams = pgTable("teams", {
  id: text("id").primaryKey(), // slug-apiId
  apiId: integer("api_id").notNull().unique(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  logoPath: text("logo_path"),
  founded: integer("founded"),
  venueName: text("venue_name"),
  venueCity: text("venue_city"),
  venueApiId: integer("venue_api_id"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const competitionTeams = pgTable(
  "competition_teams",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    competitionId: text("competition_id")
      .notNull()
      .references(() => competitions.id, { onDelete: "cascade" }),
    seasonYear: integer("season_year").notNull(),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
  },
  (t) => [
    uniqueIndex("competition_teams_unique").on(
      t.competitionId,
      t.seasonYear,
      t.teamId
    ),
  ]
);

export const players = pgTable("players", {
  id: text("id").primaryKey(),
  apiId: integer("api_id").notNull().unique(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  photoPath: text("photo_path"),
  nationality: text("nationality"),
  position: text("position").notNull().default("MF"),
  shirtNumber: integer("shirt_number").notNull().default(0),
  teamId: text("team_id").references(() => teams.id, { onDelete: "set null" }),
  age: integer("age"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const standingsRows = pgTable(
  "standings_rows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    competitionId: text("competition_id")
      .notNull()
      .references(() => competitions.id, { onDelete: "cascade" }),
    seasonYear: integer("season_year").notNull(),
    rank: integer("rank").notNull(),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    played: integer("played").notNull().default(0),
    won: integer("won").notNull().default(0),
    drawn: integer("drawn").notNull().default(0),
    lost: integer("lost").notNull().default(0),
    goalsFor: integer("goals_for").notNull().default(0),
    goalsAgainst: integer("goals_against").notNull().default(0),
    goalsDiff: integer("goals_diff").notNull().default(0),
    points: integer("points").notNull().default(0),
    form: text("form"),
    description: text("description"),
    zone: text("zone"), // continental | relegation | null
  },
  (t) => [
    uniqueIndex("standings_rows_unique").on(
      t.competitionId,
      t.seasonYear,
      t.teamId
    ),
  ]
);

export const fixtures = pgTable("fixtures", {
  id: text("id").primaryKey(),
  apiId: integer("api_id").notNull().unique(),
  slug: text("slug").notNull().unique(),
  competitionId: text("competition_id")
    .notNull()
    .references(() => competitions.id, { onDelete: "cascade" }),
  seasonYear: integer("season_year").notNull(),
  round: text("round"),
  matchday: integer("matchday").notNull().default(0),
  homeTeamId: text("home_team_id")
    .notNull()
    .references(() => teams.id),
  awayTeamId: text("away_team_id")
    .notNull()
    .references(() => teams.id),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  status: text("status").notNull().default("upcoming"), // upcoming|live|finished
  statusShort: text("status_short"),
  kickoff: timestamp("kickoff", { withTimezone: true }).notNull(),
  minute: integer("minute"),
  venue: text("venue"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const fixtureDetails = pgTable("fixture_details", {
  fixtureId: text("fixture_id")
    .primaryKey()
    .references(() => fixtures.id, { onDelete: "cascade" }),
  events: jsonb("events"),
  lineups: jsonb("lineups"),
  statistics: jsonb("statistics"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const playerSeasonStats = pgTable(
  "player_season_stats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    playerId: text("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    competitionId: text("competition_id")
      .notNull()
      .references(() => competitions.id, { onDelete: "cascade" }),
    seasonYear: integer("season_year").notNull(),
    appearances: integer("appearances").notNull().default(0),
    goals: integer("goals").notNull().default(0),
    assists: integer("assists").notNull().default(0),
    yellowCards: integer("yellow_cards").notNull().default(0),
    redCards: integer("red_cards").notNull().default(0),
    averageRating: text("average_rating"),
  },
  (t) => [
    uniqueIndex("player_season_stats_unique").on(
      t.playerId,
      t.competitionId,
      t.seasonYear
    ),
  ]
);

export const syncRuns = pgTable("sync_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  kind: text("kind").notNull(),
  status: text("status").notNull().default("running"), // running|ok|error
  requestsUsed: integer("requests_used").notNull().default(0),
  message: text("message"),
  startedAt: timestamp("started_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
});

export const adPlacementEnum = pgEnum("ad_placement", [
  "header-leaderboard",
  "sidebar-rectangle",
  "in-feed",
  "footer-banner",
]);

/**
 * @deprecated Manual creatives removed — network-only ads.
 * Table kept so existing DBs don’t break; unused by the app.
 */
export const adCreatives = pgTable("ad_creatives", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  placement: adPlacementEnum("placement").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  imageUrl: text("image_url"),
  clickUrl: text("click_url"),
  htmlSnippet: text("html_snippet"),
  sortOrder: integer("sort_order").notNull().default(0),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/** Singleton site-wide ad network config (id always "default"). */
export const adSettings = pgTable("ad_settings", {
  id: text("id").primaryKey().default("default"),
  provider: text("provider").notNull().default("none"), // none|adsense|custom
  enabled: boolean("enabled").notNull().default(false),
  publisherId: text("publisher_id"),
  scriptUrl: text("script_url"),
  /** { placement: { unitId, enabled } } */
  slots: jsonb("slots")
    .$type<
      Partial<
        Record<
          | "header-leaderboard"
          | "sidebar-rectangle"
          | "in-feed"
          | "footer-banner",
          { unitId: string; enabled: boolean }
        >
      >
    >()
    .notNull()
    .default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
