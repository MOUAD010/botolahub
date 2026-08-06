import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guard";
import {
  createAdCreative,
  deleteAdCreative,
  getAdNetworkSettings,
  listAdCreatives,
  updateAdCreative,
  upsertAdNetworkSettings,
} from "@/lib/repositories/ads";

const placementSchema = z.enum([
  "header-leaderboard",
  "sidebar-rectangle",
  "in-feed",
  "footer-banner",
]);

const settingsSchema = z.object({
  kind: z.literal("settings"),
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

const creativeFieldsSchema = z.object({
  name: z.string().trim().min(1).max(120),
  placement: placementSchema,
  enabled: z.boolean().optional(),
  imageUrl: z.string().max(500).optional().nullable().or(z.literal("")),
  clickUrl: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .or(z.literal(""))
    .refine(
      (v) =>
        !v ||
        v.startsWith("http://") ||
        v.startsWith("https://") ||
        v.startsWith("/"),
      {
        message: "clickUrl must be http(s) or a site path",
      }
    ),
  htmlSnippet: z.string().max(20_000).optional().nullable().or(z.literal("")),
  sortOrder: z.number().int().min(0).max(999).optional(),
  startsAt: z.string().optional().nullable().or(z.literal("")),
  endsAt: z.string().optional().nullable().or(z.literal("")),
});

const createCreativeSchema = creativeFieldsSchema
  .extend({
    kind: z.literal("creative"),
  })
  .refine((v) => Boolean(v.imageUrl?.trim() || v.htmlSnippet?.trim()), {
    message: "Provide an image or an HTML snippet",
  });

const updateCreativeSchema = creativeFieldsSchema.partial().extend({
  kind: z.literal("creative"),
  id: z.string().uuid(),
});

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const [settings, creatives] = await Promise.all([
    getAdNetworkSettings(),
    listAdCreatives(),
  ]);
  return NextResponse.json({ settings, creatives });
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const kind = (body as { kind?: string }).kind;
  if (kind === "creative") {
    const parsed = createCreativeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid creative", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { kind: _kind, ...input } = parsed.data;
    const creative = await createAdCreative(input);
    return NextResponse.json({ creative }, { status: 201 });
  }

  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid settings", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { kind: _kind, ...input } = parsed.data;
  const settings = await upsertAdNetworkSettings(input);
  return NextResponse.json({ settings });
}

export async function PUT(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = updateCreativeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid creative", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id, kind: _kind, ...input } = parsed.data;
  const creative = await updateAdCreative(id, input);
  if (!creative) {
    return NextResponse.json({ error: "Creative not found" }, { status: 404 });
  }
  return NextResponse.json({ creative });
}

export async function DELETE(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const ok = await deleteAdCreative(id);
  if (!ok) {
    return NextResponse.json({ error: "Creative not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
