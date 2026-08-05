import "dotenv/config";
import { runSyncJob } from "./sync";

const job = (process.argv[2] as
  | "catalog"
  | "standings"
  | "fixtures"
  | "squads"
  | "live"
  | "topscorers"
  | "full"
  | undefined) ?? "full";

async function main() {
  console.log(`Starting football sync: ${job}`);
  const result = await runSyncJob(job);
  console.log(JSON.stringify(result, null, 2));
  const failed = Array.isArray(result)
    ? result.some((r) => r.status === "error")
    : result.status === "error";
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
