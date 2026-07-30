import { notFound } from "next/navigation";
import { NewsEditor } from "@/components/admin/NewsEditor";
import { emptyNewsForm, type NewsFormValues } from "@/lib/admin/news-form";
import { getNewsById } from "@/lib/repositories/news";

export default async function EditNewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getNewsById(id);
  if (!article) notFound();

  const initial: NewsFormValues = {
    ...emptyNewsForm(),
    id: article.id,
    slug: article.slug,
    status: article.status,
    publishedAt: article.publishedAt,
    coverGradient: article.coverGradient,
    coverUrl: article.coverUrl,
    metaTitle: article.metaTitle,
    metaDescription: article.metaDescription,
    ogImage: article.ogImage,
    translations: {
      fr: {
        title: article.title.fr,
        excerpt: article.excerpt.fr,
        body: article.body.fr,
      },
      ar: {
        title: article.title.ar,
        excerpt: article.excerpt.ar,
        body: article.body.ar,
      },
      en: {
        title: article.title.en,
        excerpt: article.excerpt.en,
        body: article.body.en,
      },
    },
    tags: article.tags,
    playerIds: article.playerIds,
    matchIds: article.matchIds,
  };

  return <NewsEditor initial={initial} />;
}
