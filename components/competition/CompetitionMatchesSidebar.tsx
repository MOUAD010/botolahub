"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { formatKickoffTime, formatMatchdayDate } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/routing";
import type { Match } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CompetitionMatchesSidebar({
  matches,
  labels,
}: {
  matches: Match[];
  labels: {
    matches: string;
    byRound: string;
    byDate: string;
    round: string;
    finished: string;
    live: string;
    featured: string;
  };
}) {
  const locale = useLocale() as Locale;
  const matchdays = useMemo(() => {
    const days = Array.from(new Set(matches.map((m) => m.matchday))).sort(
      (a, b) => a - b
    );
    return days.length > 0 ? days : [1];
  }, [matches]);

  const defaultDay = matchdays[matchdays.length - 1]!;
  const [mode, setMode] = useState<"round" | "date">("round");
  const [roundIndex, setRoundIndex] = useState(
    Math.max(0, matchdays.indexOf(defaultDay))
  );

  const currentRound = matchdays[roundIndex] ?? defaultDay;
  const featured =
    matches.find((m) => m.status === "live") ??
    matches.find((m) => m.status === "finished") ??
    matches[0];

  const roundMatches = matches.filter((m) => m.matchday === currentRound);

  return (
    <aside className="flex flex-col gap-4">
      {featured && (
        <FeaturedMatchCard
          match={featured}
          locale={locale}
          labels={labels}
          heading={labels.featured}
        />
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-base font-semibold text-foreground">
            {labels.matches}
          </h2>
        </div>

        <div className="flex gap-1 border-b border-border p-2">
          <ModeChip
            active={mode === "date"}
            onClick={() => setMode("date")}
            label={labels.byDate}
          />
          <ModeChip
            active={mode === "round"}
            onClick={() => setMode("round")}
            label={labels.byRound}
          />
        </div>

        {mode === "round" && (
          <div className="flex items-center gap-1 border-b border-border px-2 py-2">
            <Button
              variant="ghost"
              size="icon-sm"
              className="cursor-pointer"
              onClick={() => setRoundIndex((i) => Math.max(0, i - 1))}
              disabled={roundIndex <= 0}
              aria-label="Previous"
            >
              <ChevronLeft className="size-4 rtl:rotate-180" />
            </Button>
            <span className="flex-1 text-center text-sm font-medium text-foreground">
              {labels.round} {currentRound}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              className="cursor-pointer"
              onClick={() =>
                setRoundIndex((i) => Math.min(matchdays.length - 1, i + 1))
              }
              disabled={roundIndex >= matchdays.length - 1}
              aria-label="Next"
            >
              <ChevronRight className="size-4 rtl:rotate-180" />
            </Button>
          </div>
        )}

        <ul className="flex max-h-[28rem] flex-col divide-y divide-border overflow-y-auto">
          {(mode === "round" ? roundMatches : matches).map((match) => (
            <li key={match.id}>
              <Link
                href={`/match/${match.slug}`}
                className="flex cursor-pointer items-center gap-2.5 px-3 py-3 transition-colors hover:bg-muted/50"
              >
                <div className="w-12 shrink-0 text-center text-xs tabular-nums text-muted-foreground">
                  {match.status === "live" ? (
                    <span className="font-semibold text-live">
                      {match.minute}&apos;
                    </span>
                  ) : match.status === "finished" ? (
                    <span>FT</span>
                  ) : (
                    <span>{formatKickoffTime(match.kickoff, locale)}</span>
                  )}
                  <div className="mt-0.5 text-[10px] leading-tight">
                    {formatMatchdayDate(match.kickoff, locale)}
                  </div>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <MiniTeam
                    name={match.homeTeam.shortName}
                    badge={match.homeTeam.badgeUrl}
                    score={match.homeScore}
                    showScore={match.status !== "upcoming"}
                  />
                  <MiniTeam
                    name={match.awayTeam.shortName}
                    badge={match.awayTeam.badgeUrl}
                    score={match.awayScore}
                    showScore={match.status !== "upcoming"}
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

function ModeChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}

function FeaturedMatchCard({
  match,
  locale,
  labels,
  heading,
}: {
  match: Match;
  locale: Locale;
  labels: { finished: string; live: string };
  heading: string;
}) {
  const status =
    match.status === "live"
      ? `${labels.live} ${match.minute}'`
      : match.status === "finished"
        ? labels.finished
        : formatKickoffTime(match.kickoff, locale);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-2.5 text-sm font-semibold text-foreground">
        {heading}
      </div>
      <Link
        href={`/match/${match.slug}`}
        className="flex cursor-pointer flex-col gap-3 p-4 transition-colors hover:bg-muted/40"
      >
        <div className="text-xs text-muted-foreground">
          {formatMatchdayDate(match.kickoff, locale)} · {status}
        </div>
        <div className="flex items-center justify-between gap-3">
          <FeaturedTeam
            name={match.homeTeam.shortName}
            badge={match.homeTeam.badgeUrl}
          />
          <div className="text-center">
            {match.status === "upcoming" ? (
              <span className="text-lg font-semibold text-foreground">vs</span>
            ) : (
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {match.homeScore} – {match.awayScore}
              </span>
            )}
          </div>
          <FeaturedTeam
            name={match.awayTeam.shortName}
            badge={match.awayTeam.badgeUrl}
          />
        </div>
      </Link>
    </div>
  );
}

function FeaturedTeam({ name, badge }: { name: string; badge: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
      <Image src={badge} alt={name} width={40} height={40} className="size-10" />
      <span className="line-clamp-2 text-center text-sm font-medium text-foreground">
        {name}
      </span>
    </div>
  );
}

function MiniTeam({
  name,
  badge,
  score,
  showScore,
}: {
  name: string;
  badge: string;
  score: number | null;
  showScore: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <Image
          src={badge}
          alt=""
          width={18}
          height={18}
          className="size-[18px]"
        />
        <span className="truncate text-sm text-foreground">{name}</span>
      </div>
      {showScore && (
        <span className="text-sm font-bold tabular-nums text-foreground">
          {score}
        </span>
      )}
    </div>
  );
}
