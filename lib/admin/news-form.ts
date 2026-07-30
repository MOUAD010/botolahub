export type NewsFormLocale = "fr" | "ar" | "en";

export type LocalizedString = {
  fr?: string | null;
  ar?: string | null;
  en?: string | null;
};

export type NewsFormValues = {
  id?: string;
  slug: string;
  status: "draft" | "published";
  publishedAt?: string | null;
  coverGradient: string;
  coverUrl?: string | null;
  metaTitle?: LocalizedString | null;
  metaDescription?: LocalizedString | null;
  ogImage?: LocalizedString | null;
  translations: Record<
    NewsFormLocale,
    { title: string; excerpt: string; body: string }
  >;
  tags: string[];
  playerIds: string[];
  matchIds: string[];
};

const emptyLocale = { title: "", excerpt: "", body: "" };

export function emptyNewsForm(): NewsFormValues {
  return {
    slug: "",
    status: "draft",
    coverGradient: "from-emerald-700 to-slate-900",
    coverUrl: "",
    metaTitle: { fr: "", ar: "", en: "" },
    metaDescription: { fr: "", ar: "", en: "" },
    ogImage: { fr: "", ar: "", en: "" },
    translations: {
      fr: { ...emptyLocale },
      ar: { ...emptyLocale },
      en: { ...emptyLocale },
    },
    tags: [],
    playerIds: [],
    matchIds: [],
  };
}
