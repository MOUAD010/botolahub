import type { Lineup, Player } from "@/lib/types";

export interface PitchToken {
  player: Player;
  portrait: { x: number; y: number };
  landscape: { x: number; y: number };
}

const GOAL_LINE_MARGIN = 6;
const CENTER_MARGIN = 46;
const LINE_SPAN = CENTER_MARGIN - GOAL_LINE_MARGIN;
const SPREAD_MARGIN = 10;

function parseFormationLines(formation: string): number[] {
  return [1, ...formation.split("-").map((n) => parseInt(n, 10))];
}

function chunkByLines(players: Player[], lines: number[]): Player[][] {
  const chunks: Player[][] = [];
  let cursor = 0;
  for (const count of lines) {
    chunks.push(players.slice(cursor, cursor + count));
    cursor += count;
  }
  return chunks;
}

/**
 * Lays out a starting XI on a shared pitch with the opposing team, each
 * half attacking toward the center line. `team` decides which goal line a
 * side defends: "home" defends the bottom edge in portrait / left edge in
 * landscape, "away" the opposite — so the two orientations aren't simple
 * axis swaps of each other, each is computed independently.
 */
export function computePitchTokens(
  lineup: Lineup,
  team: "home" | "away"
): PitchToken[] {
  const lines = parseFormationLines(lineup.formation);
  const chunks = chunkByLines(lineup.startingXI, lines);
  const lastLineIndex = Math.max(chunks.length - 1, 1);

  const tokens: PitchToken[] = [];

  chunks.forEach((linePlayers, lineIndex) => {
    const progress = lineIndex / lastLineIndex;
    const lineOffset = GOAL_LINE_MARGIN + progress * LINE_SPAN;

    linePlayers.forEach((player, spreadIndex) => {
      const spreadProgress = (spreadIndex + 1) / (linePlayers.length + 1);
      const spreadPct =
        SPREAD_MARGIN + spreadProgress * (100 - 2 * SPREAD_MARGIN);

      tokens.push({
        player,
        portrait: {
          x: spreadPct,
          y: team === "home" ? 100 - lineOffset : lineOffset,
        },
        landscape: {
          x: team === "home" ? lineOffset : 100 - lineOffset,
          y: spreadPct,
        },
      });
    });
  });

  return tokens;
}

/**
 * Full-pitch layout for Team of the Week / single XI (GK at bottom,
 * attack at top in portrait).
 */
export function computeTotwTokens(lineup: Lineup): PitchToken[] {
  const lines = parseFormationLines(lineup.formation);
  const chunks = chunkByLines(lineup.startingXI, lines);
  const lastLineIndex = Math.max(chunks.length - 1, 1);
  const topMargin = 10;
  const bottomMargin = 10;
  const span = 100 - topMargin - bottomMargin;

  const tokens: PitchToken[] = [];

  chunks.forEach((linePlayers, lineIndex) => {
    const progress = lineIndex / lastLineIndex;
    const y = 100 - bottomMargin - progress * span;

    linePlayers.forEach((player, spreadIndex) => {
      const spreadProgress = (spreadIndex + 1) / (linePlayers.length + 1);
      const x = SPREAD_MARGIN + spreadProgress * (100 - 2 * SPREAD_MARGIN);

      tokens.push({
        player,
        portrait: { x, y },
        landscape: { x, y },
      });
    });
  });

  return tokens;
}
