"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { displaySeasonRating, ratingTone } from "@/lib/rating";
import type { PitchToken } from "@/lib/formation";
import type { PlayerSeasonStats } from "@/lib/types";
import { PlayerAvatar } from "@/components/player/PlayerAvatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function lastName(fullName: string): string {
  const [first, ...rest] = fullName.split(" ");
  return rest.length > 0 ? rest.join(" ") : first;
}

export function PlayerToken({
  token,
  team,
  seasonStats,
}: {
  token: PitchToken;
  team: "home" | "away";
  seasonStats: PlayerSeasonStats | null;
}) {
  const t = useTranslations("player");
  const tCommon = useTranslations("common");
  const { player } = token;
  const rating = seasonStats
    ? displaySeasonRating(seasonStats)
    : displaySeasonRating({ goals: 0, assists: 0 });

  return (
    <Popover>
      <PopoverTrigger
        style={
          {
            "--x-portrait": `${token.portrait.x}%`,
            "--y-portrait": `${token.portrait.y}%`,
            "--x-landscape": `${token.landscape.x}%`,
            "--y-landscape": `${token.landscape.y}%`,
          } as React.CSSProperties
        }
        className={cn(
          "absolute flex min-w-12 -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center gap-1 rounded-md p-1 outline-none",
          "[--x:var(--x-portrait)] [--y:var(--y-portrait)] lg:[--x:var(--x-landscape)] lg:[--y:var(--y-landscape)]",
          "left-(--x) top-(--y)",
          "focus-visible:ring-2 focus-visible:ring-ring"
        )}
        aria-label={`${player.name}, #${player.shirtNumber}`}
      >
        <span className="relative">
          <PlayerAvatar
            src={player.photoUrl}
            alt={player.name}
            size={40}
            unoptimized={Boolean(player.photoUrl?.startsWith("/media/"))}
            className={cn(
              "ring-2",
              team === "home" ? "ring-primary" : "ring-foreground"
            )}
          />
          <span
            className={cn(
              "absolute -end-1 -top-1 rounded px-1 text-[10px] font-bold tabular-nums",
              ratingTone(rating)
            )}
          >
            {rating.toFixed(1)}
          </span>
        </span>
        <span className="max-w-18 truncate rounded bg-background/85 px-1 text-[11px] font-medium text-foreground shadow-sm sm:max-w-22 sm:text-xs">
          {player.shirtNumber} {lastName(player.name)}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-60">
        <div className="flex items-center gap-3">
          <PlayerAvatar
            src={player.photoUrl}
            alt={player.name}
            size={40}
          />
          <div className="min-w-0">
            <Link
              href={`/player/${player.slug}`}
              className="block cursor-pointer truncate text-base font-semibold text-foreground hover:underline"
            >
              {player.name}
            </Link>
            <p className="text-sm text-muted-foreground">{player.position}</p>
          </div>
        </div>
        {(() => {
          const popRating = seasonStats
            ? displaySeasonRating(seasonStats)
            : displaySeasonRating({ goals: 0, assists: 0 });
          return (
            <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  {t("rating")}
                </dt>
                <dd className="text-base font-bold text-foreground">
                  {popRating.toFixed(1)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  {tCommon("goals")}
                </dt>
                <dd className="text-base font-bold text-foreground">
                  {seasonStats?.goals ?? 0}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  {t("assists")}
                </dt>
                <dd className="text-base font-bold text-foreground">
                  {seasonStats?.assists ?? 0}
                </dd>
              </div>
            </dl>
          );
        })()}
      </PopoverContent>
    </Popover>
  );
}
