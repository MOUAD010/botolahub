import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type AdPlacement =
  | "header-leaderboard"
  | "sidebar-rectangle"
  | "in-feed"
  | "footer-banner";

const placementConfig: Record<
  AdPlacement,
  { width: number; height: number; className: string; label: string }
> = {
  "header-leaderboard": {
    width: 728,
    height: 90,
    label: "728×90",
    className: "hidden min-h-[90px] w-full max-w-[728px] xl:flex",
  },
  "sidebar-rectangle": {
    width: 300,
    height: 250,
    label: "300×250",
    className: "hidden min-h-[250px] w-full max-w-[300px] lg:flex",
  },
  "in-feed": {
    width: 320,
    height: 100,
    label: "320×100",
    className: "flex min-h-[100px] w-full",
  },
  "footer-banner": {
    width: 320,
    height: 50,
    label: "320×50 / 728×90",
    className: "flex min-h-[50px] w-full max-w-[728px] sm:min-h-[90px]",
  },
};

export function AdSlot({
  placement,
  className,
}: {
  placement: AdPlacement;
  className?: string;
}) {
  const t = useTranslations("ads");
  const config = placementConfig[placement];

  return (
    <div
      role="complementary"
      aria-label={t("advertisement")}
      data-ad-placement={placement}
      className={cn(
        "mx-auto items-center justify-center rounded-md border border-dashed border-border bg-muted/50 text-xs text-muted-foreground",
        config.className,
        className
      )}
    >
      <span>
        {t("advertisement")} · {config.label}
      </span>
    </div>
  );
}
