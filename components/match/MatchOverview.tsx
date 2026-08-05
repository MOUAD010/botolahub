import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import { formatKickoffTime, formatMatchdayDate } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/routing";
import type {
  Lineup,
  Match,
  MatchTimelineEvent,
  Standing,
} from "@/lib/types";
import { FormBadges } from "@/components/standings/FormBadges";
import { MatchCard } from "@/components/match/MatchCard";
import { cn } from "@/lib/utils";

export function MatchOverview({
  match,
  locale,
  homeStanding,
  awayStanding,
  homeLineup,
  awayLineup,
  timeline,
  homeRecent,
  awayRecent,
  previousMeetings,
  labels,
}: {
  match: Match;
  locale: Locale;
  homeStanding: Standing | null;
  awayStanding: Standing | null;
  homeLineup?: Lineup | null;
  awayLineup?: Lineup | null;
  timeline: MatchTimelineEvent[];
  homeRecent: Match[];
  awayRecent: Match[];
  previousMeetings: Match[];
  labels: {
    matchInfo: string;
    matchday: string;
    venue: string;
    kickoff: string;
    timeline: string;
    noEvents: string;
    teamComparison: string;
    position: string;
    points: string;
    played: string;
    won: string;
    drawn: string;
    lost: string;
    goalsFor: string;
    goalsAgainst: string;
    form: string;
    formations: string;
    coach: string;
    recentForm: string;
    previousMeetings: string;
    noPreviousMeetings: string;
    goal: string;
    penalty: string;
    ownGoal: string;
    yellowCard: string;
    redCard: string;
    substitution: string;
  };
}) {
  const kickoffDate = formatMatchdayDate(match.kickoff, locale);
  const kickoffTime = formatKickoffTime(match.kickoff, locale);

  return (
    <div className="flex flex-col gap-6">
      {/* Match info */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <InfoTile label={labels.matchday} value={String(match.matchday)} />
        <InfoTile label={labels.kickoff} value={`${kickoffDate} · ${kickoffTime}`} />
        <InfoTile
          label={labels.venue}
          value={match.venue || "—"}
          className="col-span-2 sm:col-span-2"
        />
      </section>

      {/* Team comparison */}
      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          {labels.teamComparison}
        </h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-border bg-muted/30 px-4 py-3">
            <TeamHead team={match.homeTeam} align="end" />
            <span className="text-xs font-medium text-muted-foreground">vs</span>
            <TeamHead team={match.awayTeam} align="start" />
          </div>

          <ComparisonRow
            label={labels.position}
            home={homeStanding?.position}
            away={awayStanding?.position}
            emphasize="lower"
          />
          <ComparisonRow
            label={labels.points}
            home={homeStanding?.points}
            away={awayStanding?.points}
            emphasize="higher"
          />
          <ComparisonRow
            label={labels.played}
            home={homeStanding?.played}
            away={awayStanding?.played}
          />
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-border px-4 py-2.5 last:border-0">
            <p className="text-end text-sm tabular-nums text-foreground">
              {homeStanding
                ? `${homeStanding.won}-${homeStanding.drawn}-${homeStanding.lost}`
                : "—"}
            </p>
            <p className="min-w-16 text-center text-xs font-medium text-muted-foreground">
              {labels.won}/{labels.drawn}/{labels.lost}
            </p>
            <p className="text-start text-sm tabular-nums text-foreground">
              {awayStanding
                ? `${awayStanding.won}-${awayStanding.drawn}-${awayStanding.lost}`
                : "—"}
            </p>
          </div>
          <ComparisonRow
            label={`${labels.goalsFor}:${labels.goalsAgainst}`}
            home={
              homeStanding
                ? `${homeStanding.goalsFor}:${homeStanding.goalsAgainst}`
                : undefined
            }
            away={
              awayStanding
                ? `${awayStanding.goalsFor}:${awayStanding.goalsAgainst}`
                : undefined
            }
          />
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3">
            <div className="flex justify-end">
              {homeStanding && (
                <FormBadges form={homeStanding.form.slice(-5)} label={labels.form} />
              )}
            </div>
            <p className="min-w-16 text-center text-xs font-medium text-muted-foreground">
              {labels.form}
            </p>
            <div className="flex justify-start">
              {awayStanding && (
                <FormBadges form={awayStanding.form.slice(-5)} label={labels.form} />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Formations + coaches */}
      {(homeLineup || awayLineup) && (
        <section>
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            {labels.formations}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormationCard
              team={match.homeTeam}
              lineup={homeLineup}
              coachLabel={labels.coach}
            />
            <FormationCard
              team={match.awayTeam}
              lineup={awayLineup}
              coachLabel={labels.coach}
            />
          </div>
        </section>
      )}

      {/* Timeline */}
      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          {labels.timeline}
        </h2>
        {timeline.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {labels.noEvents}
          </p>
        ) : (
          <MatchTimeline
            events={timeline}
            homeShort={match.homeTeam.shortName}
            awayShort={match.awayTeam.shortName}
            labels={labels}
          />
        )}
      </section>

      {/* Recent form */}
      {(homeRecent.length > 0 || awayRecent.length > 0) && (
        <section>
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            {labels.recentForm}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <RecentList
              team={match.homeTeam}
              matches={homeRecent}
              emptyLabel={labels.noEvents}
            />
            <RecentList
              team={match.awayTeam}
              matches={awayRecent}
              emptyLabel={labels.noEvents}
            />
          </div>
        </section>
      )}

      {/* Previous meetings */}
      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          {labels.previousMeetings}
        </h2>
        {previousMeetings.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {labels.noPreviousMeetings}
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {previousMeetings.slice(0, 5).map((m) => (
              <MatchCard key={m.id} match={m} variant="row" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function InfoTile({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card px-3 py-3",
        className
      )}
    >
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}

function TeamHead({
  team,
  align,
}: {
  team: Match["homeTeam"];
  align: "start" | "end";
}) {
  return (
    <Link
      href={`/team/${team.slug}`}
      className={cn(
        "flex min-w-0 items-center gap-2",
        align === "end" && "flex-row-reverse text-end"
      )}
    >
      <Image
        src={team.badgeUrl}
        alt={team.name}
        width={28}
        height={28}
        className="size-7 shrink-0"
      />
      <span className="truncate text-sm font-semibold text-foreground">
        {team.shortName}
      </span>
    </Link>
  );
}

function ComparisonRow({
  label,
  home,
  away,
  emphasize,
}: {
  label: string;
  home?: string | number | null;
  away?: string | number | null;
  emphasize?: "higher" | "lower";
}) {
  const h = home ?? "—";
  const a = away ?? "—";
  let homeWin = false;
  let awayWin = false;
  if (
    emphasize &&
    typeof home === "number" &&
    typeof away === "number" &&
    home !== away
  ) {
    if (emphasize === "higher") {
      homeWin = home > away;
      awayWin = away > home;
    } else {
      homeWin = home < away;
      awayWin = away < home;
    }
  }

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-border px-4 py-2.5 last:border-0">
      <p
        className={cn(
          "text-end text-sm tabular-nums",
          homeWin ? "font-bold text-foreground" : "text-foreground"
        )}
      >
        {h}
      </p>
      <p className="min-w-16 text-center text-xs font-medium text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "text-start text-sm tabular-nums",
          awayWin ? "font-bold text-foreground" : "text-foreground"
        )}
      >
        {a}
      </p>
    </div>
  );
}

function FormationCard({
  team,
  lineup,
  coachLabel,
}: {
  team: Match["homeTeam"];
  lineup?: Lineup | null;
  coachLabel: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Image
          src={team.badgeUrl}
          alt={team.name}
          width={24}
          height={24}
          className="size-6"
        />
        <span className="text-sm font-semibold text-foreground">
          {team.shortName}
        </span>
        <span className="ms-auto rounded-md bg-muted px-2 py-0.5 font-mono text-sm font-bold tabular-nums text-foreground">
          {lineup?.formation ?? "—"}
        </span>
      </div>
      {lineup?.coachName && (
        <p className="mt-2 text-xs text-muted-foreground">
          {coachLabel}:{" "}
          <span className="font-medium text-foreground">{lineup.coachName}</span>
        </p>
      )}
    </div>
  );
}

function formatMinute(e: MatchTimelineEvent): string {
  if (e.extraMinute) return `${e.minute}+${e.extraMinute}'`;
  return `${e.minute}'`;
}

function MatchTimeline({
  events,
  homeShort,
  awayShort,
  labels,
}: {
  events: MatchTimelineEvent[];
  homeShort: string;
  awayShort: string;
  labels: {
    goal: string;
    penalty: string;
    ownGoal: string;
    yellowCard: string;
    redCard: string;
    substitution: string;
  };
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid grid-cols-[1fr_3.5rem_1fr] border-b border-border bg-muted/30 px-3 py-2 text-center text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        <span className="text-end">{homeShort}</span>
        <span />
        <span className="text-start">{awayShort}</span>
      </div>
      <ul className="relative divide-y divide-border/60">
        <div
          aria-hidden
          className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border"
        />
        {events.map((e, i) => {
          const isHome = e.side === "home";
          return (
            <li
              key={`${e.minute}-${e.kind}-${e.playerName}-${i}`}
              className="relative grid grid-cols-[1fr_3.5rem_1fr] items-center gap-2 px-3 py-2.5"
            >
              <div className={cn(!isHome && "invisible")}>
                {isHome && <EventLabel event={e} labels={labels} align="end" />}
              </div>
              <div className="relative z-10 flex flex-col items-center justify-center">
                <EventIcon kind={e.kind} />
                <span className="mt-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
                  {formatMinute(e)}
                </span>
              </div>
              <div className={cn(isHome && "invisible")}>
                {!isHome && (
                  <EventLabel event={e} labels={labels} align="start" />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function EventIcon({ kind }: { kind: MatchTimelineEvent["kind"] }) {
  if (kind === "goal") {
    return (
      <span
        className="flex size-6 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white"
        title="Goal"
      >
        G
      </span>
    );
  }
  if (kind === "yellow") {
    return (
      <span
        className="size-4 rounded-sm bg-amber-400 shadow-sm"
        title="Yellow card"
      />
    );
  }
  if (kind === "red") {
    return (
      <span
        className="size-4 rounded-sm bg-red-500 shadow-sm"
        title="Red card"
      />
    );
  }
  if (kind === "subst") {
    return (
      <span
        className="flex size-6 items-center justify-center rounded-full bg-sky-500/15 text-[10px] font-bold text-sky-400"
        title="Substitution"
      >
        ⇅
      </span>
    );
  }
  return (
    <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground">
      VAR
    </span>
  );
}

function EventLabel({
  event,
  labels,
  align,
}: {
  event: MatchTimelineEvent;
  labels: {
    goal: string;
    penalty: string;
    ownGoal: string;
    yellowCard: string;
    redCard: string;
    substitution: string;
  };
  align: "start" | "end";
}) {
  let detail = "";
  if (event.kind === "goal") {
    if (event.detail === "Penalty") detail = labels.penalty;
    else if (event.detail === "Own Goal") detail = labels.ownGoal;
    else detail = labels.goal;
  } else if (event.kind === "yellow") detail = labels.yellowCard;
  else if (event.kind === "red") detail = labels.redCard;
  else if (event.kind === "subst") detail = labels.substitution;

  const primary =
    event.kind === "subst" && event.secondaryName
      ? event.secondaryName
      : event.playerName;
  const secondary =
    event.kind === "subst" && event.secondaryName
      ? event.playerName
      : event.secondaryName;

  return (
    <div className={cn("min-w-0", align === "end" ? "text-end" : "text-start")}>
      <p className="truncate text-sm font-medium text-foreground">{primary}</p>
      <p className="truncate text-[11px] text-muted-foreground">
        {detail}
        {secondary ? ` · ${secondary}` : ""}
      </p>
    </div>
  );
}

function RecentList({
  team,
  matches,
  emptyLabel,
}: {
  team: Match["homeTeam"];
  matches: Match[];
  emptyLabel: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <Image
          src={team.badgeUrl}
          alt={team.name}
          width={20}
          height={20}
          className="size-5"
        />
        <span className="text-sm font-semibold text-foreground">
          {team.shortName}
        </span>
      </div>
      {matches.length === 0 ? (
        <p className="p-4 text-center text-xs text-muted-foreground">
          {emptyLabel}
        </p>
      ) : (
        matches.map((m) => <MatchCard key={m.id} match={m} variant="row" />)
      )}
    </div>
  );
}
