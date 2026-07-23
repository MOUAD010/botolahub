import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import type { Standing } from "@/lib/types";
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

export async function StandingsTable({
  standings,
  locale,
  highlightTeamSlug,
}: {
  standings: Standing[];
  locale: string;
  highlightTeamSlug?: string;
}) {
  const t = await getTranslations({ locale, namespace: "standings" });
  const hasContinental = standings.some((s) => s.zone === "continental");
  const hasRelegation = standings.some((s) => s.zone === "relegation");

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <Table
        className="min-w-[640px]"
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
            const highlighted = highlightTeamSlug === row.team.slug;
            return (
            <TableRow
              key={row.team.id}
              className={cn(
                highlighted && "bg-primary/10 hover:bg-primary/15"
              )}
            >
              <TableCell
                className={cn(
                  "sticky inset-s-0 z-10 pe-4 before:absolute before:inset-y-0 before:inset-s-0 before:w-1",
                  highlighted ? "bg-primary/10" : "bg-background",
                  row.zone && zoneBarClass[row.zone],
                  highlighted && "before:bg-primary"
                )}
              >
                <Link
                  href={`/team/${row.team.slug}`}
                  className="flex cursor-pointer items-center gap-2 rounded-sm ps-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    className={cn(
                      "w-4 shrink-0 text-xs font-semibold",
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
                    width={22}
                    height={22}
                    className="size-[22px] shrink-0"
                  />
                  <span
                    className={cn(
                      "truncate font-medium",
                      highlighted ? "font-bold text-primary" : "text-foreground"
                    )}
                  >
                    {row.team.name}
                  </span>
                  {row.zone && (
                    <span className="sr-only">
                      {row.zone === "continental"
                        ? t("continental")
                        : t("relegation")}
                    </span>
                  )}
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
              <TableCell
                className={cn(
                  "text-center font-bold tabular-nums",
                  highlighted && "text-primary"
                )}
              >
                {row.points}
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
