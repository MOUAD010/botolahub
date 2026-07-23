import { computePitchTokens } from "@/lib/formation";
import type { Lineup, PlayerSeasonStats } from "@/lib/types";
import { PlayerToken } from "./PlayerToken";

export function FormationPitch({
  homeLineup,
  awayLineup,
  statsById,
}: {
  homeLineup: Lineup;
  awayLineup: Lineup;
  statsById: Record<string, PlayerSeasonStats | null>;
}) {
  const homeTokens = computePitchTokens(homeLineup, "home");
  const awayTokens = computePitchTokens(awayLineup, "away");

  return (
    <div
      className="relative aspect-3/4 w-full overflow-hidden rounded-lg bg-[#2d8a4e] lg:aspect-16/9"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0, rgba(255,255,255,0.05) 10%, transparent 10%, transparent 20%)",
      }}
    >
      <PitchMarkings />

      {homeTokens.map((token) => (
        <PlayerToken
          key={token.player.id}
          token={token}
          team="home"
          seasonStats={statsById[token.player.id] ?? null}
        />
      ))}
      {awayTokens.map((token) => (
        <PlayerToken
          key={token.player.id}
          token={token}
          team="away"
          seasonStats={statsById[token.player.id] ?? null}
        />
      ))}
    </div>
  );
}

function PitchMarkings() {
  const line = {
    stroke: "white",
    strokeOpacity: 0.55,
    strokeWidth: 0.4,
    fill: "none",
  } as const;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
    >
      <rect x={2} y={2} width={96} height={96} {...line} />
      <circle cx={50} cy={50} r={0.6} fill="white" fillOpacity={0.55} />

      <g className="lg:hidden">
        <line x1={2} y1={50} x2={98} y2={50} {...line} />
        <circle cx={50} cy={50} r={9} {...line} />
        <rect x={25} y={2} width={50} height={16} {...line} />
        <rect x={38} y={2} width={24} height={6} {...line} />
        <rect x={25} y={82} width={50} height={16} {...line} />
        <rect x={38} y={92} width={24} height={6} {...line} />
      </g>

      <g className="hidden lg:block">
        <line x1={50} y1={2} x2={50} y2={98} {...line} />
        <circle cx={50} cy={50} r={9} {...line} />
        <rect x={2} y={25} width={16} height={50} {...line} />
        <rect x={2} y={38} width={6} height={24} {...line} />
        <rect x={82} y={25} width={16} height={50} {...line} />
        <rect x={92} y={38} width={6} height={24} {...line} />
      </g>
    </svg>
  );
}
