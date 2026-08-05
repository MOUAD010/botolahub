import "dotenv/config";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  competitionSeasons,
  competitionTeams,
  competitions,
  fixtureDetails,
  fixtures,
  playerSeasonStats,
  players,
  standingsRows,
  syncRuns,
  teams,
} from "@/lib/db/schema";
import {
  BOTOLA_PRO_API_ID,
  CURRENT_SEASON,
  TRACKED_LEAGUE_IDS,
  competitionIdFromApi,
} from "@/lib/api-football/constants";
import {
  getFixtureEvents,
  getFixtureLineups,
  getFixtureStatistics,
  getFixturesByLeague,
  getFixturesLive,
  getLeagueById,
  getSquad,
  getStandings,
  getStatus,
  getTeamsByLeague,
  getTopScorers,
  type AfFixtureRow,
  type AfStandingRow,
} from "@/lib/api-football/endpoints";
import { ensureMedia } from "@/lib/api-football/media";
import {
  entitySlug,
  mapFixtureStatus,
  mapPlayerPosition,
  parseForm,
  parseMatchday,
  standingZone,
} from "@/lib/api-football/utils";

export type SyncJob =
  | "catalog"
  | "standings"
  | "fixtures"
  | "squads"
  | "live"
  | "match-detail"
  | "topscorers"
  | "full";

type SyncResult = {
  kind: SyncJob;
  status: "ok" | "error";
  requestsUsed: number;
  message: string;
};

async function startRun(kind: string) {
  const [row] = await db
    .insert(syncRuns)
    .values({ kind, status: "running" })
    .returning();
  return row;
}

async function finishRun(
  id: string,
  status: "ok" | "error",
  requestsUsed: number,
  message: string
) {
  await db
    .update(syncRuns)
    .set({
      status,
      requestsUsed,
      message,
      finishedAt: new Date(),
    })
    .where(eq(syncRuns.id, id));
}

async function upsertCompetition(apiId: number) {
  let requests = 0;
  const { response } = await getLeagueById(apiId);
  requests += 1;
  const row = response[0];
  if (!row) throw new Error(`League ${apiId} not found`);

  const id = competitionIdFromApi(apiId);
  const logoPath = await ensureMedia("leagues", apiId, row.league.logo);

  await db
    .insert(competitions)
    .values({
      id,
      apiId,
      slug: id,
      name: row.league.name,
      shortName: row.league.name,
      type: row.league.type,
      country: row.country.name || "Morocco",
      logoPath,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: competitions.id,
      set: {
        name: row.league.name,
        shortName: row.league.name,
        type: row.league.type,
        country: row.country.name || "Morocco",
        logoPath,
        updatedAt: new Date(),
      },
    });

  for (const season of row.seasons) {
    if (season.year !== CURRENT_SEASON) continue;
    await db
      .insert(competitionSeasons)
      .values({
        competitionId: id,
        year: season.year,
        startDate: season.start,
        endDate: season.end,
        current: season.current ? 1 : 0,
        coverage: season.coverage,
      })
      .onConflictDoUpdate({
        target: [competitionSeasons.competitionId, competitionSeasons.year],
        set: {
          startDate: season.start,
          endDate: season.end,
          current: season.current ? 1 : 0,
          coverage: season.coverage,
        },
      });
  }

  return { id, requests };
}

async function syncTeamsForLeague(apiId: number, competitionId: string) {
  let requests = 0;
  const { response } = await getTeamsByLeague(apiId, CURRENT_SEASON);
  requests += 1;

  for (const row of response) {
    const teamApiId = row.team.id;
    const slug = entitySlug(row.team.name, teamApiId);
    const logoPath = await ensureMedia("teams", teamApiId, row.team.logo);
    if (row.venue?.id) {
      await ensureMedia("venues", row.venue.id, row.venue.image);
    }

    await db
      .insert(teams)
      .values({
        id: slug,
        apiId: teamApiId,
        slug,
        name: row.team.name,
        shortName: row.team.code || row.team.name.slice(0, 3).toUpperCase(),
        logoPath,
        founded: row.team.founded ?? null,
        venueName: row.venue?.name ?? null,
        venueCity: row.venue?.city ?? null,
        venueApiId: row.venue?.id ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: teams.apiId,
        set: {
          name: row.team.name,
          shortName: row.team.code || row.team.name.slice(0, 3).toUpperCase(),
          logoPath,
          founded: row.team.founded ?? null,
          venueName: row.venue?.name ?? null,
          venueCity: row.venue?.city ?? null,
          venueApiId: row.venue?.id ?? null,
          updatedAt: new Date(),
        },
      });

    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.apiId, teamApiId))
      .limit(1);

    if (team) {
      await db
        .insert(competitionTeams)
        .values({
          competitionId,
          seasonYear: CURRENT_SEASON,
          teamId: team.id,
        })
        .onConflictDoNothing();
    }
  }

  return { count: response.length, requests };
}

export async function syncCatalog(): Promise<SyncResult> {
  const run = await startRun("catalog");
  let requests = 0;
  try {
    for (const apiId of TRACKED_LEAGUE_IDS) {
      const { id, requests: r1 } = await upsertCompetition(apiId);
      requests += r1;
      const { requests: r2 } = await syncTeamsForLeague(apiId, id);
      requests += r2;
    }
    const msg = `Catalog synced for leagues ${TRACKED_LEAGUE_IDS.join(", ")}`;
    await finishRun(run.id, "ok", requests, msg);
    return { kind: "catalog", status: "ok", requestsUsed: requests, message: msg };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Catalog sync failed";
    await finishRun(run.id, "error", requests, msg);
    return { kind: "catalog", status: "error", requestsUsed: requests, message: msg };
  }
}

async function teamIdByApiId(apiId: number): Promise<string | null> {
  const [row] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(eq(teams.apiId, apiId))
    .limit(1);
  return row?.id ?? null;
}

export async function syncStandingsJob(): Promise<SyncResult> {
  const run = await startRun("standings");
  let requests = 0;
  try {
    for (const apiId of TRACKED_LEAGUE_IDS) {
      const competitionId = competitionIdFromApi(apiId);
      const { response } = await getStandings(apiId, CURRENT_SEASON);
      requests += 1;
      const leagueBlock = response[0]?.league;
      const table: AfStandingRow[] = leagueBlock?.standings?.[0] ?? [];

      await db
        .delete(standingsRows)
        .where(
          and(
            eq(standingsRows.competitionId, competitionId),
            eq(standingsRows.seasonYear, CURRENT_SEASON)
          )
        );

      for (const row of table) {
        const teamId = await teamIdByApiId(row.team.id);
        if (!teamId) continue;
        await db.insert(standingsRows).values({
          competitionId,
          seasonYear: CURRENT_SEASON,
          rank: row.rank,
          teamId,
          played: row.all.played,
          won: row.all.win,
          drawn: row.all.draw,
          lost: row.all.lose,
          goalsFor: row.all.goals.for,
          goalsAgainst: row.all.goals.against,
          goalsDiff: row.goalsDiff,
          points: row.points,
          form: row.form,
          description: row.description,
          zone: standingZone(row.rank, row.description),
        });
      }
    }
    const msg = "Standings synced";
    await finishRun(run.id, "ok", requests, msg);
    return { kind: "standings", status: "ok", requestsUsed: requests, message: msg };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Standings sync failed";
    await finishRun(run.id, "error", requests, msg);
    return { kind: "standings", status: "error", requestsUsed: requests, message: msg };
  }
}

async function upsertFixtureRow(row: AfFixtureRow) {
  const competitionId = competitionIdFromApi(row.league.id);
  const homeTeamId = await teamIdByApiId(row.teams.home.id);
  const awayTeamId = await teamIdByApiId(row.teams.away.id);
  if (!homeTeamId || !awayTeamId) return;

  const apiId = row.fixture.id;
  const slug = entitySlug(
    `${row.teams.home.name}-${row.teams.away.name}`,
    apiId
  );
  const status = mapFixtureStatus(row.fixture.status.short);

  await db
    .insert(fixtures)
    .values({
      id: slug,
      apiId,
      slug,
      competitionId,
      seasonYear: row.league.season,
      round: row.league.round,
      matchday: parseMatchday(row.league.round),
      homeTeamId,
      awayTeamId,
      homeScore: row.goals.home,
      awayScore: row.goals.away,
      status,
      statusShort: row.fixture.status.short,
      kickoff: new Date(row.fixture.date),
      minute: row.fixture.status.elapsed,
      venue: row.fixture.venue?.name ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: fixtures.apiId,
      set: {
        homeScore: row.goals.home,
        awayScore: row.goals.away,
        status,
        statusShort: row.fixture.status.short,
        kickoff: new Date(row.fixture.date),
        minute: row.fixture.status.elapsed,
        venue: row.fixture.venue?.name ?? null,
        round: row.league.round,
        matchday: parseMatchday(row.league.round),
        updatedAt: new Date(),
      },
    });
}

export async function syncFixturesJob(): Promise<SyncResult> {
  const run = await startRun("fixtures");
  let requests = 0;
  try {
    let total = 0;
    for (const apiId of TRACKED_LEAGUE_IDS) {
      const { response } = await getFixturesByLeague(apiId, CURRENT_SEASON);
      requests += 1;
      total += response.length;
      for (const row of response) {
        await upsertFixtureRow(row);
      }
    }
    const msg = `Fixtures synced (${total})`;
    await finishRun(run.id, "ok", requests, msg);
    return { kind: "fixtures", status: "ok", requestsUsed: requests, message: msg };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Fixtures sync failed";
    await finishRun(run.id, "error", requests, msg);
    return { kind: "fixtures", status: "error", requestsUsed: requests, message: msg };
  }
}

export async function syncSquadsJob(): Promise<SyncResult> {
  const run = await startRun("squads");
  let requests = 0;
  try {
    // Only Botola Pro has players coverage
    const competitionId = competitionIdFromApi(BOTOLA_PRO_API_ID);
    const links = await db
      .select()
      .from(competitionTeams)
      .where(
        and(
          eq(competitionTeams.competitionId, competitionId),
          eq(competitionTeams.seasonYear, CURRENT_SEASON)
        )
      );

    const teamRows = await db
      .select()
      .from(teams)
      .where(
        inArray(
          teams.id,
          links.map((l) => l.teamId)
        )
      );

    let playerCount = 0;
    for (const team of teamRows) {
      const { response } = await getSquad(team.apiId);
      requests += 1;
      const squad = response[0];
      if (!squad) continue;

      for (const p of squad.players) {
        const slug = entitySlug(p.name, p.id);
        const photoPath = await ensureMedia("players", p.id, p.photo);
        await db
          .insert(players)
          .values({
            id: slug,
            apiId: p.id,
            slug,
            name: p.name,
            photoPath,
            position: mapPlayerPosition(p.position),
            shirtNumber: p.number ?? 0,
            teamId: team.id,
            age: p.age,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: players.apiId,
            set: {
              name: p.name,
              photoPath,
              position: mapPlayerPosition(p.position),
              shirtNumber: p.number ?? 0,
              teamId: team.id,
              age: p.age,
              updatedAt: new Date(),
            },
          });
        playerCount += 1;
      }
    }

    const msg = `Squads synced (${playerCount} players, ${teamRows.length} teams)`;
    await finishRun(run.id, "ok", requests, msg);
    return { kind: "squads", status: "ok", requestsUsed: requests, message: msg };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Squads sync failed";
    await finishRun(run.id, "error", requests, msg);
    return { kind: "squads", status: "error", requestsUsed: requests, message: msg };
  }
}

export async function syncLiveJob(): Promise<SyncResult> {
  const run = await startRun("live");
  let requests = 0;
  try {
    const liveParam = TRACKED_LEAGUE_IDS.join("-");
    const { response } = await getFixturesLive(liveParam);
    requests += 1;

    for (const row of response) {
      await upsertFixtureRow(row);
      // Enrich live matches with events (1 call each — keep budget in mind)
      const [fx] = await db
        .select()
        .from(fixtures)
        .where(eq(fixtures.apiId, row.fixture.id))
        .limit(1);
      if (!fx) continue;

      const [eventsRes, lineupsRes] = await Promise.all([
        getFixtureEvents(row.fixture.id),
        getFixtureLineups(row.fixture.id),
      ]);
      requests += 2;

      await db
        .insert(fixtureDetails)
        .values({
          fixtureId: fx.id,
          events: eventsRes.response,
          lineups: lineupsRes.response,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: fixtureDetails.fixtureId,
          set: {
            events: eventsRes.response,
            lineups: lineupsRes.response,
            updatedAt: new Date(),
          },
        });
    }

    const msg = `Live sync: ${response.length} in-play fixtures`;
    await finishRun(run.id, "ok", requests, msg);
    return { kind: "live", status: "ok", requestsUsed: requests, message: msg };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Live sync failed";
    await finishRun(run.id, "error", requests, msg);
    return { kind: "live", status: "error", requestsUsed: requests, message: msg };
  }
}

export async function syncMatchDetail(
  fixtureApiId: number
): Promise<SyncResult> {
  const run = await startRun("match-detail");
  let requests = 0;
  try {
    const [fx] = await db
      .select()
      .from(fixtures)
      .where(eq(fixtures.apiId, fixtureApiId))
      .limit(1);
    if (!fx) throw new Error(`Fixture apiId=${fixtureApiId} not in DB`);

    const [eventsRes, lineupsRes, statsRes] = [
      await getFixtureEvents(fixtureApiId),
      await getFixtureLineups(fixtureApiId),
      await getFixtureStatistics(fixtureApiId),
    ];
    requests += 3;

    await db
      .insert(fixtureDetails)
      .values({
        fixtureId: fx.id,
        events: eventsRes.response,
        lineups: lineupsRes.response,
        statistics: statsRes.response,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: fixtureDetails.fixtureId,
        set: {
          events: eventsRes.response,
          lineups: lineupsRes.response,
          statistics: statsRes.response,
          updatedAt: new Date(),
        },
      });

    const msg = `Match detail synced for ${fx.slug}`;
    await finishRun(run.id, "ok", requests, msg);
    return {
      kind: "match-detail",
      status: "ok",
      requestsUsed: requests,
      message: msg,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Match detail sync failed";
    await finishRun(run.id, "error", requests, msg);
    return {
      kind: "match-detail",
      status: "error",
      requestsUsed: requests,
      message: msg,
    };
  }
}

export async function syncTopScorersJob(): Promise<SyncResult> {
  const run = await startRun("topscorers");
  let requests = 0;
  try {
    let total = 0;
    for (const leagueApiId of TRACKED_LEAGUE_IDS) {
      const competitionId = competitionIdFromApi(leagueApiId);
      const { response } = await getTopScorers(leagueApiId, CURRENT_SEASON);
      requests += 1;
      total += response.length;

      for (const entry of response as Array<{
        player: { id: number; name: string; photo: string };
        statistics: Array<{
          team: { id: number };
          games: { appearences: number | null; rating?: string | null };
          goals: { total: number | null; assists: number | null };
          cards: { yellow: number | null; red: number | null };
        }>;
      }>) {
        const stats = entry.statistics?.[0];
        if (!stats) continue;
        const teamId = await teamIdByApiId(stats.team.id);
        const slug = entitySlug(entry.player.name, entry.player.id);
        const photoPath = await ensureMedia(
          "players",
          entry.player.id,
          entry.player.photo
        );

        await db
          .insert(players)
          .values({
            id: slug,
            apiId: entry.player.id,
            slug,
            name: entry.player.name,
            photoPath,
            position: "FW",
            shirtNumber: 0,
            teamId,
            updatedAt: new Date(),
          })
        .onConflictDoUpdate({
          target: players.apiId,
          set: {
            name: entry.player.name,
            photoPath,
            teamId: teamId ?? undefined,
            // Keep existing shirt number from squad sync when topscorers has none
            updatedAt: new Date(),
          },
        });

        const [player] = await db
          .select()
          .from(players)
          .where(eq(players.apiId, entry.player.id))
          .limit(1);
        if (!player) continue;

        const rating = stats.games?.rating ?? null;

        await db
          .insert(playerSeasonStats)
          .values({
            playerId: player.id,
            competitionId,
            seasonYear: CURRENT_SEASON,
            appearances: stats.games?.appearences ?? 0,
            goals: stats.goals?.total ?? 0,
            assists: stats.goals?.assists ?? 0,
            yellowCards: stats.cards?.yellow ?? 0,
            redCards: stats.cards?.red ?? 0,
            averageRating: rating,
          })
          .onConflictDoUpdate({
            target: [
              playerSeasonStats.playerId,
              playerSeasonStats.competitionId,
              playerSeasonStats.seasonYear,
            ],
            set: {
              appearances: stats.games?.appearences ?? 0,
              goals: stats.goals?.total ?? 0,
              assists: stats.goals?.assists ?? 0,
              yellowCards: stats.cards?.yellow ?? 0,
              redCards: stats.cards?.red ?? 0,
              averageRating: rating,
            },
          });
      }
    }

    const msg = `Top scorers synced (${total})`;
    await finishRun(run.id, "ok", requests, msg);
    return {
      kind: "topscorers",
      status: "ok",
      requestsUsed: requests,
      message: msg,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Top scorers sync failed";
    await finishRun(run.id, "error", requests, msg);
    return {
      kind: "topscorers",
      status: "error",
      requestsUsed: requests,
      message: msg,
    };
  }
}

export async function syncFull(): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  results.push(await syncCatalog());
  if (results.at(-1)?.status === "error") return results;
  results.push(await syncStandingsJob());
  results.push(await syncFixturesJob());
  results.push(await syncSquadsJob());
  results.push(await syncTopScorersJob());
  return results;
}

export async function ensureFixtureDetails(fixtureId: string): Promise<boolean> {
  const [existing] = await db
    .select()
    .from(fixtureDetails)
    .where(eq(fixtureDetails.fixtureId, fixtureId))
    .limit(1);
  if (existing?.lineups || existing?.statistics) return true;

  const [fx] = await db
    .select({ apiId: fixtures.apiId })
    .from(fixtures)
    .where(eq(fixtures.id, fixtureId))
    .limit(1);
  if (!fx) return false;

  const result = await syncMatchDetail(fx.apiId);
  return result.status === "ok";
}

export async function getApiQuota() {
  const { response } = await getStatus();
  return response;
}

export async function getLatestSyncRuns(limit = 10) {
  return db
    .select()
    .from(syncRuns)
    .orderBy(sql`${syncRuns.startedAt} desc`)
    .limit(limit);
}

export async function runSyncJob(
  job: SyncJob,
  opts?: { fixtureApiId?: number }
): Promise<SyncResult | SyncResult[]> {
  switch (job) {
    case "catalog":
      return syncCatalog();
    case "standings":
      return syncStandingsJob();
    case "fixtures":
      return syncFixturesJob();
    case "squads":
      return syncSquadsJob();
    case "live":
      return syncLiveJob();
    case "topscorers":
      return syncTopScorersJob();
    case "match-detail":
      if (!opts?.fixtureApiId) {
        throw new Error("fixtureApiId required for match-detail");
      }
      return syncMatchDetail(opts.fixtureApiId);
    case "full":
      return syncFull();
    default:
      throw new Error(`Unknown job: ${job}`);
  }
}
