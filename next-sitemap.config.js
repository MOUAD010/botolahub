/** @type {import('next-sitemap').IConfig} */
const siteUrl = process.env.SITE_URL || "https://kooralive.example.com";
const locales = ["fr", "ar", "en"];
const defaultLocale = "fr";

module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  exclude: ["/*/styleguide"],
  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/" },
      { userAgent: "*", disallow: ["/*/styleguide"] },
    ],
  },
  transform: async (config, path) => {
    const match = path.match(/^\/(fr|ar|en)(\/.*)?$/);

    const base = {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    };

    if (!match) return base;

    const [, locale, rest = ""] = match;
    // hrefIsAbsolute is required here: without it next-sitemap treats `href`
    // as relative and re-combines it with this entry's own (already
    // absolute) `loc`, producing a nonsense concatenated URL.
    const alternateRefs = [
      ...locales.map((loc) => ({
        href: `${siteUrl}/${loc}${rest}`,
        hreflang: loc,
        hrefIsAbsolute: true,
      })),
      {
        href: `${siteUrl}/${defaultLocale}${rest}`,
        hreflang: "x-default",
        hrefIsAbsolute: true,
      },
    ];

    return {
      ...base,
      priority: rest === "" ? 1.0 : config.priority,
      alternateRefs,
    };
  },
};
