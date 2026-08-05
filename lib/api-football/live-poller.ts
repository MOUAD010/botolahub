/**
 * Live match-day poller — call only while fixtures are in play.
 * Uses the Free-plan budget carefully (events+lineups per live match).
 *
 * Usage:
 *   npm run sync:football:live
 *   # or loop every 8 minutes:
 *   npm run sync:football:poll
 */
import "dotenv/config";
import { runSyncJob } from "./sync";

const INTERVAL_MS = Number(process.env.LIVE_POLL_INTERVAL_MS || 8 * 60 * 1000);
const once = process.argv.includes("--once") || process.argv[2] === "live";

async function tick() {
  console.log(`[live-poller] ${new Date().toISOString()} running live sync…`);
  const result = await runSyncJob("live");
  console.log(JSON.stringify(result, null, 2));
  return result;
}

async function main() {
  if (once) {
    const result = await tick();
    const failed = Array.isArray(result)
      ? result.some((r) => r.status === "error")
      : result.status === "error";
    process.exit(failed ? 1 : 0);
  }

  console.log(
    `[live-poller] polling every ${Math.round(INTERVAL_MS / 1000)}s (Ctrl+C to stop)`
  );
  await tick();
  setInterval(() => {
    void tick().catch((e) => console.error(e));
  }, INTERVAL_MS);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
