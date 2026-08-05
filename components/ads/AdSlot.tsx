import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import { resolveAdForPlacement, type AdPlacement } from "@/lib/repositories/ads";
import { AdSenseUnit } from "@/components/ads/AdSenseUnit";

export type { AdPlacement } from "@/lib/ads-types";

const placementConfig: Record<
  AdPlacement,
  { width: number; height: number; className: string; label: string; minHeight: number }
> = {
  "header-leaderboard": {
    width: 728,
    height: 90,
    minHeight: 90,
    label: "728×90",
    className: "hidden min-h-[90px] w-full max-w-[728px] xl:flex",
  },
  "sidebar-rectangle": {
    width: 300,
    height: 250,
    minHeight: 250,
    label: "300×250",
    className: "hidden min-h-[250px] w-full max-w-[300px] lg:flex",
  },
  "in-feed": {
    width: 320,
    height: 100,
    minHeight: 100,
    label: "320×100",
    className: "flex min-h-[100px] w-full",
  },
  "footer-banner": {
    width: 320,
    height: 50,
    minHeight: 90,
    label: "320×50 / 728×90",
    className: "flex min-h-[50px] w-full max-w-[728px] sm:min-h-[90px]",
  },
};

export async function AdSlot({
  placement,
  className,
}: {
  placement: AdPlacement;
  className?: string;
}) {
  const t = await getTranslations("ads");
  const config = placementConfig[placement];
  const resolved = await resolveAdForPlacement(placement).catch(
    () => ({ mode: "empty" as const })
  );

  const shellClass = cn(
    "mx-auto items-center justify-center overflow-hidden rounded-md",
    config.className,
    className
  );

  if (resolved.mode === "network" && resolved.provider === "adsense") {
    return (
      <aside
        role="complementary"
        aria-label={t("advertisement")}
        data-ad-placement={placement}
        data-ad-network="adsense"
        className={cn(shellClass, "min-w-0 border border-border bg-card")}
      >
        <AdSenseUnit
          publisherId={resolved.publisherId}
          unitId={resolved.unitId}
          minHeight={config.minHeight}
          loadingLabel={t("loading")}
        />
      </aside>
    );
  }

  if (resolved.mode === "network" && resolved.provider === "custom") {
    return (
      <aside
        role="complementary"
        aria-label={t("advertisement")}
        data-ad-placement={placement}
        data-ad-network="custom"
        data-ad-unit={resolved.unitId}
        className={cn(shellClass, "border border-border bg-card")}
        style={{ minHeight: config.minHeight }}
      >
        <div
          id={`ad-unit-${placement}`}
          data-ad-unit={resolved.unitId}
          className="w-full"
          style={{ minHeight: config.minHeight }}
        />
      </aside>
    );
  }

  return (
    <aside
      role="complementary"
      aria-label={t("advertisement")}
      data-ad-placement={placement}
      className={cn(
        shellClass,
        "border border-dashed border-border bg-muted/40 text-xs text-muted-foreground"
      )}
    >
      <span>
        {t("advertisement")} · {config.label}
      </span>
    </aside>
  );
}
