"use client";

import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CompetitionHeader({
  name,
  country,
  season,
  seasonProgress,
  seasonStart,
  seasonEnd,
  favouriteLabel,
  followersLabel,
}: {
  name: string;
  country: string;
  season: string;
  seasonProgress: number;
  seasonStart: string;
  seasonEnd: string;
  favouriteLabel: string;
  followersLabel: string;
}) {
  const progress = Math.min(100, Math.max(0, seasonProgress));

  return (
    <header className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground sm:size-20 sm:text-2xl">
            KL
          </div>
          <div className="min-w-0 flex flex-col gap-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {name}
            </h1>
            <p className="text-sm text-muted-foreground">{followersLabel}</p>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 font-medium text-foreground">
                <span
                  aria-hidden
                  className="inline-block size-3.5 rounded-sm bg-red-600"
                />
                {country}
              </span>
              <span className="rounded-md border border-border bg-background px-2.5 py-1 font-medium text-foreground">
                {season}
              </span>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          className="cursor-pointer gap-2 self-start"
          type="button"
        >
          <Star className="size-4" />
          {favouriteLabel}
        </Button>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground sm:text-sm">
          <span>{seasonStart}</span>
          <span>{seasonEnd}</span>
        </div>
        <div
          className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${progress}%`}
        >
          <div
            className="absolute inset-y-0 inset-s-0 rounded-full bg-foreground"
            style={{ width: `${progress}%` }}
          />
          <span
            className={cn(
              "absolute top-1/2 size-3 -translate-y-1/2 rounded-full border-2 border-background bg-foreground",
              "inset-s-[var(--p)] -translate-x-1/2 rtl:translate-x-1/2"
            )}
            style={{ ["--p" as string]: `${progress}%` }}
          />
        </div>
      </div>
    </header>
  );
}
