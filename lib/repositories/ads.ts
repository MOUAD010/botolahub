import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { adSettings } from "@/lib/db/schema";
import {
  AD_PLACEMENTS,
  type AdNetworkProvider,
  type AdNetworkSettings,
  type AdPlacement,
  type AdSlotNetworkConfig,
} from "@/lib/ads-types";

export type { AdNetworkSettings, AdPlacement } from "@/lib/ads-types";

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

export type ResolvedAd =
  | {
      mode: "network";
      provider: AdNetworkProvider;
      publisherId: string;
      unitId: string;
      scriptUrl: string | null;
    }
  | { mode: "empty" };

/** Network unit for a placement, or empty if not configured. */
export async function resolveAdForPlacement(
  placement: AdPlacement
): Promise<ResolvedAd> {
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
