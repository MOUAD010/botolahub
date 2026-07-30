import { NextResponse } from "next/server";
import { and, gte, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { pageviewsDaily } from "@/lib/db/schema";
import { getNewsStats } from "@/lib/repositories/news";

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const from30 = daysAgo(29);
  const from7 = daysAgo(6);
  const today = daysAgo(0);

  const [news, daily, topPaths, totals] = await Promise.all([
    getNewsStats(),
    db
      .select({
        date: pageviewsDaily.date,
        count: sql<number>`sum(${pageviewsDaily.count})::int`,
      })
      .from(pageviewsDaily)
      .where(gte(pageviewsDaily.date, from30))
      .groupBy(pageviewsDaily.date)
      .orderBy(pageviewsDaily.date),
    db
      .select({
        path: pageviewsDaily.path,
        count: sql<number>`sum(${pageviewsDaily.count})::int`,
      })
      .from(pageviewsDaily)
      .where(gte(pageviewsDaily.date, from7))
      .groupBy(pageviewsDaily.path)
      .orderBy(sql`sum(${pageviewsDaily.count}) desc`)
      .limit(10),
    db
      .select({
        today: sql<number>`coalesce(sum(${pageviewsDaily.count}) filter (where ${pageviewsDaily.date} = ${today}), 0)::int`,
        last7: sql<number>`coalesce(sum(${pageviewsDaily.count}) filter (where ${pageviewsDaily.date} >= ${from7}), 0)::int`,
        last30: sql<number>`coalesce(sum(${pageviewsDaily.count}) filter (where ${pageviewsDaily.date} >= ${from30}), 0)::int`,
      })
      .from(pageviewsDaily)
      .where(and(gte(pageviewsDaily.date, from30))),
  ]);

  return NextResponse.json({
    news,
    visits: {
      today: totals[0]?.today ?? 0,
      last7: totals[0]?.last7 ?? 0,
      last30: totals[0]?.last30 ?? 0,
    },
    daily: daily.map((d) => ({
      date: String(d.date),
      count: d.count,
    })),
    topPaths,
  });
}
