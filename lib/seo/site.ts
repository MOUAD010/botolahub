export const SITE_URL =
  process.env.SITE_URL || "https://kooralive.example.com";

export const SITE_NAME = "KooraLive";

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}
