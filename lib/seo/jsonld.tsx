import type { Match, Team } from "@/lib/types";
import { absoluteUrl, SITE_NAME } from "./site";

export function buildSportsEventJsonLd(match: Match, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
    startDate: match.kickoff,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    ...(match.venue && {
      location: {
        "@type": "Place",
        name: match.venue,
      },
    }),
    homeTeam: {
      "@type": "SportsTeam",
      name: match.homeTeam.name,
    },
    awayTeam: {
      "@type": "SportsTeam",
      name: match.awayTeam.name,
    },
    url: absoluteUrl(path),
  };
}

export function buildSportsTeamJsonLd(team: Team, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: team.name,
    sport: "Football",
    ...(team.city && {
      location: {
        "@type": "Place",
        name: team.city,
      },
    }),
    logo: absoluteUrl(team.badgeUrl),
    url: absoluteUrl(path),
  };
}

export function buildNewsArticleJsonLd(
  post: {
    title: string;
    excerpt: string;
    coverUrl: string | null;
    publishedAt: string | null;
  },
  path: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.excerpt,
    ...(post.coverUrl && { image: [absoluteUrl(post.coverUrl)] }),
    ...(post.publishedAt && {
      datePublished: post.publishedAt,
      dateModified: post.publishedAt,
    }),
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: absoluteUrl(path),
  };
}

export function buildPersonJsonLd(
  player: { name: string; nationality?: string; photoUrl?: string },
  path: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: player.name,
    ...(player.nationality && { nationality: player.nationality }),
    ...(player.photoUrl && { image: absoluteUrl(player.photoUrl) }),
    jobTitle: "Football Player",
    url: absoluteUrl(path),
  };
}

export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; path: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
