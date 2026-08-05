"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  AD_PLACEMENTS,
  type AdNetworkProvider,
  type AdNetworkSettings,
  type AdPlacement,
  type AdSlotNetworkConfig,
} from "@/lib/ads-types";

const inputClass =
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function AdminAdsPage() {
  const [settings, setSettings] = useState<AdNetworkSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/ads?settings=1");
    if (!res.ok) throw new Error("Failed to load ad settings");
    const json = await res.json();
    setSettings(json.settings);
  }

  useEffect(() => {
    void load()
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, []);

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <Skeleton className="h-5 w-32" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-full sm:col-span-2" />
          </div>
          <Skeleton className="mt-4 h-48 w-full" />
          <Skeleton className="h-10 w-40" />
        </div>
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
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Ads</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Connect Google AdSense (or a custom network script), then map each
          site placement to a unit ID from your network dashboard. Ads fill
          automatically — no manual banners.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 className="text-base font-semibold text-foreground">Ad network</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The loader script is injected site-wide when enabled. Slots show a
          loader until the network responds.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
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

          <label className="flex h-full items-end gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) =>
                setSettings({ ...settings, enabled: e.target.checked })
              }
            />
            <span>Network ads enabled on the public site</span>
          </label>

          {settings.provider === "adsense" && (
            <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
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

        <h3 className="mt-6 text-sm font-semibold text-foreground">
          Placement → network unit
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Create ad units in AdSense (or your network), then paste each unit /
          slot ID here.
        </p>
        <div className="mt-3 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                <th className="px-3 py-2 text-start font-medium">Placement</th>
                <th className="px-3 py-2 text-start font-medium">Size</th>
                <th className="px-3 py-2 text-start font-medium">Unit ID</th>
                <th className="px-3 py-2 text-center font-medium">On</th>
              </tr>
            </thead>
            <tbody>
              {AD_PLACEMENTS.map((p) => {
                const slot = settings.slots.find((s) => s.placement === p.id)!;
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
            {saving ? "Saving…" : "Save settings"}
          </Button>
          {savedAt && (
            <span className="text-xs text-muted-foreground">
              Saved at {savedAt}
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
