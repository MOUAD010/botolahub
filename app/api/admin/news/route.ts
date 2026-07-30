import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guard";
import {
  createNews,
  deleteNews,
  getNewsById,
  listAllNews,
  updateNews,
} from "@/lib/repositories/news";

const localeContent = z.object({
  title: z.string().min(1).max(300),
  excerpt: z.string().min(1).max(1000),
  body: z.string().min(1).max(50000),
});

const localizedOptional = z
  .object({
    fr: z.string().max(300).optional().nullable(),
    ar: z.string().max(300).optional().nullable(),
    en: z.string().max(300).optional().nullable(),
  })
  .optional()
  .nullable();

const upsertSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  status: z.enum(["draft", "published"]),
  publishedAt: z.string().datetime().optional().nullable(),
  coverGradient: z.string().max(120).optional(),
  coverUrl: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .or(z.literal(""))
    .refine(
      (v) =>
        !v ||
        v.startsWith("/") ||
        v.startsWith("http://") ||
        v.startsWith("https://"),
      { message: "coverUrl must be a path or URL" }
    ),
  metaTitle: localizedOptional,
  metaDescription: localizedOptional,
  ogImage: localizedOptional,
  translations: z.object({
    fr: localeContent,
    ar: localeContent,
    en: localeContent,
  }),
  tags: z.array(z.string().min(1).max(60)).max(20).optional(),
  playerIds: z.array(z.string().min(1).max(80)).max(50).optional(),
  matchIds: z.array(z.string().min(1).max(80)).max(50).optional(),
});

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const items = await listAllNews();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const json = await request.json();
  const parsed = upsertSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = {
    ...parsed.data,
    coverUrl: parsed.data.coverUrl || null,
  };

  try {
    const id = await createNews(data);
    const item = await getNewsById(id);
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Create failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const json = await request.json();
  const idSchema = z.object({ id: z.string().uuid() });
  const withId = idSchema.and(upsertSchema).safeParse(json);
  if (!withId.success) {
    return NextResponse.json(
      { error: "Validation failed", details: withId.error.flatten() },
      { status: 400 }
    );
  }

  const { id, ...rest } = withId.data;
  try {
    await updateNews(id, {
      ...rest,
      coverUrl: rest.coverUrl || null,
    });
    const item = await getNewsById(id);
    return NextResponse.json({ item });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id || !z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await deleteNews(id);
  return NextResponse.json({ ok: true });
}
