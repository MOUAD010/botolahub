import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/:locale/blogs",
        destination: "/:locale/news",
        permanent: true,
      },
      {
        source: "/:locale/blogs/:slug",
        destination: "/:locale/news/:slug",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
