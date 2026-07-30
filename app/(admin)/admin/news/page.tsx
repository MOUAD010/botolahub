"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { cn } from "@/lib/utils";
type NewsItem = {
  id: string;
  slug: string;
  status: "draft" | "published";
  publishedAt: string | null;
  viewCount: number;
  title: { fr: string; ar: string; en: string };
};

export default function AdminNewsListPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<NewsItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/news");
    if (!res.ok) throw new Error("Failed to load news");
    const json = await res.json();
    setItems(json.items);
  }

  useEffect(() => {
    void load()
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, []);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);
    const res = await fetch(`/api/admin/news?id=${pendingDelete.id}`, {
      method: "DELETE",
    });
    setDeleting(false);
    if (!res.ok) {
      setDeleteError("Could not delete this article. Try again.");
      return;
    }
    setPendingDelete(null);
    await load();
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">News</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Multilingual articles with SEO and entity tags.
          </p>
        </div>
        <Link
          href="/admin/news/new"
          className={cn(buttonVariants(), "gap-2")}
        >
          <Plus className="size-4" aria-hidden />
          Add article
        </Link>
      </header>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Article</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <Eye className="size-3.5" aria-hidden />
                    Views
                  </span>
                </th>
                <th className="px-4 py-3 font-medium">Published</th>
                <th className="px-4 py-3 text-end font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    Loading articles…
                  </td>
                </tr>
              ) : null}
              {!loading &&
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {item.title.en || item.title.fr}
                      </div>
                      <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                        /{item.slug}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          item.status === "published" ? "success" : "secondary"
                        }
                        className="capitalize"
                      >
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {item.viewCount}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.publishedAt
                        ? new Date(item.publishedAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/news/${item.id}`}
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "icon-sm" })
                          )}
                          aria-label={`Edit ${item.title.en || item.slug}`}
                          title="Edit"
                        >
                          <Pencil className="size-4" />
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${item.title.en || item.slug}`}
                          title="Delete"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => {
                            setDeleteError(null);
                            setPendingDelete(item);
                          }}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!loading && items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <p className="text-sm text-muted-foreground">
                      No articles yet.
                    </p>
                    <Link
                      href="/admin/news/new"
                      className={cn(buttonVariants(), "mt-4 gap-2")}
                    >
                      <Plus className="size-4" aria-hidden />
                      Add your first article
                    </Link>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setPendingDelete(null);
            setDeleteError(null);
          }
        }}
        title="Delete article?"
        description={
          deleteError
            ? deleteError
            : `“${pendingDelete?.title.en || pendingDelete?.slug}” will be permanently removed. This cannot be undone.`
        }
        confirmLabel="Delete"
        destructive
        pending={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
