import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { API_FOOTBALL_MEDIA } from "./lib/api-football/constants";

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
  // Synced media is downloaded into public/media at sync time, which only
  // exists on machines that ran a sync (the directory is gitignored, so it is
  // absent from the container image). `fallback` rewrites run only after
  // static files fail to match, so local copies are still served directly and
  // anything missing is proxied from the upstream CDN instead of 404ing.
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        {
          source: "/media/:kind(leagues|teams|players|venues)/:file",
          destination: `${API_FOOTBALL_MEDIA}/football/:kind/:file`,
        },
      ],
    };
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
