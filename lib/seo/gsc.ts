export type GscOverview =
  | {
      connected: false;
      missing: string[];
      setupSteps: string[];
    }
  | {
      connected: true;
      siteUrl: string;
      range: { startDate: string; endDate: string };
      totals: {
        clicks: number;
        impressions: number;
        ctr: number;
        position: number;
      };
      topQueries: Array<{
        query: string;
        clicks: number;
        impressions: number;
        ctr: number;
        position: number;
      }>;
    };

const SETUP_STEPS = [
  "Create a Google Cloud project and enable the Search Console API.",
  "Create an OAuth client (Web) and generate a refresh token for a Search Console owner account.",
  "Verify your site property in Google Search Console.",
  "Set GSC_CLIENT_ID, GSC_CLIENT_SECRET, GSC_REFRESH_TOKEN, and GSC_SITE_URL in the server environment.",
  "Redeploy / restart the app so the Ranking page can load live data.",
];

function missingGscEnv(): string[] {
  const keys = [
    "GSC_CLIENT_ID",
    "GSC_CLIENT_SECRET",
    "GSC_REFRESH_TOKEN",
    "GSC_SITE_URL",
  ] as const;
  return keys.filter((k) => !process.env[k]?.trim());
}

let cache: { at: number; data: GscOverview } | null = null;
const CACHE_MS = 60 * 60 * 1000;

export async function getSearchConsoleOverview(): Promise<GscOverview> {
  const missing = missingGscEnv();
  if (missing.length) {
    return {
      connected: false,
      missing,
      setupSteps: SETUP_STEPS,
    };
  }

  if (cache && Date.now() - cache.at < CACHE_MS) {
    return cache.data;
  }

  const { searchconsole: searchconsoleApi, auth } = await import(
    "@googleapis/searchconsole"
  );
  const oauth2 = new auth.OAuth2(
    process.env.GSC_CLIENT_ID,
    process.env.GSC_CLIENT_SECRET
  );
  oauth2.setCredentials({
    refresh_token: process.env.GSC_REFRESH_TOKEN,
  });

  const searchconsole = searchconsoleApi({ version: "v1", auth: oauth2 });
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 3); // GSC data lag
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 27);

  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);
  const siteUrl = process.env.GSC_SITE_URL!;

  const [totalsRes, queriesRes] = await Promise.all([
    searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: [],
      },
    }),
    searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ["query"],
        rowLimit: 15,
      },
    }),
  ]);

  const totalRow = totalsRes.data.rows?.[0];
  const totals = {
    clicks: totalRow?.clicks ?? 0,
    impressions: totalRow?.impressions ?? 0,
    ctr: totalRow?.ctr ?? 0,
    position: totalRow?.position ?? 0,
  };

  const topQueries =
    queriesRes.data.rows?.map((row) => ({
      query: row.keys?.[0] ?? "",
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      ctr: row.ctr ?? 0,
      position: row.position ?? 0,
    })) ?? [];

  const data: GscOverview = {
    connected: true,
    siteUrl,
    range: { startDate, endDate },
    totals,
    topQueries,
  };

  cache = { at: Date.now(), data };
  return data;
}
