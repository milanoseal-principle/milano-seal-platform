import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const requiredFiles = [
  "lib/revenue/clientRevenueStack.ts",
  "lib/revenue/revenueLaneRegistry.ts",
  "lib/revenue/revenueProjectionEngine.ts",
  "lib/revenue/grossMarginModel.ts",
  "lib/revenue/investorFinancialModel.ts",
  "lib/revenue/index.ts",
  "app/dashboard/revenue/page.tsx",
  "components/dashboard/revenue/FounderRevenueCommand.tsx",
  "app/founder/page.tsx",
  "docs/revenue/MILANO_SEAL_REVENUE_STREAM_ENGINE.md",
];

const failures = [];
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(process.cwd(), file))) failures.push(`Missing required file: ${file}`);
}

const bannedPublicPhrases = [
  "guaranteed acceptance",
  "guaranteed assignments",
  "guaranteed income",
  "TSA cleared",
  "airport approved",
  "airline approved",
  "legal advice",
  "immigration advice",
  "custody advice",
];

const publicFiles = ["app/founder/page.tsx", "docs/revenue/MILANO_SEAL_REVENUE_STREAM_ENGINE.md"];
for (const file of publicFiles) {
  const text = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  for (const phrase of bannedPublicPhrases) {
    if (text.includes(`We provide ${phrase}`) || text.includes(`provides ${phrase}`)) failures.push(`Unsafe affirmative claim in ${file}: ${phrase}`);
  }
}

const changed = run("git", ["diff", "--name-only", "HEAD~1..HEAD"]);
const protectedPatterns = [
  /^app\/api\/webhooks?\/wise/,
  /^app\/api\/webhook\/wise/,
  /^app\/api\/deals\/.*payment/,
  /^app\/api\/deals\/.*release/,
  /^src\/features\/payments\//,
  /^src\/features\/release\//,
  /^src\/features\/ledger\//,
  /^lib\/wise/,
  /^lib\/supabase/,
  /^src\/features\/shipping\//,
  /^src\/features\/execution\/blueNotaryAdapter/,
];
for (const file of changed.split("\n").filter(Boolean)) {
  if (protectedPatterns.some((pattern) => pattern.test(file))) failures.push(`Protected file changed: ${file}`);
}

const revenueRegistry = fs.readFileSync("lib/revenue/revenueLaneRegistry.ts", "utf8");
for (const expected of ["airport_area_emergency_execution", "ron_alliance_partner_spread", "Payment-Gated Execution", "International Courier Release"]) {
  if (!revenueRegistry.includes(expected)) failures.push(`Revenue registry missing: ${expected}`);
}

if (failures.length) {
  console.error("Revenue stream engine validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Revenue stream engine validation passed.");

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  return result.stdout ?? "";
}
