import fs from "node:fs";
import { spawnSync } from "node:child_process";

const requiredFiles = [
  "lib/alliance/intelligence/trustNetworkRegistry.ts",
  "lib/alliance/intelligence/allianceIntelligenceGraph.ts",
  "lib/alliance/intelligence/partnerPassport.ts",
  "lib/alliance/intelligence/dispatchIntelligence.ts",
  "lib/alliance/intelligence/index.ts",
  "components/dashboard/alliance/intelligence/TrustNetworkCommandCenter.tsx",
  "app/dashboard/alliance/intelligence-platform/page.tsx",
  "docs/alliance/TRUST_NETWORK_INTELLIGENCE_PLATFORM.md",
];

const failures = [];
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing required file: ${file}`);
}

const requiredText = ["Professional License", "Verified Alliance", "Strategic Alliance", "Enterprise Alliance", "Partner Passport", "Global Document Intelligence™"];
const combined = requiredFiles.filter((file) => fs.existsSync(file)).map((file) => fs.readFileSync(file, "utf8")).join("\n");
for (const text of requiredText) {
  if (!combined.includes(text)) failures.push(`Missing trust-network text: ${text}`);
}

const unsafeAffirmativeClaims = ["guaranteed assignments", "guaranteed income", "guaranteed acceptance", "exclusive territory", "TSA certified", "airport approved", "airline approved", "government approved"];
for (const claim of unsafeAffirmativeClaims) {
  if (combined.includes(`We provide ${claim}`) || combined.includes(`provides ${claim}`) || combined.includes(`offers ${claim}`)) failures.push(`Unsafe affirmative claim: ${claim}`);
}

const changed = process.env.VERCEL === "1" ? "" : run("git", ["diff", "--name-only", "HEAD~1..HEAD"]);
// Exact founder-authorized settlement doctrine copy correction, covered by the
// canonical payment unit/SQL suites. All other trust-network protected paths remain denied.
const AUTHORIZED_CURRENT_DELTA = new Set(['lib/wise/reconciliation-exceptions.ts']);
const protectedPatterns = [/^app\/api\/webhooks?\/wise/, /^app\/api\/webhook\/wise/, /^app\/api\/deals\/.*payment/, /^app\/api\/deals\/.*release/, /^src\/features\/payments\//, /^src\/features\/release\//, /^src\/features\/ledger\//, /^lib\/wise/, /^lib\/supabase/, /^src\/features\/shipping\//, /^src\/features\/execution\/blueNotaryAdapter/];
for (const file of changed.split("\n").filter(Boolean)) {
  if (!AUTHORIZED_CURRENT_DELTA.has(file) && protectedPatterns.some((pattern) => pattern.test(file))) failures.push(`Protected file changed: ${file}`);
}

if (failures.length) {
  console.error("Trust network intelligence validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Trust network intelligence validation passed.");

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  return result.stdout ?? "";
}
