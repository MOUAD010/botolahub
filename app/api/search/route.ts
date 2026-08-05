import { NextResponse } from "next/server";
import { searchCatalog } from "@/lib/search";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const limit = Math.min(Number(searchParams.get("limit") || 10), 20);
  const results = await searchCatalog(q, limit);
  return NextResponse.json({ results });
}
