export const API_FOOTBALL_BASE = "https://v3.football.api-sports.io";
export const API_FOOTBALL_MEDIA = "https://media.api-sports.io";

/** Botola Pro (1ère division) */
export const BOTOLA_PRO_API_ID = 200;
/** Botola 2 (2ème division) */
export const BOTOLA_2_API_ID = 201;

/** Current API season key available on Free plan (2024/25 → 2024) */
export const CURRENT_SEASON = 2024;

export const TRACKED_LEAGUE_IDS = [BOTOLA_PRO_API_ID, BOTOLA_2_API_ID] as const;

export const COMPETITION_SLUGS = {
  [BOTOLA_PRO_API_ID]: "botola-pro",
  [BOTOLA_2_API_ID]: "botola-2",
} as const;

export function competitionIdFromApi(apiId: number): string {
  return (
    COMPETITION_SLUGS[apiId as keyof typeof COMPETITION_SLUGS] ??
    `league-${apiId}`
  );
}

/** Stable competition ids used by repositories / pages */
export const BOTOLA_PRO = {
  id: "botola-pro",
  slug: "botola-pro",
  name: "Botola Pro",
  shortName: "Botola Pro",
  country: "Morocco",
} as const;

export const BOTOLA_2 = {
  id: "botola-2",
  slug: "botola-2",
  name: "Botola 2",
  shortName: "Botola 2",
  country: "Morocco",
} as const;
