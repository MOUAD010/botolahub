import { cn } from "@/lib/utils";
import type { MatchStatus } from "@/lib/types";

export function MatchStatusBadge({
  status,
  label,
  className,
}: {
  status: MatchStatus;
  label: string;
  className?: string;
}) {
  if (status === "live") {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-live/10 px-2 py-0.5 text-xs font-semibold text-live",
          className
        )}
      >
        <span aria-hidden="true" className="relative flex size-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75 motion-reduce:hidden" />
          <span className="relative inline-flex size-1.5 rounded-full bg-live" />
        </span>
        {label}
      </span>
    );
  }

  if (status === "finished") {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground",
          className
        )}
      >
        {label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border border-border px-2 py-0.5 text-xs font-medium text-foreground/70",
        className
      )}
    >
      {label}
    </span>
  );
}
