import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guard";
import {
  getApiQuota,
  getLatestSyncRuns,
  runSyncJob,
  type SyncJob,
} from "@/lib/api-football/sync";

const bodySchema = z.object({
  job: z.enum([
    "catalog",
    "standings",
    "fixtures",
    "squads",
    "live",
    "topscorers",
    "full",
    "match-detail",
  ]),
  fixtureApiId: z.number().int().positive().optional(),
});

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const [quota, runs] = await Promise.all([
      getApiQuota().catch(() => null),
      getLatestSyncRuns(30),
    ]);
    return NextResponse.json({
      quota,
      runs: runs.map((r) => ({
        id: r.id,
        kind: r.kind,
        status: r.status,
        requestsUsed: r.requestsUsed,
        message: r.message,
        startedAt: r.startedAt.toISOString(),
        finishedAt: r.finishedAt?.toISOString() ?? null,
      })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load sync status" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const job = parsed.data.job as SyncJob;
  try {
    const result = await runSyncJob(job, {
      fixtureApiId: parsed.data.fixtureApiId,
    });
    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sync failed" },
      { status: 500 }
    );
  }
}
