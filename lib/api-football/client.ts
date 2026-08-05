import { API_FOOTBALL_BASE } from "./constants";

export type ApiFootballEnvelope<T> = {
  get: string;
  parameters: Record<string, string>;
  errors: unknown;
  results: number;
  paging?: { current: number; total: number };
  response: T;
};

export class ApiFootballError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = "ApiFootballError";
  }
}

function getApiKey(): string {
  const key = process.env.KOORALIVE_API_KEY?.trim();
  if (!key) {
    throw new ApiFootballError("KOORALIVE_API_KEY is not set", 0);
  }
  return key;
}

/** Free plan: 10 requests/minute — space calls ~7s apart. */
const MIN_INTERVAL_MS = Number(process.env.AF_MIN_INTERVAL_MS || 7000);
let lastRequestAt = 0;
let requestChain: Promise<void> = Promise.resolve();

async function throttle(): Promise<void> {
  const run = async () => {
    const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastRequestAt));
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequestAt = Date.now();
  };
  requestChain = requestChain.then(run, run);
  await requestChain;
}

/** Only the documented header — no extra headers (JS frameworks often break CORS/API rules). */
export async function apiFootballGet<T>(
  path: string,
  query?: Record<string, string | number | boolean | undefined | null>
): Promise<ApiFootballEnvelope<T>> {
  await throttle();

  const url = new URL(path.replace(/^\//, ""), `${API_FOOTBALL_BASE}/`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === "") continue;
      url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "x-apisports-key": getApiKey(),
    },
    cache: "no-store",
  });

  const body = (await res.json()) as ApiFootballEnvelope<T> & {
    message?: string;
  };

  if (!res.ok) {
    throw new ApiFootballError(
      body.message || `API-Football HTTP ${res.status}`,
      res.status,
      body
    );
  }

  const errors = body.errors;
  const hasErrors =
    (Array.isArray(errors) && errors.length > 0) ||
    (errors &&
      typeof errors === "object" &&
      !Array.isArray(errors) &&
      Object.keys(errors as object).length > 0);

  if (hasErrors) {
    throw new ApiFootballError(
      `API-Football errors: ${JSON.stringify(errors)}`,
      res.status,
      body
    );
  }

  return body;
}
