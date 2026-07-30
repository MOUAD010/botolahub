import { ImageResponse } from "next/og";
import { teamRepository } from "@/lib/repositories";

export const alt = "KooraLive team";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const team = await teamRepository.getBySlug(slug);

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
            marginBottom: 56,
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

        {team ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 24,
            }}
          >
            <div
              style={{
                width: 160,
                height: 160,
                borderRadius: 999,
                background: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 56,
                fontWeight: 800,
              }}
            >
              {team.shortName}
            </div>
            <div style={{ fontSize: 56, fontWeight: 800, display: "flex" }}>
              {team.name}
            </div>
            {team.city && (
              <div
                style={{
                  fontSize: 28,
                  color: "#a1a1aa",
                  display: "flex",
                }}
              >
                {team.city}
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: 48, display: "flex" }}>Team</div>
        )}
      </div>
    ),
    { ...size }
  );
}
