"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  FileText,
  MousePointerClick,
  Newspaper,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

type AnalyticsPayload = {
  news: { published: number; drafts: number; totalViews: number };
  visits: { today: number; last7: number; last30: number };
  daily: Array<{ date: string; count: number }>;
  topPaths: Array<{ path: string; count: number }>;
};

export default function AdminOverviewPage() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/analytics")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load analytics");
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
      <p className="text-sm text-muted-foreground">Loading overview…</p>
    );
  }

  const metrics = [
    {
      label: "Visits today",
      value: data.visits.today,
      icon: MousePointerClick,
    },
    { label: "Last 7 days", value: data.visits.last7, icon: TrendingUp },
    { label: "Last 30 days", value: data.visits.last30, icon: Users },
    { label: "News views", value: data.news.totalViews, icon: Eye },
    { label: "Published", value: data.news.published, icon: Newspaper },
    { label: "Drafts", value: data.news.drafts, icon: FileText },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Daily visits and news performance.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => {
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
        <h2 className="mb-4 text-sm font-semibold">Visits — last 30 days</h2>
        <div className="h-64 w-full">
          {data.daily.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
              No visit data yet — browse the public site to start collecting.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.daily}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-primary)"
                  fill="var(--color-primary)"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <h2 className="mb-3 text-sm font-semibold">Top paths (7 days)</h2>
        {data.topPaths.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pageviews yet. Browse the public site to start collecting data.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {data.topPaths.map((row, i) => (
              <li
                key={row.path}
                className="flex items-center justify-between gap-3 py-2.5 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-medium",
                      i < 3
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="truncate font-mono text-xs sm:text-sm">
                    {row.path}
                  </span>
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {row.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
