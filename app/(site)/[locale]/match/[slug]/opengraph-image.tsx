import { ImageResponse } from "next/og";
import { matchRepository } from "@/lib/repositories";
import { formatKickoffTime } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/routing";

export const alt = "KooraLive match";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const match = await matchRepository.getBySlug(slug);

  const resultLabel = match
    ? match.status === "upcoming"
      ? formatKickoffTime(match.kickoff, locale as Locale)
      : `${match.homeScore} – ${match.awayScore}`
    : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 48,
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: "#16a34a",
              display: "flex",
            }}
          />
          <div style={{ fontSize: 32, fontWeight: 700, display: "flex" }}>
            KooraLive
          </div>
        </div>

        {match ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 56,
            }}
          >
            <TeamBadge label={match.homeTeam.shortName} color="#dc2626" />
            <div
              style={{
                fontSize: 72,
                fontWeight: 800,
                display: "flex",
              }}
            >
              {resultLabel}
            </div>
            <TeamBadge label={match.awayTeam.shortName} color="#3f3f46" />
          </div>
        ) : (
          <div style={{ fontSize: 48, display: "flex" }}>Match</div>
        )}
      </div>
    ),
    { ...size }
  );
}

function TeamBadge({ label, color }: { label: string; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 999,
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 40,
          fontWeight: 800,
        }}
      >
        {label}
      </div>
    </div>
  );
}
