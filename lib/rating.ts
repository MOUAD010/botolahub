import { cn } from "@/lib/utils";

/**
 * Football-style rating colors:
 * - Green ≥ 7.5  strong performance
 * - Lime  ≥ 7.0  good
 * - Yellow ≥ 6.0 average
 * - Red   < 6.0  poor
 */
export function ratingTone(rating: number): string {
  if (rating >= 7.5) return "bg-emerald-500 text-white";
  if (rating >= 7.0) return "bg-lime-500 text-black";
  if (rating >= 6.0) return "bg-amber-500 text-black";
  return "bg-red-500 text-white";
}

export function ratingToneSoft(rating: number): string {
  if (rating >= 7.5) return "bg-emerald-500/20 text-emerald-400";
  if (rating >= 7.0) return "bg-lime-500/20 text-lime-400";
  if (rating >= 6.0) return "bg-amber-500/20 text-amber-400";
  return "bg-red-500/20 text-red-400";
}

/** When API has no match ratings, derive a season form score from output. */
export function displaySeasonRating(stats: {
  averageRating?: number | string | null;
  goals?: number;
  assists?: number;
}): number {
  const api = Number(stats.averageRating ?? 0);
  if (api > 0) return Math.round(api * 10) / 10;
  const goals = stats.goals ?? 0;
  const assists = stats.assists ?? 0;
  return Math.min(
    9.9,
    Math.round((6.2 + goals * 0.18 + assists * 0.12) * 10) / 10
  );
}

export function ratingClass(rating: number, soft = false): string {
  return cn(soft ? ratingToneSoft(rating) : ratingTone(rating));
}
