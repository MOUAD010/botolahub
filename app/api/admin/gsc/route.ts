import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { getSearchConsoleOverview } from "@/lib/seo/gsc";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const result = await getSearchConsoleOverview();
  return NextResponse.json(result);
}
