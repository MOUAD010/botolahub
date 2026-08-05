import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guard";
import {
  getAdNetworkSettings,
  upsertAdNetworkSettings,
} from "@/lib/repositories/ads";

const placementSchema = z.enum([
  "header-leaderboard",
  "sidebar-rectangle",
  "in-feed",
  "footer-banner",
]);

const settingsSchema = z.object({
  kind: z.literal("settings").optional(),
  provider: z.enum(["none", "adsense", "custom"]),
  enabled: z.boolean(),
  publisherId: z.string().max(80).optional().nullable(),
  scriptUrl: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .or(z.literal(""))
    .refine((v) => !v || v.startsWith("https://"), {
      message: "scriptUrl must be https",
    }),
  slots: z
    .array(
      z.object({
        placement: placementSchema,
        unitId: z.string().max(80),
        enabled: z.boolean(),
      })
    )
    .optional(),
});

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const settings = await getAdNetworkSettings();
  return NextResponse.json({ settings });
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid settings", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const settings = await upsertAdNetworkSettings(parsed.data);
  return NextResponse.json({ settings });
}
