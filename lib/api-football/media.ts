import { mkdir, writeFile, access, readdir, stat, rm } from "fs/promises";
import path from "path";
import { API_FOOTBALL_MEDIA } from "./constants";
import {
  MEDIA_KINDS,
  type MediaKind,
  type LocalMediaItem,
  type MediaKindTotals,
  type MediaInventory,
  type MediaRepullResult,
} from "./media-types";

export type {
  MediaKind,
  LocalMediaItem,
  MediaKindTotals,
  MediaInventory,
  MediaRepullResult,
} from "./media-types";
export { MEDIA_KINDS } from "./media-types";

function mediaDir(kind: MediaKind): string {
  return path.join(process.cwd(), "public", "media", kind);
}

function mediaRoot(): string {
  return path.join(process.cwd(), "public", "media");
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

function emptyTotals(): MediaKindTotals {
  return {
    leagues: { count: 0, bytes: 0 },
    teams: { count: 0, bytes: 0 },
    players: { count: 0, bytes: 0 },
    venues: { count: 0, bytes: 0 },
  };
}

/**
 * Download a media asset once. Media CDN calls do not count toward the
 * daily API quota. Returns the public site path.
 */
export async function ensureMedia(
  kind: MediaKind,
  id: number | string,
  sourceUrl?: string | null,
  options?: { force?: boolean }
): Promise<string> {
  const dir = mediaDir(kind);
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${id}.png`);
  const publicPath = mediaPublicPath(kind, id);

  if (!options?.force && (await exists(filePath))) {
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

/** Scan public/media for every downloaded PNG. */
export async function listLocalMedia(): Promise<MediaInventory> {
  const items: LocalMediaItem[] = [];
  const totals = emptyTotals();

  for (const kind of MEDIA_KINDS) {
    const dir = mediaDir(kind);
    let names: string[] = [];
    try {
      names = await readdir(dir);
    } catch {
      continue;
    }

    for (const name of names) {
      if (!name.endsWith(".png")) continue;
      const filePath = path.join(dir, name);
      try {
        const s = await stat(filePath);
        if (!s.isFile()) continue;
        const id = name.replace(/\.png$/i, "");
        items.push({
          kind,
          id,
          publicPath: mediaPublicPath(kind, id),
          size: s.size,
          mtime: s.mtime.toISOString(),
        });
        totals[kind].count += 1;
        totals[kind].bytes += s.size;
      } catch {
        // skip unreadable entries
      }
    }
  }

  items.sort((a, b) => {
    if (a.kind !== b.kind) {
      return MEDIA_KINDS.indexOf(a.kind) - MEDIA_KINDS.indexOf(b.kind);
    }
    return a.id.localeCompare(b.id, undefined, { numeric: true });
  });

  return {
    items,
    totals,
    totalCount: items.length,
    totalBytes: MEDIA_KINDS.reduce((sum, k) => sum + totals[k].bytes, 0),
  };
}

/** Delete every file under public/media. Returns how many files were removed. */
export async function clearLocalMedia(): Promise<number> {
  const before = await listLocalMedia();
  const root = mediaRoot();
  try {
    await rm(root, { recursive: true, force: true });
  } catch {
    // nothing to clear
  }
  for (const kind of MEDIA_KINDS) {
    await mkdir(mediaDir(kind), { recursive: true });
  }
  return before.totalCount;
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]!);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, Math.max(1, items.length)) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}

/**
 * Collect every media id referenced by the database, then delete local
 * copies and re-download them from the API-Football CDN.
 * CDN fetches do not consume the daily API quota.
 */
export async function repullAllMedia(): Promise<MediaRepullResult> {
  const { db } = await import("@/lib/db");
  const { competitions, teams, players } = await import("@/lib/db/schema");

  const [leagueRows, teamRows, playerRows] = await Promise.all([
    db
      .select({ apiId: competitions.apiId })
      .from(competitions),
    db
      .select({ apiId: teams.apiId, venueApiId: teams.venueApiId })
      .from(teams),
    db.select({ apiId: players.apiId }).from(players),
  ]);

  const targets = new Map<string, { kind: MediaKind; id: number }>();
  const add = (kind: MediaKind, id: number | null | undefined) => {
    if (id == null || id <= 0) return;
    targets.set(`${kind}:${id}`, { kind, id });
  };

  for (const row of leagueRows) add("leagues", row.apiId);
  for (const row of teamRows) {
    add("teams", row.apiId);
    add("venues", row.venueApiId);
  }
  for (const row of playerRows) add("players", row.apiId);

  const deleted = await clearLocalMedia();
  const list = [...targets.values()];

  const outcomes = await mapPool(list, 12, async ({ kind, id }) => {
    const filePath = path.join(mediaDir(kind), `${id}.png`);
    try {
      await ensureMedia(kind, id, null, { force: true });
      if (!(await exists(filePath))) return { kind, ok: false as const };
      return { kind, ok: true as const };
    } catch {
      return { kind, ok: false as const };
    }
  });

  const byKind: MediaRepullResult["byKind"] = {
    leagues: { ok: 0, failed: 0 },
    teams: { ok: 0, failed: 0 },
    players: { ok: 0, failed: 0 },
    venues: { ok: 0, failed: 0 },
  };
  for (const outcome of outcomes) {
    if (outcome.ok) byKind[outcome.kind].ok += 1;
    else byKind[outcome.kind].failed += 1;
  }

  const downloaded = outcomes.filter((o) => o.ok).length;
  return {
    deleted,
    targets: list.length,
    downloaded,
    failed: list.length - downloaded,
    byKind,
  };
}
