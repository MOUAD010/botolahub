import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guard";
import {
  listLocalMedia,
  repullAllMedia,
} from "@/lib/api-football/media";

const postSchema = z.object({
  action: z.enum(["repull"]),
});

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const inventory = await listLocalMedia();
    return NextResponse.json(inventory);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list media" },
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

  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await repullAllMedia();
    const inventory = await listLocalMedia();
    return NextResponse.json({ result, inventory });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Repull failed" },
      { status: 500 }
    );
  }
}
