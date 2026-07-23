import { Link } from "@/lib/i18n/navigation";
import type { Player } from "@/lib/types";
import { PlayerAvatar } from "@/components/player/PlayerAvatar";

export function SubsList({
  substitutes,
  heading,
}: {
  substitutes: Player[];
  heading: string;
  team: "home" | "away";
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-base font-semibold text-foreground">{heading}</h3>
      <ul className="flex flex-col gap-1.5">
        {substitutes.map((player) => (
          <li key={player.id}>
            <Link
              href={`/player/${player.slug}`}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5 text-sm hover:bg-muted/60"
            >
              <PlayerAvatar
                src={player.photoUrl}
                alt={player.name}
                size={28}
              />
              <span className="w-6 shrink-0 text-center text-xs font-bold tabular-nums text-muted-foreground">
                {player.shirtNumber}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                {player.name}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {player.position}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
