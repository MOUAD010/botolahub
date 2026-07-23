export interface BlogPost {
  id: string;
  slug: string;
  title: { fr: string; ar: string; en: string };
  excerpt: { fr: string; ar: string; en: string };
  body: { fr: string; ar: string; en: string };
  publishedAt: string;
  coverGradient: string;
  tags: string[];
}

export const blogPosts: BlogPost[] = [
  {
    id: "b1",
    slug: "derby-casablanca-preview",
    title: {
      fr: "Derby de Casablanca : ce qu'il faut savoir",
      ar: "ديربي الدار البيضاء: ما يجب معرفته",
      en: "Casablanca Derby: what you need to know",
    },
    excerpt: {
      fr: "Wydad et Raja se retrouvent pour un nouveau chapitre du derby le plus suivi du Royaume.",
      ar: "الوداد والرجاء يلتقيان في فصل جديد من أشهر ديربي في المملكة.",
      en: "Wydad and Raja meet again in another chapter of Morocco’s fiercest derby.",
    },
    body: {
      fr: "Le derby casablancais reste le rendez-vous le plus attendu de la Botola Pro. Forme récente, absences et enjeu classement — voici les clés du match.",
      ar: "يبقى ديربي الدار البيضاء الموعد الأكثر انتظاراً في البطولة الاحترافية. الشكل الأخير والغيابات والترتيب — هذه مفاتيح المباراة.",
      en: "The Casablanca derby remains Botola Pro’s biggest fixture. Recent form, absences, and the table — here are the keys to the match.",
    },
    publishedAt: "2026-07-18T10:00:00.000Z",
    coverGradient: "from-emerald-700 to-slate-900",
    tags: ["Botola Pro", "Derby"],
  },
  {
    id: "b2",
    slug: "botola-matchday-12-roundup",
    title: {
      fr: "Journée 12 : le récap complet",
      ar: "الجولة 12: الملخص الكامل",
      en: "Matchday 12: full roundup",
    },
    excerpt: {
      fr: "Tous les résultats, les buteurs et les notes de la 12e journée.",
      ar: "كل النتائج والهدافين والتقييمات للجولة 12.",
      en: "Every result, scorer, and rating from matchday 12.",
    },
    body: {
      fr: "Une journée dense a redistribué les cartes en tête du classement. Retour sur les moments forts et le onze de la semaine.",
      ar: "جولة مكثفة أعادت خلط الأوراق في صدارة الترتيب. نظرة على أبرز اللحظات وتشكيلة الأسبوع.",
      en: "A busy weekend reshuffled the title race. Relive the highlights and this week’s best XI.",
    },
    publishedAt: "2026-07-15T18:30:00.000Z",
    coverGradient: "from-red-800 to-zinc-900",
    tags: ["Results", "TOTW"],
  },
  {
    id: "b3",
    slug: "rising-stars-botola",
    title: {
      fr: "Talents à suivre cette saison",
      ar: "مواهب يجب متابعتها هذا الموسم",
      en: "Rising stars to watch this season",
    },
    excerpt: {
      fr: "Cinq jeunes joueurs qui s’imposent déjà en Botola Pro.",
      ar: "خمسة لاعبين شباب يفرضون أنفسهم في البطولة الاحترافية.",
      en: "Five young players already making noise in Botola Pro.",
    },
    body: {
      fr: "De Rabat à Agadir, une nouvelle génération s’affirme. Profils, stats et perspectives.",
      ar: "من الرباط إلى أكادير، جيل جديد يفرض نفسه. الملفات والإحصائيات والآفاق.",
      en: "From Rabat to Agadir, a new generation is stepping up. Profiles, stats, and outlook.",
    },
    publishedAt: "2026-07-10T09:00:00.000Z",
    coverGradient: "from-sky-800 to-indigo-950",
    tags: ["Players", "Youth"],
  },
];

export function getBlogBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
