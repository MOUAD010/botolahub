import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { pageviewsDaily } from "@/lib/db/schema";

const bodySchema = z.object({
  path: z
    .string()
    .min(1)
    .max(500)
    .regex(/^\/[a-zA-Z0-9/_-]*$/),
  locale: z.enum(["fr", "ar", "en"]),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Block admin paths from public analytics
    if (parsed.data.path.startsWith("/admin")) {
      return NextResponse.json({ ok: true });
    }

    const today = new Date().toISOString().slice(0, 10);

    await db
      .insert(pageviewsDaily)
      .values({
        date: today,
        path: parsed.data.path,
        locale: parsed.data.locale,
        count: 1,
      })
      .onConflictDoUpdate({
        target: [
          pageviewsDaily.date,
          pageviewsDaily.path,
          pageviewsDaily.locale,
        ],
        set: { count: sql`${pageviewsDaily.count} + 1` },
      });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to record" }, { status: 500 });
  }
}
