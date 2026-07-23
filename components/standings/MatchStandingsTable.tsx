import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import type { Match, Standing } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormBadges } from "./FormBadges";
import { cn } from "@/lib/utils";

const zoneBarClass: Record<"continental" | "relegation", string> = {
  continental: "before:bg-success",
  relegation: "before:bg-destructive",
};

function formatGoalDifference(diff: number): string {
  return diff > 0 ? `+${diff}` : `${diff}`;
}

function pointsFromMatch(match: Match, teamSlug: string): number {
  if (
    match.status !== "finished" ||
    match.homeScore == null ||
    match.awayScore == null
  ) {
    return 0;
  }
  const isHome = match.homeTeam.slug === teamSlug;
  const forScore = isHome ? match.homeScore : match.awayScore;
  const against = isHome ? match.awayScore : match.homeScore;
  if (forScore > against) return 3;
  if (forScore === against) return 1;
  return 0;
}

export async function MatchStandingsTable({
  standings,
  match,
  locale,
}: {
  standings: Standing[];
  match: Match;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: "standings" });
  const hasContinental = standings.some((s) => s.zone === "continental");
  const hasRelegation = standings.some((s) => s.zone === "relegation");

  const highlightSlugs = new Set([
    match.homeTeam.slug,
    match.awayTeam.slug,
  ]);

  const showDelta = match.status === "finished";

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <Table
        className="min-w-[680px]"
        containerClassName="max-h-[75vh] rounded-lg border border-border"
      >
        <TableHeader>
          <TableRow className="hover:bg-background">
            <TableHead className="sticky inset-s-0 top-0 z-20 bg-background pe-4">
              {t("team")}
            </TableHead>
            <TableHead className="sticky top-0 z-10 bg-background text-center">
              {t("played")}
            </TableHead>
            <TableHead className="sticky top-0 z-10 bg-background text-center">
              {t("won")}
            </TableHead>
            <TableHead className="sticky top-0 z-10 bg-background text-center">
              {t("drawn")}
            </TableHead>
            <TableHead className="sticky top-0 z-10 bg-background text-center">
              {t("lost")}
            </TableHead>
            <TableHead className="sticky top-0 z-10 bg-background text-center">
              {t("goalsFor")}
            </TableHead>
            <TableHead className="sticky top-0 z-10 bg-background text-center">
              {t("goalsAgainst")}
            </TableHead>
            <TableHead className="sticky top-0 z-10 bg-background text-center">
              {t("goalDifference")}
            </TableHead>
            <TableHead className="sticky top-0 z-10 bg-background text-center font-bold">
              {t("points")}
            </TableHead>
            <TableHead className="sticky top-0 z-10 bg-background text-center">
              {t("form")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((row) => {
            const highlighted = highlightSlugs.has(row.team.slug);
            const gained = showDelta
              ? pointsFromMatch(match, row.team.slug)
              : 0;
            const pointsBefore = showDelta && highlighted
              ? Math.max(0, row.points - gained)
              : row.points;
            const pointsAfter = row.points;
            const pointsChanged =
              highlighted && showDelta && pointsBefore !== pointsAfter;

            return (
              <TableRow
                key={row.team.id}
                className={cn(
                  highlighted &&
                    "bg-primary/15 ring-1 ring-inset ring-primary/40 hover:bg-primary/20"
                )}
              >
                <TableCell
                  className={cn(
                    "sticky inset-s-0 z-10 pe-4 before:absolute before:inset-y-0 before:inset-s-0 before:w-1.5",
                    highlighted ? "bg-primary/15" : "bg-background",
                    row.zone && !highlighted && zoneBarClass[row.zone],
                    highlighted && "before:bg-primary"
                  )}
                >
                  <Link
                    href={`/team/${row.team.slug}`}
                    className="flex cursor-pointer items-center gap-2 rounded-sm ps-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span
                      className={cn(
                        "w-5 shrink-0 text-sm font-semibold tabular-nums",
                        highlighted
                          ? "font-bold text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      {row.position}
                    </span>
                    <Image
                      src={row.team.badgeUrl}
                      alt={row.team.name}
                      width={24}
                      height={24}
                      className="size-6 shrink-0"
                    />
                    <span
                      className={cn(
                        "truncate font-medium",
                        highlighted
                          ? "font-bold text-foreground"
                          : "text-foreground"
                      )}
                    >
                      {row.team.name}
                    </span>
                  </Link>
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {row.played}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {row.won}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {row.drawn}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {row.lost}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {row.goalsFor}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {row.goalsAgainst}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  <span dir="ltr" className="inline-block">
                    {formatGoalDifference(row.goalsFor - row.goalsAgainst)}
                  </span>
                </TableCell>
                <TableCell className="text-center font-bold tabular-nums">
                  {pointsChanged ? (
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <span className="text-muted-foreground line-through decoration-muted-foreground/60">
                        {pointsBefore}
                      </span>
                      <span aria-hidden className="text-muted-foreground">
                        →
                      </span>
                      <span className="text-base font-bold text-red-600 dark:text-red-400">
                        {pointsAfter}
                      </span>
                      {gained > 0 && (
                        <span className="rounded bg-red-600/15 px-1 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400">
                          +{gained}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className={cn(highlighted && "text-primary")}>
                      {pointsAfter}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <FormBadges
                    form={row.form}
                    label={t("form")}
                    className="justify-center"
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {(hasContinental || hasRelegation) && (
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
          {hasContinental && (
            <li className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="inline-block h-3 w-1.5 rounded-sm bg-success"
              />
              {t("continental")}
            </li>
          )}
          {hasRelegation && (
            <li className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="inline-block h-3 w-1.5 rounded-sm bg-destructive"
              />
              {t("relegation")}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
