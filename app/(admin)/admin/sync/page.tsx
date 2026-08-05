"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SyncJob =
  | "catalog"
  | "standings"
  | "fixtures"
  | "squads"
  | "live"
  | "topscorers"
  | "full";

type Quota = {
  requests?: {
    current?: number;
    limit_day?: number;
  };
  subscription?: { plan?: string; active?: boolean };
} | null;

type SyncRun = {
  id: string;
  kind: string;
  status: string;
  requestsUsed: number;
  message: string | null;
  startedAt: string;
  finishedAt: string | null;
};

const JOBS: Array<{ id: SyncJob; label: string; hint: string }> = [
  { id: "full", label: "Full safe sync", hint: "~25–40 req" },
  { id: "catalog", label: "Catalog", hint: "leagues + teams" },
  { id: "standings", label: "Standings", hint: "2 req" },
  { id: "fixtures", label: "Fixtures", hint: "2 req" },
  { id: "squads", label: "Squads (Pro)", hint: "~16 req" },
  { id: "topscorers", label: "Top scorers", hint: "1 req" },
  { id: "live", label: "Live poll", hint: "match day only" },
];

export default function AdminSyncPage() {
  const [quota, setQuota] = useState<Quota>(null);
  const [runs, setRuns] = useState<SyncRun[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<SyncJob | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/admin/sync/football");
    if (!res.ok) throw new Error("Failed to load sync status");
    const data = (await res.json()) as { quota: Quota; runs: SyncRun[] };
    setQuota(data.quota);
    setRuns(data.runs);
  }, []);

  useEffect(() => {
    void load().catch((e) =>
      setError(e instanceof Error ? e.message : "Error")
    );
  }, [load]);

  async function runJob(job: SyncJob) {
    setPending(job);
    setLastResult(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/sync/football", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      setLastResult(JSON.stringify(data.result, null, 2));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setPending(null);
    }
  }

  const used = quota?.requests?.current;
  const limit = quota?.requests?.limit_day ?? 100;
  const remaining =
    typeof used === "number" ? Math.max(0, limit - used) : null;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Football sync
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pull Botola Pro (200) and Botola 2 (201) into Postgres. Free plan:
            100 API requests/day — never call the API from public pages.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            void load().catch((e) =>
              setError(e instanceof Error ? e.message : "Error")
            )
          }
        >
          <RefreshCw data-icon="inline-start" />
          Refresh status
        </Button>
      </header>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Quota used today
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {typeof used === "number" ? used : "—"}
            <span className="text-base font-normal text-muted-foreground">
              {" "}
              / {limit}
            </span>
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Remaining
          </p>
          <p
            className={cn(
              "mt-2 text-2xl font-semibold tabular-nums",
              remaining !== null && remaining < 20 && "text-destructive"
            )}
          >
            {remaining ?? "—"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Last sync
          </p>
          <p className="mt-2 text-sm font-medium">
            {runs[0]
              ? `${runs[0].kind} · ${runs[0].status}`
              : "No runs yet"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {runs[0]?.startedAt
              ? new Date(runs[0].startedAt).toLocaleString()
              : null}
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold">Jobs</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {JOBS.map((job) => (
            <button
              key={job.id}
              type="button"
              disabled={pending !== null}
              onClick={() => void runJob(job.id)}
              className={cn(
                "flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-start transition-colors",
                "hover:border-primary/40 hover:bg-muted/40 disabled:opacity-60"
              )}
            >
              <span>
                <span className="block text-sm font-medium">{job.label}</span>
                <span className="text-xs text-muted-foreground">{job.hint}</span>
              </span>
              {pending === job.id ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : null}
            </button>
          ))}
        </div>
      </section>

      {lastResult ? (
        <section>
          <h2 className="text-sm font-semibold">Last result</h2>
          <pre className="mt-2 max-h-60 overflow-auto rounded-xl border border-border bg-muted/40 p-3 text-xs">
            {lastResult}
          </pre>
        </section>
      ) : null}

      <section>
        <h2 className="text-sm font-semibold">Recent runs</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[640px] text-start text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Kind</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Requests</th>
                <th className="px-3 py-2 font-medium">Started</th>
                <th className="px-3 py-2 font-medium">Message</th>
              </tr>
            </thead>
            <tbody>
              {runs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center text-muted-foreground"
                  >
                    No sync runs yet. Run catalog or full sync to seed data.
                  </td>
                </tr>
              ) : (
                runs.map((run) => (
                  <tr key={run.id} className="border-t border-border">
                    <td className="px-3 py-2 font-medium">{run.kind}</td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-xs font-medium",
                          run.status === "ok" &&
                            "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
                          run.status === "error" &&
                            "bg-destructive/15 text-destructive",
                          run.status === "running" &&
                            "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                        )}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {run.requestsUsed}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {new Date(run.startedAt).toLocaleString()}
                    </td>
                    <td className="max-w-xs truncate px-3 py-2 text-muted-foreground">
                      {run.message}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
