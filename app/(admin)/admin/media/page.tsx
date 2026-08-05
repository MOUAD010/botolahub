"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ImageIcon, Loader2, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type {
  LocalMediaItem,
  MediaInventory,
  MediaKind,
  MediaRepullResult,
} from "@/lib/api-football/media-types";

const KINDS: Array<{ id: MediaKind | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "teams", label: "Teams" },
  { id: "players", label: "Players" },
  { id: "leagues", label: "Leagues" },
  { id: "venues", label: "Venues" },
];

const PAGE_SIZE = 48;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminMediaPage() {
  const [inventory, setInventory] = useState<MediaInventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repulling, setRepulling] = useState(false);
  const [lastResult, setLastResult] = useState<MediaRepullResult | null>(null);
  const [kind, setKind] = useState<MediaKind | "all">("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/media");
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error || "Failed to load media");
    }
    const data = (await res.json()) as MediaInventory;
    setInventory(data);
  }, []);

  useEffect(() => {
    void load()
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    setError(null);
    try {
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setRefreshing(false);
    }
  }

  const filtered = useMemo(() => {
    if (!inventory) return [] as LocalMediaItem[];
    const q = query.trim().toLowerCase();
    return inventory.items.filter((item) => {
      if (kind !== "all" && item.kind !== kind) return false;
      if (!q) return true;
      return (
        item.id.includes(q) ||
        item.kind.includes(q) ||
        item.publicPath.toLowerCase().includes(q)
      );
    });
  }, [inventory, kind, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE
  );

  useEffect(() => {
    setPage(0);
  }, [kind, query]);

  async function repullAll() {
    const ok = window.confirm(
      "Delete every downloaded image and re-download them from the CDN?\n\nThis does not use API quota, but may take a minute."
    );
    if (!ok) return;

    setRepulling(true);
    setError(null);
    setLastResult(null);
    try {
      const res = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "repull" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Repull failed");
      setLastResult(data.result as MediaRepullResult);
      setInventory(data.inventory as MediaInventory);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Repull failed");
    } finally {
      setRepulling(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!inventory) {
    return (
      <p className="text-sm text-destructive">
        {error || "Could not load media library."}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Media</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Images downloaded during football sync into{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              public/media
            </code>
            . CDN fetches do not count toward the API quota.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={repulling || refreshing}
            onClick={() => void refresh()}
          >
            {refreshing ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <RefreshCw data-icon="inline-start" />
            )}
            Refresh
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={repulling || refreshing}
            onClick={() => void repullAll()}
          >
            {repulling ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <ImageIcon data-icon="inline-start" />
            )}
            {repulling ? "Repulling…" : "Repull all"}
          </Button>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {lastResult && (
        <div className="rounded-xl border border-border bg-card p-4 text-sm">
          <p className="font-medium text-foreground">Last repull</p>
          <p className="mt-1 text-muted-foreground">
            Deleted {lastResult.deleted} · targets {lastResult.targets} ·
            downloaded {lastResult.downloaded} · failed {lastResult.failed}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {(Object.keys(lastResult.byKind) as MediaKind[]).map((k) => (
              <span
                key={k}
                className="rounded-md border border-border bg-background px-2 py-1"
              >
                {k}: {lastResult.byKind[k].ok} ok
                {lastResult.byKind[k].failed
                  ? ` / ${lastResult.byKind[k].failed} failed`
                  : ""}
              </span>
            ))}
          </div>
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {KINDS.filter((k) => k.id !== "all").map((k) => {
          const totals = inventory.totals[k.id as MediaKind];
          return (
            <button
              key={k.id}
              type="button"
              onClick={() => setKind(k.id)}
              className={cn(
                "rounded-xl border p-4 text-start transition-colors",
                kind === k.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:bg-muted/40"
              )}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {k.label}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {totals.count}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatBytes(totals.bytes)}
              </p>
            </button>
          );
        })}
      </section>

      <section className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-3 sm:p-4">
          <div className="flex flex-wrap gap-1">
            {KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => setKind(k.id)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                  kind === k.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {k.label}
                {k.id === "all"
                  ? ` (${inventory.totalCount})`
                  : ` (${inventory.totals[k.id].count})`}
              </button>
            ))}
          </div>
          <div className="relative ms-auto w-full max-w-xs">
            <Search
              className="pointer-events-none absolute inset-s-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by id…"
              className="flex h-9 w-full rounded-lg border border-border bg-background pe-3 ps-8 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        {pageItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center">
            <ImageIcon className="size-8 text-muted-foreground/50" aria-hidden />
            <p className="text-sm text-muted-foreground">
              {inventory.totalCount === 0
                ? "No images on disk yet. Run a football sync or click Repull all."
                : "No images match this filter."}
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-3 gap-2 p-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {pageItems.map((item) => (
              <li
                key={`${item.kind}-${item.id}`}
                className="group overflow-hidden rounded-lg border border-border bg-background"
              >
                <div className="relative aspect-square bg-muted/40">
                  <Image
                    src={item.publicPath}
                    alt={`${item.kind} ${item.id}`}
                    fill
                    sizes="96px"
                    unoptimized
                    className="object-contain p-2"
                  />
                </div>
                <div className="border-t border-border px-1.5 py-1.5">
                  <p className="truncate text-[11px] font-medium tabular-nums">
                    {item.id}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {item.kind} · {formatBytes(item.size)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
            <p className="text-muted-foreground">
              {filtered.length} images · page {safePage + 1} / {pageCount}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={safePage === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={safePage >= pageCount - 1}
                onClick={() =>
                  setPage((p) => Math.min(pageCount - 1, p + 1))
                }
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        Total on disk: {inventory.totalCount} files ·{" "}
        {formatBytes(inventory.totalBytes)}. In production without a volume
        mount, files are ephemeral — the site CDN fallback still serves them.
      </p>
    </div>
  );
}
