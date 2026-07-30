import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { type Locale } from "@/lib/i18n/routing";
import { Link } from "@/lib/i18n/navigation";
import { toIntlLocale } from "@/lib/i18n/format";
import {
  getNewsBySlug,
  incrementNewsViews,
} from "@/lib/repositories/news";
import { getPlayerById } from "@/data/players.mock";
import { getMatchById } from "@/data/matches.mock";
import { AdSlot } from "@/components/ads/AdSlot";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { buildCanonical, buildLanguageAlternates } from "@/lib/seo/alternates";
import { SITE_NAME } from "@/lib/seo/site";
import { sanitizeNewsHtml } from "@/lib/sanitize";
import { localizeNewsMentions } from "@/lib/mentions";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getNewsBySlug(slug);
  if (!post) return {};

  const loc = locale as Locale;
  const title =
    post.metaTitle?.[loc]?.trim() || post.title[loc] || SITE_NAME;
  const description =
    post.metaDescription?.[loc]?.trim() || post.excerpt[loc] || undefined;
  const og = post.ogImage?.[loc]?.trim();

  return {
    title,
    description,
    alternates: {
      canonical: buildCanonical(locale, `/news/${slug}`),
      languages: buildLanguageAlternates(`/news/${slug}`),
    },
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
      ...(og ? { images: [{ url: og }] } : {}),
    },
  };
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = await getNewsBySlug(slug);
  if (!post) notFound();

  void incrementNewsViews(slug).catch(() => {});

  const [tNav, t] = await Promise.all([
    getTranslations({ locale, namespace: "nav" }),
    getTranslations({ locale, namespace: "news" }),
  ]);

  const loc = locale as Locale;
  const dateFormatter = new Intl.DateTimeFormat(toIntlLocale(loc), {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const players = post.playerIds
    .map((id) => getPlayerById(id))
    .filter(Boolean);
  const matches = post.matchIds
    .map((id) => getMatchById(id))
    .filter(Boolean);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 xl:px-8">
      <Breadcrumbs
        locale={locale}
        items={[
          { name: tNav("home"), href: "/" },
          { name: tNav("news"), href: "/news" },
          { name: post.title[loc], href: `/news/${slug}` },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <article className="min-w-0">
          {post.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.coverUrl}
              alt=""
              className="mb-6 h-48 w-full rounded-xl object-cover sm:h-64"
            />
          ) : (
            <div
              className={cn(
                "mb-6 h-48 w-full rounded-xl bg-linear-to-br sm:h-64",
                post.coverGradient
              )}
            />
          )}
          {post.publishedAt ? (
            <time
              dateTime={post.publishedAt}
              className="text-sm text-muted-foreground"
            >
              {dateFormatter.format(new Date(post.publishedAt))}
            </time>
          ) : null}
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {post.title[loc]}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("views", { count: post.viewCount })}
          </p>
          <p className="mt-4 text-lg text-muted-foreground">
            {post.excerpt[loc]}
          </p>
          <div
            className="prose prose-neutral dark:prose-invert mt-8 max-w-none text-base leading-relaxed [&_.news-mention]:rounded-md [&_.news-mention]:bg-primary/10 [&_.news-mention]:px-1.5 [&_.news-mention]:py-0.5 [&_.news-mention]:font-medium [&_.news-mention]:text-primary [&_.news-mention]:no-underline hover:[&_.news-mention]:underline"
            dangerouslySetInnerHTML={{
              __html: localizeNewsMentions(
                sanitizeNewsHtml(post.body[loc]),
                locale
              ),
            }}
          />

          {players.length > 0 ? (
            <section className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t("relatedPlayers")}
              </h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {players.map((player) =>
                  player ? (
                    <li key={player.id}>
                      <Link
                        href={`/player/${player.slug}`}
                        className="rounded-md bg-muted px-2.5 py-1 text-sm text-foreground hover:text-link"
                      >
                        {player.name}
                      </Link>
                    </li>
                  ) : null
                )}
              </ul>
            </section>
          ) : null}

          {matches.length > 0 ? (
            <section className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t("relatedMatches")}
              </h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {matches.map((match) =>
                  match ? (
                    <li key={match.id}>
                      <Link
                        href={`/match/${match.slug}`}
                        className="rounded-md bg-muted px-2.5 py-1 text-sm text-foreground hover:text-link"
                      >
                        {match.homeTeam.name} vs {match.awayTeam.name}
                      </Link>
                    </li>
                  ) : null
                )}
              </ul>
            </section>
          ) : null}

          <p className="mt-8 text-sm text-muted-foreground">{t("disclaimer")}</p>
        </article>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-20 lg:h-fit">
          <AdSlot placement="sidebar-rectangle" />
        </aside>
      </div>
    </div>
  );
}
