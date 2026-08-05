import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL is not set — database features will fail.");
}

// Aiven free plans often allow ~20 connections total. Keep this tiny in
// production so Next.js multi-worker builds / serverless instances do not
// exhaust the pool. In dev there's only ever one process, and pages issue
// several independent queries per request (Promise.all) — with max: 1 those
// were serialized onto a single connection instead of running concurrently,
// which is why every page load paid for the network round trip to Aiven
// once per query instead of once total.
const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.pgClient ??
  postgres(connectionString || "postgres://localhost:5432/kooralive", {
    ssl: "require",
    max: process.env.NODE_ENV === "production" ? 1 : 10,
    idle_timeout: 20,
    connect_timeout: 30,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgClient = client;
}

export const db = drizzle(client, { schema });
