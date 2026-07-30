"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ImagePlus,
  Link2,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { players } from "@/data/players.mock";
import { matches } from "@/data/matches.mock";
import { cn } from "@/lib/utils";
import { isEmptyHtml } from "@/lib/sanitize";
import {
  type NewsFormLocale,
  type NewsFormValues,
} from "@/lib/admin/news-form";

export type { NewsFormValues } from "@/lib/admin/news-form";

const locales: NewsFormLocale[] = ["fr", "ar", "en"];

export function NewsEditor({ initial }: { initial: NewsFormValues }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<NewsFormValues>(initial);
  const [localeTab, setLocaleTab] = useState<NewsFormLocale>("fr");
  const [tagInput, setTagInput] = useState("");
  const [playerQuery, setPlayerQuery] = useState("");
  const [matchQuery, setMatchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [showUrlField, setShowUrlField] = useState(false);

  const playerSuggestions = useMemo(() => {
    const q = playerQuery.trim().toLowerCase();
    if (!q) return [];
    return players
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) && !form.playerIds.includes(p.id)
      )
      .slice(0, 8);
  }, [playerQuery, form.playerIds]);

  const matchSuggestions = useMemo(() => {
    const q = matchQuery.trim().toLowerCase();
    if (!q) return [];
    return matches
      .filter((m) => {
        const label =
          `${m.homeTeam.name} ${m.awayTeam.name} ${m.slug}`.toLowerCase();
        return label.includes(q) && !form.matchIds.includes(m.id);
      })
      .slice(0, 8);
  }, [matchQuery, form.matchIds]);

  function updateTranslation(
    locale: NewsFormLocale,
    field: "title" | "excerpt" | "body",
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [locale]: { ...prev.translations[locale], [field]: value },
      },
    }));
  }

  function updateMeta(
    key: "metaTitle" | "metaDescription" | "ogImage",
    locale: NewsFormLocale,
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? {}), [locale]: value },
    }));
  }

  async function onUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Upload failed");
        return;
      }
      setForm((prev) => ({ ...prev, coverUrl: json.url as string }));
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    for (const loc of locales) {
      if (isEmptyHtml(form.translations[loc].body)) {
        setError(`Body (${loc.toUpperCase()}) cannot be empty.`);
        setPending(false);
        setLocaleTab(loc);
        return;
      }
    }

    const payload = {
      ...form,
      coverUrl: form.coverUrl || null,
      tags: form.tags,
      playerIds: form.playerIds,
      matchIds: form.matchIds,
    };

    const res = await fetch("/api/admin/news", {
      method: form.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form.id ? { id: form.id, ...payload } : payload),
    });

    setPending(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || "Save failed");
      return;
    }

    router.push("/admin/news");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/news"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Back to news
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            {form.id ? "Edit article" : "New article"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Player and match tags are optional. Body uses a rich editor per
            language.
          </p>
        </div>
        <Button type="submit" disabled={pending || uploading} className="gap-2">
          <Save className="size-4" aria-hidden />
          {pending ? "Saving…" : "Save"}
        </Button>
      </header>

      {error ? (
        <div
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {/* Optional entity tags — top, side by side */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold">Tag players</h2>
            <span className="text-xs text-muted-foreground">Optional</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.playerIds.map((id) => {
              const p = players.find((x) => x.id === id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      playerIds: form.playerIds.filter((x) => x !== id),
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs"
                >
                  {p?.name ?? id}
                  <X className="size-3" aria-hidden />
                </button>
              );
            })}
          </div>
          <input
            value={playerQuery}
            onChange={(e) => setPlayerQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Search players…"
          />
          {playerSuggestions.length > 0 ? (
            <ul className="max-h-40 overflow-auto rounded-lg border border-border">
              {playerSuggestions.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      setForm({
                        ...form,
                        playerIds: [...form.playerIds, p.id],
                      });
                      setPlayerQuery("");
                    }}
                  >
                    {p.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold">Tag matches</h2>
            <span className="text-xs text-muted-foreground">Optional</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.matchIds.map((id) => {
              const m = matches.find((x) => x.id === id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      matchIds: form.matchIds.filter((x) => x !== id),
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs"
                >
                  {m
                    ? `${m.homeTeam.shortName} vs ${m.awayTeam.shortName}`
                    : id}
                  <X className="size-3" aria-hidden />
                </button>
              );
            })}
          </div>
          <input
            value={matchQuery}
            onChange={(e) => setMatchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Search matches…"
          />
          {matchSuggestions.length > 0 ? (
            <ul className="max-h-40 overflow-auto rounded-lg border border-border">
              {matchSuggestions.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      setForm({
                        ...form,
                        matchIds: [...form.matchIds, m.id],
                      });
                      setMatchQuery("");
                    }}
                  >
                    {m.homeTeam.name} vs {m.awayTeam.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:grid-cols-2 sm:p-5">
        <label className="space-y-1.5 text-sm sm:col-span-2">
          <span className="font-medium">Slug</span>
          <input
            required
            pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="casablanca-derby-preview"
          />
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="font-medium">Status</span>
          <select
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value as "draft" | "published",
              })
            }
            className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="font-medium">Free tags</span>
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Optional tag"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const t = tagInput.trim();
                  if (t && !form.tags.includes(t)) {
                    setForm({ ...form, tags: [...form.tags, t] });
                    setTagInput("");
                  }
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const t = tagInput.trim();
                if (t && !form.tags.includes(t)) {
                  setForm({ ...form, tags: [...form.tags, t] });
                  setTagInput("");
                }
              }}
            >
              Add
            </Button>
          </div>
          {form.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {form.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      tags: form.tags.filter((t) => t !== tag),
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs"
                >
                  {tag}
                  <X className="size-3" aria-hidden />
                </button>
              ))}
            </div>
          ) : null}
        </label>

        <div className="space-y-3 text-sm sm:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">Cover image</span>
            <span className="text-xs text-muted-foreground">
              16:9 · JPEG, PNG, WebP · max 5MB
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onUpload(file);
              e.target.value = "";
            }}
          />

          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (!form.coverUrl) fileInputRef.current?.click();
              }
            }}
            onClick={() => {
              if (!form.coverUrl && !uploading) fileInputRef.current?.click();
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              if (e.currentTarget.contains(e.relatedTarget as Node)) return;
              setDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file?.type.startsWith("image/")) void onUpload(file);
            }}
            className={cn(
              "group relative flex min-h-[220px] w-full cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-all sm:min-h-[280px] lg:min-h-[320px]",
              dragging
                ? "border-primary bg-primary/10 scale-[1.01]"
                : form.coverUrl
                  ? "border-transparent"
                  : "border-border hover:border-primary/50 hover:bg-muted/40"
            )}
          >
            {form.coverUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.coverUrl}
                  alt=""
                  className="absolute inset-0 size-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-4 sm:p-5">
                  <div className="min-w-0 text-white">
                    <p className="text-sm font-semibold drop-shadow">
                      Cover ready
                    </p>
                    <p className="truncate text-xs text-white/80">
                      {form.coverUrl}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="gap-1.5 bg-white/95 text-foreground hover:bg-white"
                      disabled={uploading}
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      <Upload className="size-3.5" aria-hidden />
                      Replace
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        setForm({ ...form, coverUrl: "" });
                      }}
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      Remove
                    </Button>
                  </div>
                </div>
                {uploading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <p className="rounded-full bg-background px-4 py-2 text-sm font-medium">
                      Uploading…
                    </p>
                  </div>
                ) : null}
              </>
            ) : (
              <div
                className={cn(
                  "relative flex w-full flex-col items-center justify-center gap-4 px-6 py-10 text-center",
                  "bg-[radial-gradient(ellipse_at_top,_oklch(0.55_0.17_145_/_0.18),_transparent_55%),linear-gradient(135deg,_oklch(0.22_0.04_150_/_0.35),_oklch(0.18_0.02_250_/_0.4))]"
                )}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-[0.12]"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3E%3C/g%3E%3C/svg%3E\")",
                  }}
                />
                <div
                  className={cn(
                    "relative flex size-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-lg backdrop-blur-sm transition-transform",
                    dragging && "scale-110"
                  )}
                >
                  <ImagePlus className="size-8 text-primary" aria-hidden />
                </div>
                <div className="relative space-y-1.5">
                  <p className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                    {dragging
                      ? "Drop it — make it the hero shot"
                      : uploading
                        ? "Uploading your cover…"
                        : "Drop a cover image here"}
                  </p>
                  <p className="mx-auto max-w-md text-sm text-muted-foreground">
                    Wide hero for the article page. Drag & drop, click to browse,
                    or paste a link below.
                  </p>
                </div>
                <div className="relative flex flex-wrap items-center justify-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="gap-1.5"
                    disabled={uploading}
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    <Upload className="size-3.5" aria-hidden />
                    {uploading ? "Uploading…" : "Choose file"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5 border-white/20 bg-background/40 backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUrlField((v) => !v);
                    }}
                  >
                    <Link2 className="size-3.5" aria-hidden />
                    Use URL
                  </Button>
                </div>
              </div>
            )}
          </div>

          {showUrlField || (form.coverUrl && form.coverUrl.startsWith("http")) ? (
            <div className="flex gap-2">
              <input
                value={form.coverUrl ?? ""}
                onChange={(e) =>
                  setForm({ ...form, coverUrl: e.target.value })
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="https://example.com/cover.jpg"
                onClick={(e) => e.stopPropagation()}
              />
              {showUrlField ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Hide URL field"
                  onClick={() => setShowUrlField(false)}
                >
                  <X className="size-4" />
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex gap-2">
          {locales.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setLocaleTab(loc)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium uppercase transition-colors",
                localeTab === loc
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {loc}
            </button>
          ))}
        </div>

        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Title ({localeTab})</span>
          <input
            required
            value={form.translations[localeTab].title}
            onChange={(e) =>
              updateTranslation(localeTab, "title", e.target.value)
            }
            className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Excerpt ({localeTab})</span>
          <textarea
            required
            rows={2}
            value={form.translations[localeTab].excerpt}
            onChange={(e) =>
              updateTranslation(localeTab, "excerpt", e.target.value)
            }
            className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>

        <div className="space-y-1.5 text-sm">
          <span className="font-medium">Body ({localeTab})</span>
          <RichTextEditor
            key={localeTab}
            value={form.translations[localeTab].body}
            onChange={(html) => updateTranslation(localeTab, "body", html)}
            placeholder={`Write the ${localeTab.toUpperCase()} article…`}
            dir={localeTab === "ar" ? "rtl" : "ltr"}
          />
        </div>

        <div className="grid gap-3 rounded-lg border border-dashed border-border p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            SEO ({localeTab})
          </p>
          <label className="block space-y-1.5 text-sm">
            <span>Meta title</span>
            <input
              value={form.metaTitle?.[localeTab] ?? ""}
              onChange={(e) =>
                updateMeta("metaTitle", localeTab, e.target.value)
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span>Meta description</span>
            <textarea
              rows={2}
              value={form.metaDescription?.[localeTab] ?? ""}
              onChange={(e) =>
                updateMeta("metaDescription", localeTab, e.target.value)
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span>OG image URL</span>
            <input
              value={form.ogImage?.[localeTab] ?? ""}
              onChange={(e) =>
                updateMeta("ogImage", localeTab, e.target.value)
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        </div>
      </section>
    </form>
  );
}
