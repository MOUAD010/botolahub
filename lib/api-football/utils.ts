import type { MatchStatus, PlayerPosition } from "@/lib/types";

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function entitySlug(name: string, apiId: number | string): string {
  const base = slugify(name) || "item";
  return `${base}-${apiId}`;
}

const LIVE = new Set([
  "1H",
  "HT",
  "2H",
  "ET",
  "BT",
  "P",
  "SUSP",
  "INT",
  "LIVE",
]);
const FINISHED = new Set(["FT", "AET", "PEN", "AWD", "WO"]);
const UPCOMING = new Set(["TBD", "NS", "PST"]);

export function mapFixtureStatus(short: string): MatchStatus {
  if (LIVE.has(short)) return "live";
  if (FINISHED.has(short)) return "finished";
  if (UPCOMING.has(short)) return "upcoming";
  // CANC / ABD → treat as finished for display
  return "finished";
}

export function parseMatchday(round: string | null | undefined): number {
  if (!round) return 0;
  const m = round.match(/(\d+)\s*$/);
  return m ? Number(m[1]) : 0;
}

export function mapPlayerPosition(raw: string | null | undefined): PlayerPosition {
  const p = (raw || "").toLowerCase();
  if (p.includes("goal")) return "GK";
  if (p.includes("def")) return "DF";
  if (p.includes("mid")) return "MF";
  if (p.includes("att") || p.includes("forw")) return "FW";
  return "MF";
}

export function parseForm(form: string | null | undefined): Array<"W" | "D" | "L"> {
  if (!form) return [];
  return form
    .split("")
    .filter((c): c is "W" | "D" | "L" => c === "W" || c === "D" || c === "L")
    .slice(-5);
}

export function standingZone(
  rank: number,
  description: string | null | undefined
): "continental" | "relegation" | null {
  const d = (description || "").toLowerCase();
  if (d.includes("relegation")) return "relegation";
  if (
    d.includes("champions") ||
    d.includes("caf") ||
    d.includes("promotion") ||
    d.includes("qualification")
  ) {
    return "continental";
  }
  if (rank <= 3) return "continental";
  return null;
}
