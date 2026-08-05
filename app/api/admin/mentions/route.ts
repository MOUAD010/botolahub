import { NextResponse } from "next/server";
import { searchMentions } from "@/lib/mentions";
import { requireAdmin } from "@/lib/auth-guard";

export async function GET(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const items = await searchMentions(q);
  return NextResponse.json({ items });
}
