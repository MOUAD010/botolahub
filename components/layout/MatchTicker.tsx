"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { formatKickoffTime } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/routing";
import type { Match } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MatchTicker({ matches }: { matches: Match[] }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("common");
  const tTicker = useTranslations("ticker");

  if (matches.length === 0) return null;

  // Duplicate for seamless loop
  const strip = [...matches, ...matches];

  return (
    <div
      className="border-b border-border bg-foreground text-background"
      role="region"
      aria-label={tTicker("label")}
    >
      <div className="flex items-stretch">
        <div className="z-10 flex shrink-0 items-center bg-primary px-3 text-xs font-bold tracking-wide text-primary-foreground sm:px-4 sm:text-sm">
          {tTicker("thisWeek")}
        </div>

        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div
            className={cn(
              "flex w-max items-center gap-0 py-1.5",
              "animate-match-ticker motion-reduce:animate-none",
              "hover:[animation-play-state:paused]"
            )}
          >
            {strip.map((match, i) => (
              <TickerItem
                key={`${match.id}-${i}`}
                match={match}
                locale={locale}
                liveLabel={t("live")}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TickerItem({
  match,
  locale,
  liveLabel,
}: {
  match: Match;
  locale: Locale;
  liveLabel: string;
}) {
  const status =
    match.status === "live"
      ? `${match.minute}'`
      : match.status === "finished"
        ? "FT"
        : formatKickoffTime(match.kickoff, locale);

  return (
    <Link
      href={`/match/${match.slug}`}
      className="flex cursor-pointer items-center gap-2 border-e border-background/15 px-4 py-1 text-sm whitespace-nowrap transition-colors hover:bg-background/10"
    >
      <span
        className={cn(
          "min-w-10 text-center text-xs font-semibold tabular-nums",
          match.status === "live" ? "text-emerald-400" : "text-background/70"
        )}
      >
        {status}
      </span>
      <span className="flex items-center gap-1.5">
        <Image
          src={match.homeTeam.badgeUrl}
          alt=""
          width={16}
          height={16}
          className="size-4"
        />
        <span className="font-medium">{match.homeTeam.shortName}</span>
      </span>
      <span className="min-w-8 text-center font-bold tabular-nums">
        {match.status === "upcoming"
          ? "–"
          : `${match.homeScore}–${match.awayScore}`}
      </span>
      <span className="flex items-center gap-1.5">
        <Image
          src={match.awayTeam.badgeUrl}
          alt=""
          width={16}
          height={16}
          className="size-4"
        />
        <span className="font-medium">{match.awayTeam.shortName}</span>
      </span>
      {match.status === "live" && (
        <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">
          {liveLabel}
        </span>
      )}
    </Link>
  );
}
