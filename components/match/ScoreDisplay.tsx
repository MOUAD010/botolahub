import { cn } from "@/lib/utils";
import type { MatchStatus } from "@/lib/types";

export function ScoreDisplay({
  homeScore,
  awayScore,
  status,
  className,
}: {
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  className?: string;
}) {
  if (status === "upcoming" || homeScore === null || awayScore === null) {
    return null;
  }

  return (
    <div
      dir="ltr"
      aria-live={status === "live" ? "polite" : undefined}
      className={cn(
        "flex items-center gap-3 text-fluid-score font-bold tabular-nums tracking-tight text-foreground",
        className
      )}
    >
      <span>{homeScore}</span>
      <span aria-hidden="true" className="text-muted-foreground">
        –
      </span>
      <span>{awayScore}</span>
    </div>
  );
}
