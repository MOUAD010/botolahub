"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  Eye,
  Link2,
  MousePointerClick,
  Search,
  TrendingUp,
} from "lucide-react";
import type { GscOverview } from "@/lib/seo/gsc";
import { Badge } from "@/components/ui/badge";

export default function AdminRankingPage() {
  const [data, setData] = useState<GscOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/gsc")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load ranking data");
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Error"));
  }, []);

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <p className="text-sm text-muted-foreground">Loading ranking…</p>
    );
  }

  if (!data.connected) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">
            Google ranking
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect Google Search Console to see clicks, impressions, and
            average position. No placeholder numbers are shown.
          </p>
        </header>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <span className="rounded-lg bg-amber-500/15 p-2 text-amber-600 dark:text-amber-400">
              <CircleAlert className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">Not connected yet</p>
                <Badge variant="secondary">Setup required</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Add these environment variables, then restart the app:
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {data.missing.map((key) => (
                  <li key={key}>
                    <code className="rounded-md bg-muted px-2 py-1 font-mono text-xs">
                      {key}
                    </code>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <ol className="mt-6 space-y-3 border-t border-border pt-5">
            {data.setupSteps.map((step, i) => (
              <li key={step} className="flex gap-3 text-sm">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Google ranking
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="size-3" aria-hidden />
              Connected
            </Badge>
            <span className="inline-flex items-center gap-1">
              <Link2 className="size-3.5" aria-hidden />
              {data.siteUrl}
            </span>
            <span>
              {data.range.startDate} → {data.range.endDate}
            </span>
          </p>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Clicks",
            value: data.totals.clicks,
            icon: MousePointerClick,
          },
          {
            label: "Impressions",
            value: data.totals.impressions,
            icon: Eye,
          },
          {
            label: "CTR",
            value: `${(data.totals.ctr * 100).toFixed(1)}%`,
            icon: TrendingUp,
          },
          {
            label: "Avg. position",
            value: data.totals.position.toFixed(1),
            icon: Search,
          },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {m.label}
                </p>
                <span className="rounded-md bg-primary/10 p-1.5 text-primary">
                  <Icon className="size-3.5" aria-hidden />
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {m.value}
              </p>
            </div>
          );
        })}
      </div>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <h2 className="mb-3 text-sm font-semibold">Top queries</h2>
        {data.topQueries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No query data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-2 pe-3 font-medium">Query</th>
                  <th className="py-2 pe-3 font-medium">Clicks</th>
                  <th className="py-2 pe-3 font-medium">Impr.</th>
                  <th className="py-2 pe-3 font-medium">Pos.</th>
                </tr>
              </thead>
              <tbody>
                {data.topQueries.map((row) => (
                  <tr
                    key={row.query}
                    className="border-b border-border last:border-0"
                  >
                    <td className="py-2.5 pe-3">{row.query}</td>
                    <td className="py-2.5 pe-3 tabular-nums">{row.clicks}</td>
                    <td className="py-2.5 pe-3 tabular-nums">
                      {row.impressions}
                    </td>
                    <td className="py-2.5 pe-3 tabular-nums">
                      {row.position.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
