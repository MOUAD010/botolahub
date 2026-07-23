import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/lib/i18n/routing";
import { toIntlLocale } from "@/lib/i18n/format";
import { blogPosts, getBlogBySlug } from "@/data/blogs.mock";
import { AdSlot } from "@/components/ads/AdSlot";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { buildCanonical, buildLanguageAlternates } from "@/lib/seo/alternates";
import { cn } from "@/lib/utils";

export const revalidate = 300;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    blogPosts.map((post) => ({ locale, slug: post.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getBlogBySlug(slug);
  if (!post) return {};

  const loc = locale as Locale;
  return {
    title: post.title[loc],
    description: post.excerpt[loc],
    alternates: {
      canonical: buildCanonical(locale, `/blogs/${slug}`),
      languages: buildLanguageAlternates(`/blogs/${slug}`),
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = getBlogBySlug(slug);
  if (!post) notFound();

  const [tNav, t] = await Promise.all([
    getTranslations({ locale, namespace: "nav" }),
    getTranslations({ locale, namespace: "blogs" }),
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
          { name: tNav("blogs"), href: "/blogs" },
          { name: post.title[loc], href: `/blogs/${slug}` },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <article className="min-w-0">
          <div
            className={cn(
              "mb-6 h-48 w-full rounded-xl bg-linear-to-br sm:h-64",
              post.coverGradient
            )}
          />
          <time
            dateTime={post.publishedAt}
            className="text-sm text-muted-foreground"
          >
            {dateFormatter.format(new Date(post.publishedAt))}
          </time>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {post.title[loc]}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {post.excerpt[loc]}
          </p>
          <div className="prose prose-neutral dark:prose-invert mt-8 max-w-none">
            <p className="text-base leading-relaxed text-foreground">
              {post.body[loc]}
            </p>
          </div>
          <p className="mt-8 text-sm text-muted-foreground">{t("disclaimer")}</p>
        </article>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-20 lg:h-fit">
          <AdSlot placement="sidebar-rectangle" />
        </aside>
      </div>
    </div>
  );
}
