import "server-only";

import { and, asc, desc, eq, isNull, lte, or, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { adCreatives, adSettings } from "@/lib/db/schema";
import {
  AD_PLACEMENTS,
  type AdCreative,
  type AdCreativeInput,
  type AdNetworkProvider,
  type AdNetworkSettings,
  type AdPlacement,
  type AdSlotNetworkConfig,
} from "@/lib/ads-types";

export type {
  AdCreative,
  AdCreativeInput,
  AdNetworkSettings,
  AdPlacement,
} from "@/lib/ads-types";

function mapSettings(
  row: typeof adSettings.$inferSelect | undefined
): AdNetworkSettings {
  const slotsMap = row?.slots ?? {};
  const slots = AD_PLACEMENTS.map((p) => ({
    placement: p.id,
    unitId: slotsMap[p.id]?.unitId ?? "",
    enabled: slotsMap[p.id]?.enabled ?? false,
  }));

  return {
    provider: (row?.provider as AdNetworkProvider) || "none",
    enabled: row?.enabled ?? false,
    publisherId: row?.publisherId ?? null,
    scriptUrl: row?.scriptUrl ?? null,
    slots,
    updatedAt: row?.updatedAt?.toISOString() ?? new Date(0).toISOString(),
  };
}

function mapCreative(row: typeof adCreatives.$inferSelect): AdCreative {
  return {
    id: row.id,
    name: row.name,
    placement: row.placement,
    enabled: row.enabled,
    imageUrl: row.imageUrl,
    clickUrl: row.clickUrl,
    htmlSnippet: row.htmlSnippet,
    sortOrder: row.sortOrder,
    startsAt: row.startsAt?.toISOString() ?? null,
    endsAt: row.endsAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function parseOptionalDate(value?: string | null): Date | null {
  if (!value?.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function getAdNetworkSettings(): Promise<AdNetworkSettings> {
  const [row] = await db
    .select()
    .from(adSettings)
    .where(eq(adSettings.id, "default"))
    .limit(1);
  return mapSettings(row);
}

export async function upsertAdNetworkSettings(input: {
  provider: AdNetworkProvider;
  enabled: boolean;
  publisherId?: string | null;
  scriptUrl?: string | null;
  slots?: AdSlotNetworkConfig[];
}): Promise<AdNetworkSettings> {
  const slotsObj: NonNullable<(typeof adSettings.$inferInsert)["slots"]> = {};
  const slots =
    input.slots ??
    AD_PLACEMENTS.map((p) => ({
      placement: p.id,
      unitId: "",
      enabled: false,
    }));
  for (const s of slots) {
    slotsObj[s.placement] = {
      unitId: s.unitId.trim(),
      enabled: s.enabled,
    };
  }

  const [row] = await db
    .insert(adSettings)
    .values({
      id: "default",
      provider: input.provider,
      enabled: input.enabled,
      publisherId: input.publisherId?.trim() || null,
      scriptUrl: input.scriptUrl?.trim() || null,
      slots: slotsObj,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: adSettings.id,
      set: {
        provider: input.provider,
        enabled: input.enabled,
        publisherId: input.publisherId?.trim() || null,
        scriptUrl: input.scriptUrl?.trim() || null,
        slots: slotsObj,
        updatedAt: new Date(),
      },
    })
    .returning();

  return mapSettings(row);
}

export async function listAdCreatives(): Promise<AdCreative[]> {
  const rows = await db
    .select()
    .from(adCreatives)
    .orderBy(asc(adCreatives.placement), asc(adCreatives.sortOrder), desc(adCreatives.updatedAt));
  return rows.map(mapCreative);
}

export async function createAdCreative(
  input: AdCreativeInput
): Promise<AdCreative> {
  const [row] = await db
    .insert(adCreatives)
    .values({
      name: input.name.trim(),
      placement: input.placement,
      enabled: input.enabled ?? true,
      imageUrl: input.imageUrl?.trim() || null,
      clickUrl: input.clickUrl?.trim() || null,
      htmlSnippet: input.htmlSnippet?.trim() || null,
      sortOrder: input.sortOrder ?? 0,
      startsAt: parseOptionalDate(input.startsAt),
      endsAt: parseOptionalDate(input.endsAt),
      updatedAt: new Date(),
    })
    .returning();
  return mapCreative(row);
}

export async function updateAdCreative(
  id: string,
  input: Partial<AdCreativeInput>
): Promise<AdCreative | null> {
  const patch: Partial<typeof adCreatives.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.placement !== undefined) patch.placement = input.placement;
  if (input.enabled !== undefined) patch.enabled = input.enabled;
  if (input.imageUrl !== undefined) patch.imageUrl = input.imageUrl?.trim() || null;
  if (input.clickUrl !== undefined) patch.clickUrl = input.clickUrl?.trim() || null;
  if (input.htmlSnippet !== undefined) {
    patch.htmlSnippet = input.htmlSnippet?.trim() || null;
  }
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
  if (input.startsAt !== undefined) patch.startsAt = parseOptionalDate(input.startsAt);
  if (input.endsAt !== undefined) patch.endsAt = parseOptionalDate(input.endsAt);

  const [row] = await db
    .update(adCreatives)
    .set(patch)
    .where(eq(adCreatives.id, id))
    .returning();
  return row ? mapCreative(row) : null;
}

export async function deleteAdCreative(id: string): Promise<boolean> {
  const deleted = await db
    .delete(adCreatives)
    .where(eq(adCreatives.id, id))
    .returning({ id: adCreatives.id });
  return deleted.length > 0;
}

async function activeManualsForPlacement(
  placement: AdPlacement
): Promise<AdCreative[]> {
  const now = new Date();
  const rows = await db
    .select()
    .from(adCreatives)
    .where(
      and(
        eq(adCreatives.placement, placement),
        eq(adCreatives.enabled, true),
        or(isNull(adCreatives.startsAt), lte(adCreatives.startsAt, now)),
        or(isNull(adCreatives.endsAt), gte(adCreatives.endsAt, now)),
        or(
          sql`${adCreatives.imageUrl} is not null and ${adCreatives.imageUrl} <> ''`,
          sql`${adCreatives.htmlSnippet} is not null and ${adCreatives.htmlSnippet} <> ''`
        )
      )
    )
    .orderBy(asc(adCreatives.sortOrder), desc(adCreatives.updatedAt));
  return rows.map(mapCreative);
}

export type ResolvedAd =
  | {
      mode: "manual";
      creatives: AdCreative[];
    }
  | {
      mode: "network";
      provider: AdNetworkProvider;
      publisherId: string;
      unitId: string;
      scriptUrl: string | null;
    }
  | { mode: "empty" };

/**
 * Manual creatives win when enabled for a placement; otherwise fall back to
 * the configured network unit. Multiple manuals for one placement rotate
 * every minute on the public site.
 */
export async function resolveAdForPlacement(
  placement: AdPlacement
): Promise<ResolvedAd> {
  const manuals = await activeManualsForPlacement(placement).catch(() => []);
  if (manuals.length > 0) return { mode: "manual", creatives: manuals };

  const settings = await getAdNetworkSettings().catch(() => null);
  if (!settings?.enabled || settings.provider === "none") {
    return { mode: "empty" };
  }

  const slot = settings.slots.find((s) => s.placement === placement);
  if (!slot?.enabled || !slot.unitId.trim()) return { mode: "empty" };
  if (!settings.publisherId?.trim() && settings.provider === "adsense") {
    return { mode: "empty" };
  }

  return {
    mode: "network",
    provider: settings.provider,
    publisherId: settings.publisherId?.trim() || "",
    unitId: slot.unitId.trim(),
    scriptUrl: settings.scriptUrl,
  };
}
