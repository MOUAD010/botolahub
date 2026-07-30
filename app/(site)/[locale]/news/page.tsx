import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { type Locale } from "@/lib/i18n/routing";
import { Link } from "@/lib/i18n/navigation";
import { toIntlLocale } from "@/lib/i18n/format";
import { listPublishedNews } from "@/lib/repositories/news";
import { AdSlot } from "@/components/ads/AdSlot";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { buildCanonical, buildLanguageAlternates } from "@/lib/seo/alternates";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "news" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: buildCanonical(locale, "/news"),
      languages: buildLanguageAlternates("/news"),
    },
  };
}

export default async function NewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tNav, posts] = await Promise.all([
    getTranslations({ locale, namespace: "news" }),
    getTranslations({ locale, namespace: "nav" }),
    listPublishedNews(),
  ]);

  const loc = locale as Locale;
  const dateFormatter = new Intl.DateTimeFormat(toIntlLocale(loc), {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 xl:px-8">
      <Breadcrumbs
        locale={locale}
        items={[
          { name: tNav("home"), href: "/" },
          { name: tNav("news"), href: "/news" },
        ]}
      />

      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("heading")}
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          {t("description")}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <ul className="flex flex-col gap-5">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/news/${post.slug}`}
                className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/30 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row"
              >
                {post.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.coverUrl}
                    alt=""
                    className="h-36 w-full shrink-0 object-cover sm:h-auto sm:w-48"
                  />
                ) : (
                  <div
                    className={cn(
                      "h-36 w-full shrink-0 bg-linear-to-br sm:h-auto sm:w-48",
                      post.coverGradient
                    )}
                  />
                )}
                <div className="flex flex-1 flex-col gap-2 p-5">
                  {post.publishedAt ? (
                    <time
                      dateTime={post.publishedAt}
                      className="text-sm text-muted-foreground"
                    >
                      {dateFormatter.format(new Date(post.publishedAt))}
                    </time>
                  ) : null}
                  <h2 className="text-xl font-semibold text-foreground group-hover:text-link">
                    {post.title[loc]}
                  </h2>
                  <p className="text-base text-muted-foreground">
                    {post.excerpt[loc]}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                    <span className="text-xs text-muted-foreground">
                      {t("views", { count: post.viewCount })}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-20 lg:h-fit">
          <AdSlot placement="sidebar-rectangle" />
        </aside>
      </div>
    </div>
  );
}
