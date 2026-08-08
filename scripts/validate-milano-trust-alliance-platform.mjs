import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  "lib/trust-network/types.ts",
  "lib/trust-network/tierRegistry.ts",
  "lib/trust-network/platformSpaces.ts",
  "lib/trust-network/valueModel.ts",
  "lib/trust-network/revenueModel.ts",
  "lib/trust-network/safetyRules.ts",
  "lib/alliance/types.ts",
  "lib/alliance/onboardingPipeline.ts",
  "lib/alliance/memberTypes.ts",
  "lib/alliance/readinessScore.ts",
  "lib/alliance/alliancePassport.ts",
  "lib/alliance/dispatchEngine.ts",
  "lib/alliance/complianceEngine.ts",
  "lib/alliance/trustLedger.ts",
  "lib/intelligence-platform/types.ts",
  "lib/intelligence-platform/smartIntakeEngine.ts",
  "lib/intelligence-platform/threeTierPricingEngine.ts",
  "lib/intelligence-platform/hagueIntelligenceEngine.ts",
  "lib/intelligence-platform/globalJurisdictionRegistry.ts",
  "lib/intelligence-platform/apostilleRoutingEngine.ts",
  "lib/intelligence-platform/governmentOpportunityCenter.ts",
  "lib/intelligence-platform/executionQAEngine.ts",
  "lib/intelligence-platform/revenueForecastEngine.ts",
  "components/trust-alliance-platform/index.tsx",
  "app/dashboard/trust-network/page.tsx",
  "app/dashboard/intelligence-platform/page.tsx"
];

const requiredExports = [
  "TRUST_NETWORK_TIERS",
  "PLATFORM_SPACES",
  "ALLIANCE_ONBOARDING_PIPELINE",
  "ALLIANCE_SCORE_CATEGORIES",
  "ALLIANCE_DISPATCH_STAGES",
  "TRUST_LEDGER_EVENT_TYPES",
  "THREE_TIER_EXECUTION_LANES",
  "SMART_INTAKE_FACTORS",
  "HAGUE_INTELLIGENCE_ENGINE",
  "GOVERNMENT_OPPORTUNITY_SIGNALS"
];

const forbidden = [
  ["c", "o", "u", "s", "i", "n", "s"].join(""),
  ["f", "a", "m", "i", "l", "y"].join(""),
  ["y", "a", "p", "p", "y"].join(""),
  ["t", "a", "b", "l", "e"].join(""),
  ["c", "r", "e", "w"].join(""),
  ["c", "o", "u", "n", "c", "i", "l"].join(""),
  ["k", "e", "y", "s"].join("")
];

const bannedClaims = [
  "guaranteed referrals",
  "guaranteed income",
  "guaranteed assignments",
  "legal advice",
  "immigration advice",
  "medical advice",
  "government endorsement"
];

const files = requiredFiles.map((file) => path.join(root, file));
const missing = files.filter((file) => !fs.existsSync(file));
if (missing.length) {
  console.error("Missing required files:\n" + missing.map((file) => path.relative(root, file)).join("\n"));
  process.exit(1);
}

const moduleText = requiredFiles
  .filter((file) => file.startsWith("lib/") || file.startsWith("components/") || file.startsWith("app/"))
  .map((file) => fs.readFileSync(path.join(root, file), "utf8"))
  .join("\n")
  .toLowerCase();

for (const term of forbidden) {
  if (moduleText.includes(term)) {
    console.error(`Forbidden competitor/community term found: ${term}`);
    process.exit(1);
  }
}

for (const claim of bannedClaims) {
  const allowedNegation = `no ${claim}`;
  if (moduleText.includes(claim) && !moduleText.includes(allowedNegation)) {
    console.error(`Unsafe claim found without explicit negation: ${claim}`);
    process.exit(1);
  }
}

const exportsText = requiredFiles.map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
for (const exportName of requiredExports) {
  if (!exportsText.includes(exportName)) {
    console.error(`Missing required export/content marker: ${exportName}`);
    process.exit(1);
  }
}

const pricing = fs.readFileSync(path.join(root, "lib/intelligence-platform/threeTierPricingEngine.ts"), "utf8");
for (const expected of ["price: 750", "price: 975", "price: 1850", "24–72 Hours", "Same Day–48 Hours"]) {
  if (!pricing.includes(expected)) {
    console.error(`Missing canonical Milano Seal pricing marker: ${expected}`);
    process.exit(1);
  }
}

console.log("Milano Seal Trust Network / Alliance / Intelligence Platform validation passed.");
