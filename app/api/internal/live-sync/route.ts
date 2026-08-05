import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { runAutoLiveCycle } from "@/lib/api-football/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorized(request: Request): boolean {
  const expected = (process.env.CRON_SECRET || process.env.AUTH_SECRET)?.trim();
  const supplied = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();
  if (!expected || !supplied) return false;

  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  return (
    expectedBuffer.length === suppliedBuffer.length &&
    timingSafeEqual(expectedBuffer, suppliedBuffer)
  );
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runAutoLiveCycle();
  return NextResponse.json(result, {
    status: result.status === "error" ? 500 : 200,
  });
}
