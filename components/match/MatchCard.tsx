import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { formatKickoffTime } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/routing";
import type { Match } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MatchStatusBadge } from "./MatchStatusBadge";

export function MatchCard({
  match,
  variant = "card",
}: {
  match: Match;
  variant?: "card" | "row";
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("common");

  const kickoffLabel = formatKickoffTime(match.kickoff, locale);
  const statusLabel =
    match.status === "live"
      ? `${match.minute}'`
      : match.status === "finished"
        ? t("finished")
        : kickoffLabel;

  const resultLabel =
    match.status === "upcoming"
      ? kickoffLabel
      : `${match.homeScore}–${match.awayScore}`;
  const ariaLabel = `${match.homeTeam.name} ${resultLabel} ${match.awayTeam.name}, ${
    match.status === "live" ? `${t("live")} ${match.minute}'` : statusLabel
  }`;

  if (variant === "row") {
    return (
      <Link
        href={`/match/${match.slug}`}
        aria-label={ariaLabel}
        className="flex cursor-pointer items-stretch gap-3 px-3 py-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <div className="flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 text-center">
          <span
            className={cn(
              "text-xs font-semibold tabular-nums",
              match.status === "live" ? "text-live" : "text-muted-foreground"
            )}
          >
            {match.status === "live"
              ? `${match.minute}'`
              : match.status === "finished"
                ? "FT"
                : kickoffLabel}
          </span>
        </div>
        <div
          className="flex min-w-0 flex-1 flex-col gap-1.5"
          aria-live={match.status === "live" ? "polite" : undefined}
        >
          <TeamRow
            name={match.homeTeam.name}
            badgeUrl={match.homeTeam.badgeUrl}
            score={match.homeScore}
            showScore={match.status !== "upcoming"}
            dense
          />
          <TeamRow
            name={match.awayTeam.name}
            badgeUrl={match.awayTeam.badgeUrl}
            score={match.awayScore}
            showScore={match.status !== "upcoming"}
            dense
          />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/match/${match.slug}`}
      aria-label={ariaLabel}
      className="flex cursor-pointer flex-col gap-2.5 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="hidden min-w-0 items-center gap-1.5 truncate text-sm text-muted-foreground md:flex">
          <span>
            {t("matchday")} {match.matchday}
          </span>
          {match.venue && (
            <>
              <span aria-hidden="true">·</span>
              <span className="truncate">{match.venue}</span>
            </>
          )}
        </span>
        <MatchStatusBadge
          status={match.status}
          label={statusLabel}
          className="ms-auto md:ms-0"
        />
      </div>

      <div
        className="flex flex-col gap-2"
        aria-live={match.status === "live" ? "polite" : undefined}
      >
        <TeamRow
          name={match.homeTeam.name}
          badgeUrl={match.homeTeam.badgeUrl}
          score={match.homeScore}
          showScore={match.status !== "upcoming"}
        />
        <TeamRow
          name={match.awayTeam.name}
          badgeUrl={match.awayTeam.badgeUrl}
          score={match.awayScore}
          showScore={match.status !== "upcoming"}
        />
      </div>
    </Link>
  );
}

function TeamRow({
  name,
  badgeUrl,
  score,
  showScore,
  dense,
}: {
  name: string;
  badgeUrl: string;
  score: number | null;
  showScore: boolean;
  dense?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <Image
          src={badgeUrl}
          alt={name}
          width={dense ? 22 : 28}
          height={dense ? 22 : 28}
          className={cn("shrink-0", dense ? "size-[22px]" : "size-7")}
        />
        <span
          className={cn(
            "truncate font-medium text-foreground",
            dense ? "text-sm" : "text-base"
          )}
        >
          {name}
        </span>
      </div>
      {showScore && (
        <span
          className={cn(
            "shrink-0 font-bold tabular-nums text-foreground",
            dense ? "text-base" : "text-lg"
          )}
        >
          {score}
        </span>
      )}
    </div>
  );
}
