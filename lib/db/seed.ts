import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./index";
import {
  admins,
  newsArticles,
  newsMatchTags,
  newsPlayerTags,
  newsTags,
  newsTranslations,
} from "./schema";

const seedNews = [
  {
    slug: "derby-casablanca-preview",
    status: "published" as const,
    publishedAt: new Date("2026-07-18T10:00:00.000Z"),
    coverGradient: "from-emerald-700 to-slate-900",
    tags: ["Botola Pro", "Derby"],
    playerIds: [] as string[],
    matchIds: [] as string[],
    metaTitle: {
      fr: "Derby de Casablanca : ce qu'il faut savoir",
      ar: "ديربي الدار البيضاء: ما يجب معرفته",
      en: "Casablanca Derby: what you need to know",
    },
    metaDescription: {
      fr: "Wydad et Raja se retrouvent pour un nouveau chapitre du derby.",
      ar: "الوداد والرجاء يلتقيان في فصل جديد من أشهر ديربي.",
      en: "Wydad and Raja meet again in Morocco’s fiercest derby.",
    },
    translations: {
      fr: {
        title: "Derby de Casablanca : ce qu'il faut savoir",
        excerpt:
          "Wydad et Raja se retrouvent pour un nouveau chapitre du derby le plus suivi du Royaume.",
        body: "Le derby casablancais reste le rendez-vous le plus attendu de la Botola Pro. Forme récente, absences et enjeu classement — voici les clés du match.",
      },
      ar: {
        title: "ديربي الدار البيضاء: ما يجب معرفته",
        excerpt:
          "الوداد والرجاء يلتقيان في فصل جديد من أشهر ديربي في المملكة.",
        body: "يبقى ديربي الدار البيضاء الموعد الأكثر انتظاراً في البطولة الاحترافية. الشكل الأخير والغيابات والترتيب — هذه مفاتيح المباراة.",
      },
      en: {
        title: "Casablanca Derby: what you need to know",
        excerpt:
          "Wydad and Raja meet again in another chapter of Morocco’s fiercest derby.",
        body: "The Casablanca derby remains Botola Pro’s biggest fixture. Recent form, absences, and the table — here are the keys to the match.",
      },
    },
  },
  {
    slug: "botola-matchday-12-roundup",
    status: "published" as const,
    publishedAt: new Date("2026-07-15T18:30:00.000Z"),
    coverGradient: "from-red-800 to-zinc-900",
    tags: ["Results", "TOTW"],
    playerIds: [] as string[],
    matchIds: [] as string[],
    metaTitle: {
      fr: "Journée 12 : le récap complet",
      ar: "الجولة 12: الملخص الكامل",
      en: "Matchday 12: full roundup",
    },
    metaDescription: {
      fr: "Tous les résultats, les buteurs et les notes de la 12e journée.",
      ar: "كل النتائج والهدافين والتقييمات للجولة 12.",
      en: "Every result, scorer, and rating from matchday 12.",
    },
    translations: {
      fr: {
        title: "Journée 12 : le récap complet",
        excerpt: "Tous les résultats, les buteurs et les notes de la 12e journée.",
        body: "Une journée dense a redistribué les cartes en tête du classement. Retour sur les moments forts et le onze de la semaine.",
      },
      ar: {
        title: "الجولة 12: الملخص الكامل",
        excerpt: "كل النتائج والهدافين والتقييمات للجولة 12.",
        body: "جولة مكثفة أعادت خلط الأوراق في صدارة الترتيب. نظرة على أبرز اللحظات وتشكيلة الأسبوع.",
      },
      en: {
        title: "Matchday 12: full roundup",
        excerpt: "Every result, scorer, and rating from matchday 12.",
        body: "A busy weekend reshuffled the title race. Relive the highlights and this week’s best XI.",
      },
    },
  },
  {
    slug: "rising-stars-botola",
    status: "published" as const,
    publishedAt: new Date("2026-07-10T09:00:00.000Z"),
    coverGradient: "from-sky-800 to-indigo-950",
    tags: ["Players", "Youth"],
    playerIds: [] as string[],
    matchIds: [] as string[],
    metaTitle: {
      fr: "Talents à suivre cette saison",
      ar: "مواهب يجب متابعتها هذا الموسم",
      en: "Rising stars to watch this season",
    },
    metaDescription: {
      fr: "Cinq jeunes joueurs qui s’imposent déjà en Botola Pro.",
      ar: "خمسة لاعبين شباب يفرضون أنفسهم في البطولة الاحترافية.",
      en: "Five young players already making noise in Botola Pro.",
    },
    translations: {
      fr: {
        title: "Talents à suivre cette saison",
        excerpt: "Cinq jeunes joueurs qui s’imposent déjà en Botola Pro.",
        body: "De Rabat à Agadir, une nouvelle génération s’affirme. Profils, stats et perspectives.",
      },
      ar: {
        title: "مواهب يجب متابعتها هذا الموسم",
        excerpt: "خمسة لاعبين شباب يفرضون أنفسهم في البطولة الاحترافية.",
        body: "من الرباط إلى أكادير، جيل جديد يفرض نفسه. الملفات والإحصائيات والآفاق.",
      },
      en: {
        title: "Rising stars to watch this season",
        excerpt: "Five young players already making noise in Botola Pro.",
        body: "From Rabat to Agadir, a new generation is stepping up. Profiles, stats, and outlook.",
      },
    },
  },
];

async function seed() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required to seed.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await db
    .select()
    .from(admins)
    .where(eq(admins.email, email.toLowerCase()))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(admins).values({
      email: email.toLowerCase(),
      passwordHash,
    });
    console.log(`Seeded admin: ${email}`);
  } else {
    await db
      .update(admins)
      .set({ passwordHash })
      .where(eq(admins.email, email.toLowerCase()));
    console.log(`Updated admin password: ${email}`);
  }

  for (const article of seedNews) {
    const existingArticle = await db
      .select()
      .from(newsArticles)
      .where(eq(newsArticles.slug, article.slug))
      .limit(1);

    if (existingArticle.length > 0) {
      console.log(`Skip existing news: ${article.slug}`);
      continue;
    }

    const [row] = await db
      .insert(newsArticles)
      .values({
        slug: article.slug,
        status: article.status,
        publishedAt: article.publishedAt,
        coverGradient: article.coverGradient,
        metaTitle: article.metaTitle,
        metaDescription: article.metaDescription,
      })
      .returning();

    await db.insert(newsTranslations).values(
      (["fr", "ar", "en"] as const).map((locale) => ({
        articleId: row.id,
        locale,
        title: article.translations[locale].title,
        excerpt: article.translations[locale].excerpt,
        body: article.translations[locale].body,
      }))
    );

    if (article.tags.length) {
      await db.insert(newsTags).values(
        article.tags.map((tag) => ({ articleId: row.id, tag }))
      );
    }
    if (article.playerIds.length) {
      await db.insert(newsPlayerTags).values(
        article.playerIds.map((playerId) => ({
          articleId: row.id,
          playerId,
        }))
      );
    }
    if (article.matchIds.length) {
      await db.insert(newsMatchTags).values(
        article.matchIds.map((matchId) => ({
          articleId: row.id,
          matchId,
        }))
      );
    }

    console.log(`Seeded news: ${article.slug}`);
  }

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
