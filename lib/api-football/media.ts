import { mkdir, writeFile, access } from "fs/promises";
import path from "path";
import { API_FOOTBALL_MEDIA } from "./constants";

export type MediaKind = "leagues" | "teams" | "players" | "venues";

function mediaDir(kind: MediaKind): string {
  return path.join(process.cwd(), "public", "media", kind);
}

export function mediaPublicPath(kind: MediaKind, id: number | string): string {
  return `/media/${kind}/${id}.png`;
}

export function mediaAbsoluteUrl(
  kind: MediaKind,
  id: number | string
): string {
  const folder =
    kind === "leagues"
      ? "football/leagues"
      : kind === "teams"
        ? "football/teams"
        : kind === "players"
          ? "football/players"
          : "football/venues";
  return `${API_FOOTBALL_MEDIA}/${folder}/${id}.png`;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Download a media asset once. Media CDN calls do not count toward the
 * daily API quota. Returns the public site path.
 */
export async function ensureMedia(
  kind: MediaKind,
  id: number | string,
  sourceUrl?: string | null
): Promise<string> {
  const dir = mediaDir(kind);
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${id}.png`);
  const publicPath = mediaPublicPath(kind, id);

  if (await exists(filePath)) {
    return publicPath;
  }

  const url = sourceUrl?.trim() || mediaAbsoluteUrl(kind, id);
  const res = await fetch(url, { method: "GET", cache: "no-store" });
  if (!res.ok) {
    // Keep a stable path even if download fails — UI can fall back
    return publicPath;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > 0) {
    await writeFile(filePath, buf);
  }
  return publicPath;
}
