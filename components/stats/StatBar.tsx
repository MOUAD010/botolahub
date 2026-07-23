export function StatBar({
  homeValue,
  awayValue,
}: {
  homeValue: number;
  awayValue: number;
}) {
  const total = homeValue + awayValue;
  const homePct = total === 0 ? 50 : (homeValue / total) * 100;
  const awayPct = 100 - homePct;

  return (
    <div
      role="presentation"
      className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted"
    >
      <div
        className="h-full bg-primary transition-[width]"
        style={{ width: `${homePct}%` }}
      />
      <div
        className="h-full bg-foreground/60 transition-[width]"
        style={{ width: `${awayPct}%` }}
      />
    </div>
  );
}
