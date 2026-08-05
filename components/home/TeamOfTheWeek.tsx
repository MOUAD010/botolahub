"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { computeTotwTokens } from "@/lib/formation";
import type { Lineup, PlayerSeasonStats } from "@/lib/types";
import { PlayerAvatar } from "@/components/player/PlayerAvatar";
import { ratingTone } from "@/lib/rating";
import { cn } from "@/lib/utils";

export type TotwPayload = {
  lineup: Lineup;
  weekLabel: string;
  statsById: Record<string, PlayerSeasonStats | null>;
};

function lastName(fullName: string): string {
  const parts = fullName.split(" ");
  return parts.length > 1 ? parts[parts.length - 1]! : fullName;
}

export function TeamOfTheWeek({
  pro,
  botola2,
}: {
  pro: TotwPayload | null;
  botola2: TotwPayload | null;
}) {
  const t = useTranslations("home");
  const tNav = useTranslations("nav");
  const [league, setLeague] = useState<"pro" | "b2">(pro ? "pro" : "b2");

  const active = league === "b2" ? botola2 ?? pro : pro ?? botola2;
  if (!active) return null;

  const tokens = computeTotwTokens(active.lineup);
  const showSwitcher = Boolean(pro && botola2);

  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground sm:text-lg">
            {t("teamOfTheWeek")}
          </h2>
          <p className="text-sm text-muted-foreground">{active.weekLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          {showSwitcher ? (
            <div
              className="inline-flex rounded-lg border border-border bg-muted/50 p-0.5"
              role="tablist"
              aria-label={t("totwLeagueSwitcher")}
            >
              <button
                type="button"
                role="tab"
                aria-selected={league === "pro"}
                onClick={() => setLeague("pro")}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  league === "pro"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tNav("botolaPro")}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={league === "b2"}
                onClick={() => setLeague("b2")}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  league === "b2"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tNav("botola2")}
              </button>
            </div>
          ) : null}
          <span className="rounded-md bg-muted px-2.5 py-1 text-sm font-medium tabular-nums text-foreground">
            {active.lineup.formation}
          </span>
        </div>
      </div>

      <div
        className="relative mx-3 my-3 aspect-3/4 w-[calc(100%-1.5rem)] overflow-hidden rounded-lg bg-[#1f6b3a] sm:mx-4 sm:my-4 sm:w-[calc(100%-2rem)] lg:aspect-4/5 lg:max-h-[560px]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0, rgba(255,255,255,0.06) 10%, transparent 10%, transparent 20%)",
        }}
      >
        <TotwPitchMarkings />
        {tokens.map((token) => {
          const stats = active.statsById[token.player.id];
          const rating =
            stats?.averageRating && stats.averageRating > 0
              ? stats.averageRating
              : 6.5;
          return (
            <Link
              key={`${league}-${token.player.id}`}
              href={`/player/${token.player.slug}`}
              style={{
                left: `${token.portrait.x}%`,
                top: `${token.portrait.y}%`,
              }}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center gap-0.5 rounded-md p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="relative">
                <PlayerAvatar
                  src={token.player.photoUrl}
                  alt={token.player.name}
                  size={52}
                  className="ring-2 ring-white/40"
                  unoptimized={Boolean(token.player.photoUrl?.startsWith("/media/"))}
                />
                <span
                  className={cn(
                    "absolute -end-1 -top-1 rounded px-1 py-0.5 text-xs font-bold leading-none tabular-nums",
                    ratingTone(rating)
                  )}
                >
                  {rating.toFixed(1)}
                </span>
              </span>
              <span className="max-w-24 truncate rounded bg-black/60 px-1.5 py-0.5 text-xs font-medium text-white">
                {token.player.shirtNumber} {lastName(token.player.name)}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function TotwPitchMarkings() {
  const line = {
    stroke: "white",
    strokeOpacity: 0.5,
    strokeWidth: 0.4,
    fill: "none",
  } as const;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
    >
      <rect x={2} y={2} width={96} height={96} {...line} />
      <line x1={2} y1={50} x2={98} y2={50} {...line} />
      <circle cx={50} cy={50} r={9} {...line} />
      <circle cx={50} cy={50} r={0.6} fill="white" fillOpacity={0.5} />
      <rect x={25} y={2} width={50} height={14} {...line} />
      <rect x={38} y={2} width={24} height={5} {...line} />
      <rect x={25} y={84} width={50} height={14} {...line} />
      <rect x={38} y={93} width={24} height={5} {...line} />
    </svg>
  );
}
