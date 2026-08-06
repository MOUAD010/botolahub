"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  ImagePlus,
  Loader2,
  Megaphone,
  Network,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  AD_PLACEMENTS,
  placementLabel,
  type AdCreative,
  type AdNetworkProvider,
  type AdNetworkSettings,
  type AdPlacement,
  type AdSlotNetworkConfig,
} from "@/lib/ads-types";

const inputClass =
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

const textareaClass =
  "flex min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

type CreativeForm = {
  name: string;
  placement: AdPlacement;
  enabled: boolean;
  imageUrl: string;
  clickUrl: string;
  htmlSnippet: string;
  sortOrder: number;
};

const emptyForm = (): CreativeForm => ({
  name: "",
  placement: "sidebar-rectangle",
  enabled: true,
  imageUrl: "",
  clickUrl: "",
  htmlSnippet: "",
  sortOrder: 0,
});

function isActiveNow(c: AdCreative, now = Date.now()): boolean {
  if (!c.enabled) return false;
  if (c.startsAt && new Date(c.startsAt).getTime() > now) return false;
  if (c.endsAt && new Date(c.endsAt).getTime() < now) return false;
  return Boolean(c.imageUrl?.trim() || c.htmlSnippet?.trim());
}

export default function AdminAdsPage() {
  const [settings, setSettings] = useState<AdNetworkSettings | null>(null);
  const [creatives, setCreatives] = useState<AdCreative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [form, setForm] = useState<CreativeForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [creativeBusy, setCreativeBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/ads");
    if (!res.ok) throw new Error("Failed to load ad settings");
    const json = await res.json();
    setSettings(json.settings);
    setCreatives(json.creatives ?? []);
  }

  useEffect(() => {
    void load()
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, []);

  const overview = useMemo(() => {
    if (!settings) return [];
    return AD_PLACEMENTS.map((placement) => {
      const manuals = creatives
        .filter((c) => c.placement === placement.id && isActiveNow(c))
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const slot = settings.slots.find((s) => s.placement === placement.id);
      const networkReady =
        settings.enabled &&
        settings.provider !== "none" &&
        Boolean(slot?.enabled && slot.unitId.trim()) &&
        (settings.provider !== "adsense" || Boolean(settings.publisherId?.trim()));

      let source: "manual" | "network" | "empty" = "empty";
      if (manuals.length > 0) source = "manual";
      else if (networkReady) source = "network";

      return { placement, manuals, slot, networkReady, source };
    });
  }, [settings, creatives]);

  const filledCount = overview.filter((o) => o.source !== "empty").length;
  const manualCount = creatives.filter((c) => isActiveNow(c)).length;

  async function saveSettings() {
    if (!settings) return;
    setSaving(true);
    setError(null);
    setSavedAt(null);
    const res = await fetch("/api/admin/ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "settings", ...settings }),
    });
    setSaving(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || "Could not save network settings");
      return;
    }
    const json = await res.json();
    setSettings(json.settings);
    setSavedAt(new Date().toLocaleTimeString());
  }

  function updateSlot(
    placement: AdPlacement,
    patch: Partial<AdSlotNetworkConfig>
  ) {
    if (!settings) return;
    setSettings({
      ...settings,
      slots: settings.slots.map((s) =>
        s.placement === placement ? { ...s, ...patch } : s
      ),
    });
  }

  async function uploadImage(file: File) {
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("folder", "ads");
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Upload failed");
      setForm((f) => ({ ...f, imageUrl: json.url as string }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function startEdit(creative: AdCreative) {
    setEditingId(creative.id);
    setForm({
      name: creative.name,
      placement: creative.placement,
      enabled: creative.enabled,
      imageUrl: creative.imageUrl ?? "",
      clickUrl: creative.clickUrl ?? "",
      htmlSnippet: creative.htmlSnippet ?? "",
      sortOrder: creative.sortOrder,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm());
  }

  async function saveCreative() {
    setCreativeBusy(true);
    setError(null);
    try {
      const payload = {
        kind: "creative" as const,
        name: form.name,
        placement: form.placement,
        enabled: form.enabled,
        imageUrl: form.imageUrl || null,
        clickUrl: form.clickUrl || null,
        htmlSnippet: form.htmlSnippet || null,
        sortOrder: form.sortOrder,
      };
      const res = await fetch("/api/admin/ads", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId ? { ...payload, id: editingId } : payload
        ),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Could not save creative");
      }
      await load();
      resetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save creative");
    } finally {
      setCreativeBusy(false);
    }
  }

  async function toggleCreative(creative: AdCreative) {
    setCreativeBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "creative",
          id: creative.id,
          enabled: !creative.enabled,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Could not update creative");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update creative");
    } finally {
      setCreativeBusy(false);
    }
  }

  async function removeCreative(id: string) {
    if (!window.confirm("Delete this manual ad?")) return;
    setCreativeBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/ads?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Could not delete creative");
      }
      if (editingId === id) resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete creative");
    } finally {
      setCreativeBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <Skeleton className="h-11 w-full max-w-lg rounded-xl" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  if (!settings) {
    return (
      <p className="text-sm text-destructive">
        {error || "Could not load ad settings."}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ads</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Review live placements, connect an ad network, or upload house ads.
            Manual creatives take priority over network units for the same slot.
          </p>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Tabs defaultValue="overview" className="gap-5">
        <TabsList
          variant="line"
          className="h-auto w-full flex-wrap justify-start gap-1 border-b border-border bg-transparent p-0"
        >
          <TabsTrigger value="overview" className="gap-2 px-3 py-2.5">
            <Megaphone className="size-4" aria-hidden />
            Overview
          </TabsTrigger>
          <TabsTrigger value="network" className="gap-2 px-3 py-2.5">
            <Network className="size-4" aria-hidden />
            Network
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-2 px-3 py-2.5">
            <ImagePlus className="size-4" aria-hidden />
            Manual ads
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-5">
          <section className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Filled placements"
              value={`${filledCount}/${AD_PLACEMENTS.length}`}
              hint="Slots showing an ad on the site"
            />
            <StatCard
              label="Network"
              value={
                settings.enabled && settings.provider !== "none"
                  ? settings.provider
                  : "Off"
              }
              hint={
                settings.provider === "adsense"
                  ? settings.publisherId || "No publisher ID"
                  : settings.provider === "custom"
                    ? settings.scriptUrl || "No script URL"
                    : "Connect AdSense or a custom script"
              }
            />
            <StatCard
              label="Active manual ads"
              value={String(manualCount)}
              hint={`${creatives.length} total uploaded`}
            />
          </section>

          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">What is live now</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Manual ads win when enabled; otherwise the network unit is used.
              </p>
            </div>
            <ul className="divide-y divide-border">
              {overview.map(({ placement, manuals, slot, source }) => (
                <li
                  key={placement.id}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      {placement.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {placement.size} · {placement.hint}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <SourceBadge source={source} />
                    <span className="text-xs text-muted-foreground">
                      {source === "manual"
                        ? manuals.length > 1
                          ? `${manuals.length} ads rotate every 1 min`
                          : manuals[0]?.name
                        : source === "network"
                          ? `Unit ${slot?.unitId}`
                          : "Empty placeholder"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </TabsContent>

        <TabsContent value="network" className="space-y-5">
          <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <h2 className="text-base font-semibold text-foreground">
              Ad network
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Inject AdSense or a custom network script site-wide, then map each
              placement to a unit ID.
            </p>

            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium">Provider</span>
                  <select
                    className={inputClass}
                    value={settings.provider}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        provider: e.target.value as AdNetworkProvider,
                      })
                    }
                  >
                    <option value="none">None</option>
                    <option value="adsense">Google AdSense</option>
                    <option value="custom">Custom script URL</option>
                  </select>
                </label>

                {settings.provider === "adsense" && (
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium">Publisher ID</span>
                    <input
                      className={inputClass}
                      value={settings.publisherId ?? ""}
                      onChange={(e) =>
                        setSettings({ ...settings, publisherId: e.target.value })
                      }
                      placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                    />
                  </label>
                )}

                {settings.provider === "custom" && (
                  <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
                    <span className="font-medium">Script URL</span>
                    <input
                      className={inputClass}
                      value={settings.scriptUrl ?? ""}
                      onChange={(e) =>
                        setSettings({ ...settings, scriptUrl: e.target.value })
                      }
                      placeholder="https://…"
                    />
                  </label>
                )}
              </div>

              <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/30 px-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Show network ads on site</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Master switch for AdSense / custom network only. Manual ads
                    still show when this is off.
                  </p>
                </div>
                <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 pt-0.5 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-border"
                    checked={settings.enabled}
                    onChange={(e) =>
                      setSettings({ ...settings, enabled: e.target.checked })
                    }
                  />
                  <span className="font-medium">
                    {settings.enabled ? "On" : "Off"}
                  </span>
                </label>
              </div>
            </div>

            <h3 className="mt-6 text-sm font-semibold text-foreground">
              Placement → network unit
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Create ad units in your network dashboard, then paste each unit /
              slot ID here.
            </p>
            <div className="mt-3 overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                    <th className="px-3 py-2 text-start font-medium">
                      Placement
                    </th>
                    <th className="px-3 py-2 text-start font-medium">Size</th>
                    <th className="px-3 py-2 text-start font-medium">Unit ID</th>
                    <th className="px-3 py-2 text-center font-medium">On</th>
                  </tr>
                </thead>
                <tbody>
                  {AD_PLACEMENTS.map((p) => {
                    const slot = settings.slots.find(
                      (s) => s.placement === p.id
                    )!;
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-3 py-2 font-medium">{p.label}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {p.size}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            className={cn(inputClass, "h-9")}
                            value={slot.unitId}
                            onChange={(e) =>
                              updateSlot(p.id, { unitId: e.target.value })
                            }
                            placeholder="1234567890"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={slot.enabled}
                            onChange={(e) =>
                              updateSlot(p.id, { enabled: e.target.checked })
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={() => void saveSettings()}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : null}
                {saving ? "Saving…" : "Save network settings"}
              </Button>
              {savedAt && (
                <span className="text-xs text-muted-foreground">
                  Saved at {savedAt}
                </span>
              )}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="manual" className="space-y-5">
          <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">
                  {editingId ? "Edit manual ad" : "Upload manual ad"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload a banner image or paste HTML. Active manual ads override
                  the network for that placement. If several are enabled on the
                  same placement, they rotate every 1 minute (by sort order).
                </p>
              </div>
              {editingId ? (
                <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                  Cancel edit
                </Button>
              ) : null}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
                <span className="font-medium">Name</span>
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Ramadan sidebar promo"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
                <span className="font-medium">Placement</span>
                <select
                  className={inputClass}
                  value={form.placement}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      placement: e.target.value as AdPlacement,
                    }))
                  }
                >
                  {AD_PLACEMENTS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label} ({p.size})
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
                <span className="font-medium">Sort order</span>
                <input
                  type="number"
                  min={0}
                  className={cn(inputClass, "max-w-40")}
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      sortOrder: Number(e.target.value) || 0,
                    }))
                  }
                />
                <span className="text-xs text-muted-foreground">
                  Lower numbers show first when ads rotate on the same placement.
                </span>
              </label>

              <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
                <span className="font-medium">Click URL</span>
                <input
                  className={inputClass}
                  value={form.clickUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clickUrl: e.target.value }))
                  }
                  placeholder="https://sponsor.example"
                />
              </label>

              <div className="flex flex-col gap-1.5 text-sm sm:col-span-2">
                <span className="font-medium">Image</span>
                <div className="flex flex-wrap gap-2">
                  <input
                    className={cn(inputClass, "min-w-0 flex-1")}
                    value={form.imageUrl}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, imageUrl: e.target.value }))
                    }
                    placeholder="/uploads/ads/…"
                  />
                  <label className="inline-flex cursor-pointer items-center">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void uploadImage(file);
                        e.target.value = "";
                      }}
                    />
                    <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted">
                      {uploading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Upload className="size-4" />
                      )}
                      {uploading ? "Uploading…" : "Upload"}
                    </span>
                  </label>
                </div>
                {form.imageUrl ? (
                  <div className="mt-1 flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2">
                    <Image
                      src={form.imageUrl}
                      alt=""
                      width={72}
                      height={48}
                      unoptimized
                      className="h-12 w-auto max-w-28 rounded object-contain"
                    />
                    <span className="truncate text-xs text-muted-foreground">
                      {form.imageUrl}
                    </span>
                  </div>
                ) : null}
              </div>

              <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
                <span className="font-medium">HTML snippet (optional)</span>
                <textarea
                  className={textareaClass}
                  value={form.htmlSnippet}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, htmlSnippet: e.target.value }))
                  }
                  placeholder="<a href='…'><img src='…' /></a>"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 rounded border-border"
                  checked={form.enabled}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, enabled: e.target.checked }))
                  }
                />
                <span>
                  <span className="font-medium">Show on public site</span>
                  <span className="ms-1 text-muted-foreground">
                    (keep saved but hidden when off)
                  </span>
                </span>
              </label>

              <Button
                type="button"
                disabled={
                  creativeBusy ||
                  !form.name.trim() ||
                  (!form.imageUrl.trim() && !form.htmlSnippet.trim())
                }
                onClick={() => void saveCreative()}
              >
                {creativeBusy ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : editingId ? null : (
                  <Plus data-icon="inline-start" />
                )}
                {creativeBusy
                  ? "Saving…"
                  : editingId
                    ? "Update ad"
                    : "Add manual ad"}
              </Button>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Uploaded creatives</h2>
            </div>
            {creatives.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                No manual ads yet. Upload a banner above.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {creatives.map((creative) => (
                  <li
                    key={creative.id}
                    className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center"
                  >
                    <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40">
                      {creative.imageUrl ? (
                        <Image
                          src={creative.imageUrl}
                          alt=""
                          width={64}
                          height={64}
                          unoptimized
                          className="size-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-muted-foreground">
                          HTML
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{creative.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {placementLabel(creative.placement)} · sort{" "}
                        {creative.sortOrder}
                        {isActiveNow(creative) ? " · live" : " · off"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={creativeBusy}
                        onClick={() => void toggleCreative(creative)}
                      >
                        {creative.enabled ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={creativeBusy}
                        onClick={() => startEdit(creative)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={creativeBusy}
                        onClick={() => void removeCreative(creative.id)}
                      >
                        <Trash2 data-icon="inline-start" />
                        Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 truncate text-2xl font-semibold capitalize tabular-nums">
        {value}
      </p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function SourceBadge({ source }: { source: "manual" | "network" | "empty" }) {
  return (
    <span
      className={cn(
        "rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        source === "manual" &&
          "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
        source === "network" &&
          "bg-sky-500/15 text-sky-700 dark:text-sky-400",
        source === "empty" && "bg-muted text-muted-foreground"
      )}
    >
      {source === "manual"
        ? "Manual"
        : source === "network"
          ? "Network"
          : "Empty"}
    </span>
  );
}
