import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL is not set — database features will fail.");
}

// Aiven free plans often allow ~20 connections total. Keep this tiny so
// Next.js multi-worker builds / serverless instances do not exhaust the pool.
const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.pgClient ??
  postgres(connectionString || "postgres://localhost:5432/kooralive", {
    ssl: "require",
    max: 1,
    idle_timeout: 20,
    connect_timeout: 30,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgClient = client;
}

export const db = drizzle(client, { schema });
