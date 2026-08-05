export type MediaKind = "leagues" | "teams" | "players" | "venues";

export const MEDIA_KINDS: MediaKind[] = [
  "leagues",
  "teams",
  "players",
  "venues",
];

export type LocalMediaItem = {
  kind: MediaKind;
  id: string;
  publicPath: string;
  size: number;
  mtime: string;
};

export type MediaKindTotals = Record<
  MediaKind,
  { count: number; bytes: number }
>;

export type MediaInventory = {
  items: LocalMediaItem[];
  totals: MediaKindTotals;
  totalCount: number;
  totalBytes: number;
};

export type MediaRepullResult = {
  deleted: number;
  targets: number;
  downloaded: number;
  failed: number;
  byKind: Record<MediaKind, { ok: number; failed: number }>;
};
