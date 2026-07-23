import { StatBar } from "./StatBar";

export function StatsComparisonRow({
  label,
  homeValue,
  awayValue,
  suffix = "",
}: {
  label: string;
  homeValue: number;
  awayValue: number;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="w-12 shrink-0 font-semibold tabular-nums text-foreground">
          {homeValue}
          {suffix}
        </span>
        <span className="min-w-0 flex-1 truncate text-center text-muted-foreground">
          {label}
        </span>
        <span className="w-12 shrink-0 text-end font-semibold tabular-nums text-foreground">
          {awayValue}
          {suffix}
        </span>
      </div>
      <StatBar homeValue={homeValue} awayValue={awayValue} />
    </div>
  );
}
