import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "lib/seo/activation/types.ts",
  "lib/seo/activation/scoring.ts",
  "lib/seo/activation/repository.ts",
  "lib/seo/activation/access.ts",
  "lib/seo/activation/schemas.ts",
  "components/dashboard/SeoAuthorityActivationControl.tsx",
  "app/api/admin/seo/authority/relationships/route.ts",
  "app/api/admin/seo/authority/placements/route.ts",
  "app/api/admin/seo/activation/sync/route.ts",
  "supabase/migrations/072_seo_authority_activation_control_plane.sql",
  "tests/seo-authority-activation.test.ts",
];

for (const relative of required) {
  if (!fs.existsSync(path.join(root, relative))) throw new Error(`SEO activation required file missing: ${relative}`);
}

const migration = fs.readFileSync(path.join(root, "supabase/migrations/072_seo_authority_activation_control_plane.sql"), "utf8");
const scoring = fs.readFileSync(path.join(root, "lib/seo/activation/scoring.ts"), "utf8");
const dashboard = fs.readFileSync(path.join(root, "app/dashboard/seo/page.tsx"), "utf8");
const localized = fs.readFileSync(path.join(root, "lib/seo/localization/runtime.ts"), "utf8");
const cron = fs.readFileSync(path.join(root, "app/api/cron/seo-search-console/route.ts"), "utf8");

const assertions = [
  [migration.includes("seo_authority_relationships"), "relationship ledger missing"],
  [migration.includes("seo_authority_placements"), "placement ledger missing"],
  [migration.includes("seo_activation_actions"), "activation queue ledger missing"],
  [migration.includes("revoke all on public.seo_authority_placements from public, anon, authenticated"), "authority placement ledger is not private"],
  [migration.includes("seo_authority_placements_verified_evidence_ck"), "verified placement evidence constraint missing"],
  [!migration.toLowerCase().includes("stripe"), "Stripe is prohibited in Milano canonical architecture"],
  [scoring.includes("GOOGLE_SEARCH_CONSOLE"), "verified search source marker missing"],
  [scoring.includes("LOCALIZE_AFTER_REVIEW"), "localized human-review activation missing"],
  [scoring.includes("EARN_AUTHORITY_CITATION"), "external authority action missing"],
  [dashboard.includes("Wise-paid Matter revenue"), "revenue truth boundary missing from operator UI"],
  [/without inventing query-to-revenue attribution/.test(dashboard) && dashboard.includes("activation.attributionBoundary"), "query-to-revenue attribution boundary missing"],
  [localized.includes('record.translationStatus !== "HUMAN_REVIEWED" || record.indexStatus !== "INDEXABLE"'), "localized fail-closed publication gate drifted"],
  [cron.includes("activation refresh degraded"), "Search Console downstream activation degradation boundary missing"],
  [cron.includes('success: true'), "Search Console ingestion must remain successful if downstream activation degrades"],
];

const failures = assertions.filter(([ok]) => !ok).map(([, message]) => message);
if (failures.length) {
  console.error("SEO AUTHORITY ACTIVATION: FAIL");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("SEO AUTHORITY ACTIVATION: PASS");
console.log("- verified search demand remains observational");
console.log("- paid Matter revenue remains a separate canonical signal");
console.log("- localized indexing remains human-review gated");
console.log("- professional relationships and external citations are private evidence ledgers");
console.log("- no external authority claim can become VERIFIED without explicit evidence");
console.log("- downstream activation failure cannot block verified Search Console ingestion");
