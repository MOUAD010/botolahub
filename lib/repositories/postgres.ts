import { and, asc, desc, eq, gte, inArray, lte, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  competitionTeams,
  competitions,
  fixtureDetails,
  fixtures,
  playerSeasonStats,
  players,
  standingsRows,
  teams,
} from "@/lib/db/schema";
import {
  BOTOLA_2,
  BOTOLA_PRO,
  CURRENT_SEASON,
} from "@/lib/api-football/constants";
import { displaySeasonRating } from "@/lib/rating";
import { parseForm } from "@/lib/api-football/utils";
import { ensureMedia, mediaPublicPath } from "@/lib/api-football/media";
import { entitySlug } from "@/lib/api-football/utils";
import type {
  Lineup,
  Match,
  MatchEventKind,
  MatchGoalEvent,
  MatchStats,
  MatchTimelineEvent,
  Player,
  PlayerMatchRating,
  PlayerPosition,
  PlayerSeasonStats,
  Standing,
  StandingZone,
  Team,
  TeamMatchStats,
  TeamTrophy,
} from "@/lib/types";
import type {
  MatchRepository,
  PlayerRepository,
  StandingsRepository,
  TeamRepository,
  TopScorerEntry,
} from "./types";

function mapTeam(row: typeof teams.$inferSelect): Team {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortName: row.shortName,
    badgeUrl: row.logoPath || "/badges/as-far.svg",
    founded: row.founded ?? undefined,
    venue: row.venueName ?? undefined,
    city: row.venueCity ?? undefined,
  };
}

function mapPlayer(row: typeof players.$inferSelect): Player {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shirtNumber: row.shirtNumber,
    position: (row.position as PlayerPosition) || "MF",
    teamId: row.teamId || "",
    nationality: row.nationality ?? undefined,
    age: row.age ?? undefined,
    photoUrl: row.photoPath ?? undefined,
  };
}

async function teamsByIds(ids: string[]): Promise<Map<string, Team>> {
  if (ids.length === 0) return new Map();
  const rows = await db.select().from(teams).where(inArray(teams.id, ids));
  return new Map(rows.map((r) => [r.id, mapTeam(r)]));
}

function mapMatch(
  row: typeof fixtures.$inferSelect,
  home: Team,
  away: Team
): Match {
  return {
    id: row.id,
    slug: row.slug,
    competitionId: row.competitionId,
    matchday: row.matchday,
    homeTeam: home,
    awayTeam: away,
    homeScore: row.homeScore,
    awayScore: row.awayScore,
    status: row.status as Match["status"],
    kickoff: row.kickoff.toISOString(),
    minute: row.minute ?? undefined,
    venue: row.venue ?? undefined,
  };
}

export async function hydrateFixtures(
  rows: (typeof fixtures.$inferSelect)[]
): Promise<Match[]> {
  const teamIds = [
    ...new Set(rows.flatMap((r) => [r.homeTeamId, r.awayTeamId])),
  ];
  const teamMap = await teamsByIds(teamIds);
  return rows
    .map((r) => {
      const home = teamMap.get(r.homeTeamId);
      const away = teamMap.get(r.awayTeamId);
      if (!home || !away) return null;
      return mapMatch(r, home, away);
    })
    .filter(Boolean) as Match[];
}

function emptyStats(): TeamMatchStats {
  return {
    possession: 0,
    shots: 0,
    shotsOnTarget: 0,
    corners: 0,
    fouls: 0,
    yellowCards: 0,
    redCards: 0,
  };
}

const CORE_STAT_TYPES = new Set([
  "Ball Possession",
  "Total Shots",
  "Shots on Goal",
  "Corner Kicks",
  "Fouls",
]);

function parseTeamStats(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  statsBlock: any
): { stats: TeamMatchStats; hasCore: boolean } {
  const out = emptyStats();
  let hasCore = false;
  if (!statsBlock?.statistics) return { stats: out, hasCore };
  for (const s of statsBlock.statistics as Array<{
    type: string;
    value: number | string | null;
  }>) {
    if (s.value == null) continue;
    if (CORE_STAT_TYPES.has(s.type)) hasCore = true;
    const v =
      typeof s.value === "string" && s.value.endsWith("%")
        ? Number(s.value.replace("%", ""))
        : Number(s.value);
    if (Number.isNaN(v)) continue;
    switch (s.type) {
      case "Ball Possession":
        out.possession = v;
        break;
      case "Total Shots":
        out.shots = v;
        break;
      case "Shots on Goal":
        out.shotsOnTarget = v;
        break;
      case "Corner Kicks":
        out.corners = v;
        break;
      case "Fouls":
        out.fouls = v;
        break;
      case "Yellow Cards":
        out.yellowCards = v;
        break;
      case "Red Cards":
        out.redCards = v;
        break;
    }
  }
  return { stats: out, hasCore };
}

export class PostgresMatchRepository implements MatchRepository {
  async getByCompetition(competitionId: string): Promise<Match[]> {
    const rows = await db
      .select()
      .from(fixtures)
      .where(
        and(
          eq(fixtures.competitionId, competitionId),
          eq(fixtures.seasonYear, CURRENT_SEASON)
        )
      )
      .orderBy(asc(fixtures.kickoff));
    return hydrateFixtures(rows);
  }

  async getByMatchday(
    competitionId: string,
    matchday: number
  ): Promise<Match[]> {
    const rows = await db
      .select()
      .from(fixtures)
      .where(
        and(
          eq(fixtures.competitionId, competitionId),
          eq(fixtures.seasonYear, CURRENT_SEASON),
          eq(fixtures.matchday, matchday)
        )
      )
      .orderBy(asc(fixtures.kickoff));
    return hydrateFixtures(rows);
  }

  async getBySlug(slug: string): Promise<Match | null> {
    const [row] = await db
      .select()
      .from(fixtures)
      .where(eq(fixtures.slug, slug))
      .limit(1);
    if (!row) return null;
    const [m] = await hydrateFixtures([row]);
    return m ?? null;
  }

  async getStats(matchId: string): Promise<MatchStats | null> {
    const [detail] = await db
      .select()
      .from(fixtureDetails)
      .where(eq(fixtureDetails.fixtureId, matchId))
      .limit(1);
    if (!detail?.statistics || !Array.isArray(detail.statistics)) return null;
    const statsArr = detail.statistics as Array<{
      team: { id: number };
      statistics: unknown;
    }>;
    if (statsArr.length < 2) return null;

    const [fx] = await db
      .select()
      .from(fixtures)
      .where(eq(fixtures.id, matchId))
      .limit(1);
    if (!fx) return null;
    const home = await db
      .select()
      .from(teams)
      .where(eq(teams.id, fx.homeTeamId))
      .limit(1);
    const away = await db
      .select()
      .from(teams)
      .where(eq(teams.id, fx.awayTeamId))
      .limit(1);
    const homeApi = home[0]?.apiId;
    const awayApi = away[0]?.apiId;

    const homeBlock =
      statsArr.find((s) => s.team.id === homeApi) ?? statsArr[0];
    const awayBlock =
      statsArr.find((s) => s.team.id === awayApi) ?? statsArr[1];

    const homeParsed = parseTeamStats(homeBlock);
    const awayParsed = parseTeamStats(awayBlock);
    // API-Football often returns null for Botola core stats — don't fake zeros
    if (!homeParsed.hasCore && !awayParsed.hasCore) return null;

    return {
      matchId,
      home: homeParsed.stats,
      away: awayParsed.stats,
    };
  }

  async getGoalEvents(matchId: string): Promise<MatchGoalEvent[]> {
    const [detail] = await db
      .select()
      .from(fixtureDetails)
      .where(eq(fixtureDetails.fixtureId, matchId))
      .limit(1);
    if (!detail?.events || !Array.isArray(detail.events)) return [];

    const [fx] = await db
      .select()
      .from(fixtures)
      .where(eq(fixtures.id, matchId))
      .limit(1);
    if (!fx) return [];

    const teamRows = await db
      .select()
      .from(teams)
      .where(inArray(teams.id, [fx.homeTeamId, fx.awayTeamId]));
    const homeApi = teamRows.find((t) => t.id === fx.homeTeamId)?.apiId;

    return (detail.events as Array<{
      type?: string;
      detail?: string;
      time?: { elapsed?: number; extra?: number | null };
      team?: { id?: number };
      player?: { id?: number; name?: string };
    }>)
      .filter(
        (e) =>
          e.type === "Goal" &&
          e.player?.name &&
          e.team?.id != null &&
          e.time?.elapsed != null
      )
      .map((e) => {
        const teamApiId = e.team!.id!;
        const isOwnGoal = e.detail === "Own Goal";
        let side: "home" | "away";
        if (teamApiId === homeApi) {
          side = isOwnGoal ? "away" : "home";
        } else {
          side = isOwnGoal ? "home" : "away";
        }

        return {
          minute: e.time!.elapsed!,
          extraMinute: e.time?.extra ?? undefined,
          playerName: e.player!.name!,
          playerApiId: e.player!.id ?? 0,
          teamApiId,
          side,
          detail: e.detail || "Normal Goal",
        };
      });
  }

  async getTimelineEvents(matchId: string): Promise<MatchTimelineEvent[]> {
    const [detail] = await db
      .select()
      .from(fixtureDetails)
      .where(eq(fixtureDetails.fixtureId, matchId))
      .limit(1);
    if (!detail?.events || !Array.isArray(detail.events)) return [];

    const [fx] = await db
      .select()
      .from(fixtures)
      .where(eq(fixtures.id, matchId))
      .limit(1);
    if (!fx) return [];

    const teamRows = await db
      .select()
      .from(teams)
      .where(inArray(teams.id, [fx.homeTeamId, fx.awayTeamId]));
    const homeApi = teamRows.find((t) => t.id === fx.homeTeamId)?.apiId;

    const mapped: MatchTimelineEvent[] = [];
    for (const e of detail.events as Array<{
      type?: string;
      detail?: string;
      time?: { elapsed?: number; extra?: number | null };
      team?: { id?: number };
      player?: { id?: number; name?: string | null };
      assist?: { id?: number; name?: string | null };
    }>) {
      if (e.team?.id == null || e.time?.elapsed == null) continue;
      const teamApiId = e.team.id;
      const side: "home" | "away" =
        teamApiId === homeApi ? "home" : "away";

      let kind: MatchEventKind | null = null;
      if (e.type === "Goal") kind = "goal";
      else if (e.type === "Card" && e.detail === "Yellow Card") kind = "yellow";
      else if (
        e.type === "Card" &&
        (e.detail === "Red Card" || e.detail === "Second Yellow card")
      ) {
        kind = "red";
      } else if (e.type === "subst") kind = "subst";
      else if (e.type === "Var") kind = "var";
      if (!kind) continue;

      const playerName = e.player?.name?.trim() || "—";
      // API: for subst, player = off, assist = on
      const secondaryName = e.assist?.name?.trim() || undefined;

      mapped.push({
        minute: e.time.elapsed,
        extraMinute: e.time.extra ?? undefined,
        kind,
        side: kind === "goal" && e.detail === "Own Goal"
          ? side === "home"
            ? "away"
            : "home"
          : side,
        detail: e.detail || e.type || "",
        playerName,
        secondaryName,
      });
    }

    return mapped.sort((a, b) => {
      const am = a.minute + (a.extraMinute ?? 0) / 100;
      const bm = b.minute + (b.extraMinute ?? 0) / 100;
      return am - bm;
    });
  }

  async getLineups(matchId: string): Promise<Lineup[]> {
    const [detail] = await db
      .select()
      .from(fixtureDetails)
      .where(eq(fixtureDetails.fixtureId, matchId))
      .limit(1);
    if (!detail?.lineups || !Array.isArray(detail.lineups)) return [];

    const allTeams = await db.select().from(teams);
    const teamByApi = new Map(allTeams.map((t) => [t.apiId, t]));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawLineups = detail.lineups as any[];

    type SlotPlayer = {
      id: number;
      name: string;
      number?: number | null;
      pos?: string | null;
    };

    const slots: Array<{ teamApiId: number; player: SlotPlayer }> = [];
    for (const lu of rawLineups) {
      const teamApiId = lu.team?.id as number;
      for (const s of [...(lu.startXI || []), ...(lu.substitutes || [])]) {
        if (s?.player?.id) slots.push({ teamApiId, player: s.player });
      }
    }

    const uniqueByApi = new Map<
      number,
      { teamApiId: number; player: SlotPlayer }
    >();
    for (const slot of slots) {
      if (!uniqueByApi.has(slot.player.id)) {
        uniqueByApi.set(slot.player.id, slot);
      }
    }

    const apiIds = [...uniqueByApi.keys()];
    const existingRows =
      apiIds.length > 0
        ? await db.select().from(players).where(inArray(players.apiId, apiIds))
        : [];
    const byApi = new Map(existingRows.map((p) => [p.apiId, p]));

    // Only download/upsert players we don't already have with a photo
    const missing = [...uniqueByApi.values()].filter(({ player: p }) => {
      const row = byApi.get(p.id);
      return !row?.photoPath;
    });

    if (missing.length > 0) {
      await Promise.all(
        missing.map(async ({ teamApiId, player: p }) => {
          const photoPath = await ensureMedia("players", p.id);
          const teamRow = teamByApi.get(teamApiId);
          const slug = entitySlug(p.name, p.id);
          await db
            .insert(players)
            .values({
              id: slug,
              apiId: p.id,
              slug,
              name: p.name,
              photoPath,
              position: mapPosFromApi(p.pos),
              shirtNumber: p.number ?? 0,
              teamId: teamRow?.id,
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: players.apiId,
              set: {
                name: p.name,
                photoPath,
                ...(p.number != null && p.number > 0
                  ? { shirtNumber: p.number }
                  : {}),
                ...(p.pos ? { position: mapPosFromApi(p.pos) } : {}),
                ...(teamRow?.id ? { teamId: teamRow.id } : {}),
                updatedAt: new Date(),
              },
            });
        })
      );

      const refreshed = await db
        .select()
        .from(players)
        .where(inArray(players.apiId, apiIds));
      byApi.clear();
      for (const p of refreshed) byApi.set(p.apiId, p);
    }

    return rawLineups.map((lu) => {
      const teamApiId = lu.team?.id as number;
      const teamRow = teamByApi.get(teamApiId);
      const teamId = teamRow?.id ?? String(teamApiId);

      const mapSlot = (slot: { player: SlotPlayer }): Player => {
        const p = slot.player;
        const existing = byApi.get(p.id);
        if (existing) {
          const mapped = mapPlayer(existing);
          return {
            ...mapped,
            photoUrl: mapped.photoUrl || mediaPublicPath("players", p.id),
          };
        }
        return {
          id: `tmp-${p.id}`,
          slug: entitySlug(p.name, p.id),
          name: p.name,
          shirtNumber: p.number ?? 0,
          position: mapPosFromApi(p.pos),
          teamId,
          photoUrl: mediaPublicPath("players", p.id),
        };
      };

      return {
        matchId,
        teamId,
        formation: lu.formation || "4-3-3",
        coachName: lu.coach?.name || undefined,
        startingXI: (lu.startXI || []).map(mapSlot),
        substitutes: (lu.substitutes || []).map(mapSlot),
      } satisfies Lineup;
    });
  }
}

function mapPosFromApi(pos: string | null | undefined): PlayerPosition {
  if (pos === "G") return "GK";
  if (pos === "D") return "DF";
  if (pos === "M") return "MF";
  if (pos === "F") return "FW";
  return "MF";
}

export class PostgresTeamRepository implements TeamRepository {
  async getAll(): Promise<Team[]> {
    const rows = await db.select().from(teams).orderBy(asc(teams.name));
    return rows.map(mapTeam);
  }

  async getBySlug(slug: string): Promise<Team | null> {
    const [row] = await db
      .select()
      .from(teams)
      .where(eq(teams.slug, slug))
      .limit(1);
    return row ? mapTeam(row) : null;
  }

  async getById(id: string): Promise<Team | null> {
    const [row] = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
    return row ? mapTeam(row) : null;
  }

  async getSquad(teamId: string): Promise<Player[]> {
    const rows = await db
      .select()
      .from(players)
      .where(eq(players.teamId, teamId))
      .orderBy(asc(players.shirtNumber));
    return rows.map(mapPlayer);
  }

  async getUpcomingFixtures(
    teamSlug: string,
    limit = 5
  ): Promise<Match[]> {
    const team = await this.getBySlug(teamSlug);
    if (!team) return [];
    const rows = await db
      .select()
      .from(fixtures)
      .where(
        and(
          eq(fixtures.status, "upcoming"),
          or(
            eq(fixtures.homeTeamId, team.id),
            eq(fixtures.awayTeamId, team.id)
          )
        )
      )
      .orderBy(asc(fixtures.kickoff))
      .limit(limit);
    return hydrateFixtures(rows);
  }

  async getRecentMatches(teamSlug: string, limit = 5): Promise<Match[]> {
    const team = await this.getBySlug(teamSlug);
    if (!team) return [];
    const rows = await db
      .select()
      .from(fixtures)
      .where(
        and(
          eq(fixtures.status, "finished"),
          or(
            eq(fixtures.homeTeamId, team.id),
            eq(fixtures.awayTeamId, team.id)
          )
        )
      )
      .orderBy(desc(fixtures.kickoff))
      .limit(limit);
    return hydrateFixtures(rows);
  }

  async getTrophies(teamId: string): Promise<TeamTrophy[]> {
    const links = await db
      .select()
      .from(competitionTeams)
      .where(
        and(
          eq(competitionTeams.teamId, teamId),
          eq(competitionTeams.seasonYear, CURRENT_SEASON)
        )
      );

    const trophies: TeamTrophy[] = [];
    for (const link of links) {
      const [row] = await db
        .select()
        .from(standingsRows)
        .where(
          and(
            eq(standingsRows.teamId, teamId),
            eq(standingsRows.competitionId, link.competitionId),
            eq(standingsRows.seasonYear, CURRENT_SEASON)
          )
        )
        .limit(1);
      if (!row) continue;

      const seasonLabel = `${CURRENT_SEASON}/${String(CURRENT_SEASON + 1).slice(-2)}`;
      const leagueName =
        link.competitionId === BOTOLA_PRO.id ? "Botola Pro" : "Botola 2";

      if (row.rank === 1) {
        trophies.push({
          id: `${teamId}-champ-${CURRENT_SEASON}`,
          teamId,
          name: `${leagueName} Champion`,
          shortName: "Champion",
          count: 1,
          seasons: [seasonLabel],
        });
      } else if (row.zone === "continental" || row.rank <= 3) {
        trophies.push({
          id: `${teamId}-caf-${CURRENT_SEASON}`,
          teamId,
          name: "CAF / continental qualification",
          shortName: "CAF",
          count: 1,
          seasons: [seasonLabel],
        });
      }

      if (row.rank <= 5) {
        trophies.push({
          id: `${teamId}-top5-${CURRENT_SEASON}`,
          teamId,
          name: `${leagueName} Top 5 finish`,
          shortName: "Top 5",
          count: 1,
          seasons: [seasonLabel],
        });
      }
    }

    return trophies;
  }
}

export class PostgresStandingsRepository implements StandingsRepository {
  async getStandings(competitionId: string): Promise<Standing[]> {
    const rows = await db
      .select()
      .from(standingsRows)
      .where(
        and(
          eq(standingsRows.competitionId, competitionId),
          eq(standingsRows.seasonYear, CURRENT_SEASON)
        )
      )
      .orderBy(asc(standingsRows.rank));

    const teamMap = await teamsByIds(rows.map((r) => r.teamId));
    return rows
      .map((r) => {
        const team = teamMap.get(r.teamId);
        if (!team) return null;
        return {
          position: r.rank,
          team,
          played: r.played,
          won: r.won,
          drawn: r.drawn,
          lost: r.lost,
          goalsFor: r.goalsFor,
          goalsAgainst: r.goalsAgainst,
          points: r.points,
          form: parseForm(r.form),
          zone: (r.zone as StandingZone) ?? null,
        } satisfies Standing;
      })
      .filter(Boolean) as Standing[];
  }

  async getTeamStanding(
    competitionId: string,
    teamSlug: string
  ): Promise<Standing | null> {
    const all = await this.getStandings(competitionId);
    return all.find((s) => s.team.slug === teamSlug) ?? null;
  }
}

export class PostgresPlayerRepository implements PlayerRepository {
  async getBySlug(slug: string): Promise<Player | null> {
    const [row] = await db
      .select()
      .from(players)
      .where(eq(players.slug, slug))
      .limit(1);
    return row ? mapPlayer(row) : null;
  }

  async getSeasonStats(playerId: string): Promise<PlayerSeasonStats | null> {
    const [row] = await db
      .select()
      .from(playerSeasonStats)
      .where(
        and(
          eq(playerSeasonStats.playerId, playerId),
          eq(playerSeasonStats.seasonYear, CURRENT_SEASON)
        )
      )
      .limit(1);
    if (!row) return null;
    return {
      playerId,
      season: String(CURRENT_SEASON),
      appearances: row.appearances,
      goals: row.goals,
      assists: row.assists,
      yellowCards: row.yellowCards,
      redCards: row.redCards,
      averageRating: displaySeasonRating({
        averageRating: row.averageRating,
        goals: row.goals,
        assists: row.assists,
      }),
    };
  }

  async getSeasonStatsForPlayers(
    playerIds: string[]
  ): Promise<Record<string, PlayerSeasonStats | null>> {
    const out: Record<string, PlayerSeasonStats | null> = {};
    for (const id of playerIds) out[id] = null;
    if (playerIds.length === 0) return out;

    const rows = await db
      .select()
      .from(playerSeasonStats)
      .where(
        and(
          inArray(playerSeasonStats.playerId, playerIds),
          eq(playerSeasonStats.seasonYear, CURRENT_SEASON)
        )
      );

    for (const row of rows) {
      out[row.playerId] = {
        playerId: row.playerId,
        season: String(CURRENT_SEASON),
        appearances: row.appearances,
        goals: row.goals,
        assists: row.assists,
        yellowCards: row.yellowCards,
        redCards: row.redCards,
        averageRating: displaySeasonRating({
          averageRating: row.averageRating,
          goals: row.goals,
          assists: row.assists,
        }),
      };
    }
    return out;
  }

  async getRecentRatings(
    playerId: string,
    limit = 8
  ): Promise<PlayerMatchRating[]> {
    const [player] = await db
      .select()
      .from(players)
      .where(eq(players.id, playerId))
      .limit(1);
    if (!player?.teamId) return [];

    const seasonStats = await this.getSeasonStats(playerId);
    const baseRating = seasonStats?.averageRating ?? 6.5;

    const rows = await db
      .select()
      .from(fixtures)
      .where(
        and(
          eq(fixtures.status, "finished"),
          or(
            eq(fixtures.homeTeamId, player.teamId),
            eq(fixtures.awayTeamId, player.teamId)
          )
        )
      )
      .orderBy(desc(fixtures.kickoff))
      .limit(limit);

    const matches = await hydrateFixtures(rows);
    return matches.map((m, i) => {
      const isHome = m.homeTeam.id === player.teamId;
      const opponent = isHome ? m.awayTeam : m.homeTeam;
      const forScore = isHome ? m.homeScore : m.awayScore;
      const againstScore = isHome ? m.awayScore : m.homeScore;
      let result: "W" | "D" | "L" | undefined;
      if (forScore != null && againstScore != null) {
        if (forScore > againstScore) result = "W";
        else if (forScore < againstScore) result = "L";
        else result = "D";
      }
      // Slight variance around season form for the match list UI
      const jitter = ((i % 5) - 2) * 0.1;
      const rating = Math.min(
        9.9,
        Math.max(5.5, Math.round((baseRating + jitter) * 10) / 10)
      );
      return {
        matchId: m.id,
        playerId,
        date: m.kickoff,
        opponentShortName: opponent.shortName,
        rating,
        minutes: 90,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        result,
        score:
          m.homeScore != null && m.awayScore != null
            ? `${m.homeScore}–${m.awayScore}`
            : undefined,
      } satisfies PlayerMatchRating;
    });
  }

  async getTopScorers(limit = 20): Promise<TopScorerEntry[]> {
    const rows = await db
      .select()
      .from(playerSeasonStats)
      .where(eq(playerSeasonStats.seasonYear, CURRENT_SEASON))
      .orderBy(desc(playerSeasonStats.goals))
      .limit(limit);

    const result: TopScorerEntry[] = [];
    for (const row of rows) {
      const [player] = await db
        .select()
        .from(players)
        .where(eq(players.id, row.playerId))
        .limit(1);
      if (!player?.teamId) continue;
      const [team] = await db
        .select()
        .from(teams)
        .where(eq(teams.id, player.teamId))
        .limit(1);
      if (!team) continue;
      result.push({
        player: mapPlayer(player),
        team: mapTeam(team),
        stats: {
          playerId: player.id,
          season: String(CURRENT_SEASON),
          appearances: row.appearances,
          goals: row.goals,
          assists: row.assists,
          yellowCards: row.yellowCards,
          redCards: row.redCards,
          averageRating: displaySeasonRating({
            averageRating: row.averageRating,
            goals: row.goals,
            assists: row.assists,
          }),
        },
      });
    }
    return result;
  }
}

/** Helper used by home ticker / pages that need cross-league fixtures */
export async function getFixturesAroundNow(days = 3): Promise<Match[]> {
  const from = new Date();
  from.setDate(from.getDate() - 1);
  const to = new Date();
  to.setDate(to.getDate() + days);
  const rows = await db
    .select()
    .from(fixtures)
    .where(and(gte(fixtures.kickoff, from), lte(fixtures.kickoff, to)))
    .orderBy(asc(fixtures.kickoff));
  return hydrateFixtures(rows);
}

/**
 * Home / ticker fixtures: prefer live + near-term window; if the season is
 * over (or empty window), fall back to the latest matchday in Botola Pro.
 */
export async function getHomeFixtures(days = 7): Promise<Match[]> {
  const around = await getFixturesAroundNow(days);
  if (around.length > 0) return around;

  const liveRows = await db
    .select()
    .from(fixtures)
    .where(eq(fixtures.status, "live"))
    .orderBy(asc(fixtures.kickoff));
  if (liveRows.length > 0) return hydrateFixtures(liveRows);

  const [latest] = await db
    .select({ matchday: fixtures.matchday })
    .from(fixtures)
    .where(
      and(
        eq(fixtures.competitionId, BOTOLA_PRO.id),
        eq(fixtures.seasonYear, CURRENT_SEASON),
        sql`${fixtures.matchday} > 0`
      )
    )
    .orderBy(desc(fixtures.matchday))
    .limit(1);

  if (!latest?.matchday) {
    // Last resort: most recent finished fixtures
    const recent = await db
      .select()
      .from(fixtures)
      .where(eq(fixtures.competitionId, BOTOLA_PRO.id))
      .orderBy(desc(fixtures.kickoff))
      .limit(12);
    return hydrateFixtures(recent);
  }

  const rows = await db
    .select()
    .from(fixtures)
    .where(
      and(
        eq(fixtures.competitionId, BOTOLA_PRO.id),
        eq(fixtures.seasonYear, CURRENT_SEASON),
        eq(fixtures.matchday, latest.matchday)
      )
    )
    .orderBy(asc(fixtures.kickoff));
  return hydrateFixtures(rows);
}

export async function getTeamOfTheWeekFromDb(
  competitionId: string = BOTOLA_PRO.id
): Promise<{
  lineup: Lineup;
  weekLabel: string;
  statsById: Record<string, PlayerSeasonStats>;
} | null> {
  const teamLinks = await db
    .select({ teamId: competitionTeams.teamId })
    .from(competitionTeams)
    .where(
      and(
        eq(competitionTeams.competitionId, competitionId),
        eq(competitionTeams.seasonYear, CURRENT_SEASON)
      )
    );
  const teamIds = teamLinks.map((t) => t.teamId);
  if (teamIds.length === 0) return null;

  const rows = await db
    .select({
      player: players,
      rating: playerSeasonStats.averageRating,
      goals: playerSeasonStats.goals,
      assists: playerSeasonStats.assists,
      appearances: playerSeasonStats.appearances,
      yellowCards: playerSeasonStats.yellowCards,
      redCards: playerSeasonStats.redCards,
    })
    .from(players)
    .leftJoin(
      playerSeasonStats,
      and(
        eq(playerSeasonStats.playerId, players.id),
        eq(playerSeasonStats.competitionId, competitionId),
        eq(playerSeasonStats.seasonYear, CURRENT_SEASON)
      )
    )
    .where(
      and(
        inArray(players.teamId, teamIds),
        sql`${players.photoPath} is not null`,
        sql`${players.photoPath} not like '%/0.png'`
      )
    );

  // API-Football often serves a ~5KB silhouette placeholder — skip those.
  const annotated: Array<(typeof rows)[number] & { hasRealPhoto: boolean }> =
    [];
  for (const row of rows) {
    annotated.push({
      ...row,
      hasRealPhoto: await hasRealPlayerPhoto(row.player.photoPath),
    });
  }

  const scored = annotated
    .map((r) => {
      const goals = r.goals ?? 0;
      const assists = r.assists ?? 0;
      const apiRating = r.rating ? Number(r.rating) : 0;
      const displayRating =
        apiRating > 0
          ? apiRating
          : Math.min(
              9.9,
              Math.round((6.2 + goals * 0.18 + assists * 0.12) * 10) / 10
            );
      return {
        player: mapPlayer(r.player),
        goals,
        assists,
        appearances: r.appearances ?? 0,
        yellowCards: r.yellowCards ?? 0,
        redCards: r.redCards ?? 0,
        displayRating,
        hasRealPhoto: r.hasRealPhoto,
        // Strongly prefer real photos in ranking
        score:
          (r.hasRealPhoto ? 1000 : 0) +
          displayRating * 10 +
          goals * 3 +
          assists,
      };
    })
    .sort((a, b) => b.score - a.score);

  const realEnough = scored.filter((r) => r.hasRealPhoto).length >= 11;
  const pool = realEnough ? scored.filter((r) => r.hasRealPhoto) : scored;

  const pick = (pos: PlayerPosition, n: number) => {
    const chosen: typeof pool = [];
    for (const row of pool) {
      if (chosen.length >= n) break;
      if (row.player.position !== pos) continue;
      if (chosen.some((p) => p.player.id === row.player.id)) continue;
      chosen.push(row);
    }
    return chosen;
  };

  let xi = [
    ...pick("GK", 1),
    ...pick("DF", 4),
    ...pick("MF", 3),
    ...pick("FW", 3),
  ];
  if (xi.length < 11) {
    for (const row of pool) {
      if (xi.length >= 11) break;
      if (xi.some((p) => p.player.id === row.player.id)) continue;
      xi.push(row);
    }
  }
  if (xi.length < 11) return null;
  xi = xi.slice(0, 11).map((row) => ({
    ...row,
    player: {
      ...row.player,
      // Don't serve API silhouette stubs — use our avatar placeholder instead
      photoUrl: row.hasRealPhoto ? row.player.photoUrl : undefined,
    },
  }));

  const [latest] = await db
    .select({ matchday: fixtures.matchday })
    .from(fixtures)
    .where(
      and(
        eq(fixtures.competitionId, competitionId),
        eq(fixtures.seasonYear, CURRENT_SEASON),
        sql`${fixtures.matchday} > 0`
      )
    )
    .orderBy(desc(fixtures.matchday))
    .limit(1);

  const statsById: Record<string, PlayerSeasonStats> = {};
  for (const row of xi) {
    statsById[row.player.id] = {
      playerId: row.player.id,
      season: String(CURRENT_SEASON),
      appearances: row.appearances,
      goals: row.goals,
      assists: row.assists,
      yellowCards: row.yellowCards,
      redCards: row.redCards,
      averageRating: row.displayRating,
    };
  }

  return {
    lineup: {
      matchId: `totw-${competitionId}`,
      teamId: "totw",
      formation: "4-3-3",
      startingXI: xi.map((r) => r.player),
      substitutes: [],
    },
    weekLabel: latest?.matchday
      ? `Matchday ${latest.matchday}`
      : `Season ${CURRENT_SEASON}`,
    statsById,
  };
}

/** Real headshots are larger than the ~5192B API silhouette stub. */
async function hasRealPlayerPhoto(
  photoPath: string | null | undefined
): Promise<boolean> {
  if (!photoPath) return false;
  try {
    const { stat } = await import("fs/promises");
    const { join } = await import("path");
    const file = join(process.cwd(), "public", photoPath.replace(/^\//, ""));
    const s = await stat(file);
    return s.size > 5500;
  } catch {
    return false;
  }
}

export async function listPlayersForMentions(limit = 200) {
  return db.select().from(players).orderBy(asc(players.name)).limit(limit);
}

export async function listFixturesForMentions(limit = 100) {
  return db
    .select()
    .from(fixtures)
    .orderBy(desc(fixtures.kickoff))
    .limit(limit);
}

export async function getCompetition(id: string) {
  const [row] = await db
    .select()
    .from(competitions)
    .where(eq(competitions.id, id))
    .limit(1);
  return row ?? null;
}

/** Prefer Botola Pro when a team appears in multiple competitions. */
export async function getPrimaryCompetitionForTeam(
  teamId: string
): Promise<string> {
  const links = await db
    .select()
    .from(competitionTeams)
    .where(
      and(
        eq(competitionTeams.teamId, teamId),
        eq(competitionTeams.seasonYear, CURRENT_SEASON)
      )
    );
  if (links.some((l) => l.competitionId === BOTOLA_PRO.id)) {
    return BOTOLA_PRO.id;
  }
  return links[0]?.competitionId ?? BOTOLA_PRO.id;
}

export async function getPlayerById(id: string) {
  const [row] = await db.select().from(players).where(eq(players.id, id)).limit(1);
  return row ? mapPlayer(row) : null;
}

export async function getMatchById(id: string) {
  const [row] = await db
    .select()
    .from(fixtures)
    .where(eq(fixtures.id, id))
    .limit(1);
  if (!row) return null;
  const [m] = await hydrateFixtures([row]);
  return m ?? null;
}
