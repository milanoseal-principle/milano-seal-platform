import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));

const required = [
  "lib/control-plane/hardeningRegistry.ts",
  "lib/control-plane/architectureGovernance.ts",
  "lib/international-execution/operationalGovernance.ts",
  "lib/matter/matterTruthGovernance.ts",
  "lib/matter/evidenceLedger.ts",
  "lib/alliance/executionGovernance.ts",
  "lib/intelligence/controlCenter.ts",
  "components/control-plane/SystemControlPlaneModes.tsx",
  "app/dashboard/reconciliation/page.tsx",
  "app/dashboard/matters/[matterId]/truth/page.tsx",
  "lib/control-plane/liveAcceptance.ts",
  "docs/control-plane/08_LIVE_ACCEPTANCE_37_45.md",
  "supabase/migrations/055_matter_evidence_ledger.sql",
  "tests/full-system-hardening.test.ts",
  "scripts/validate-control-plane-route-coverage.mjs",
  "scripts/validate-control-plane-module-coverage.mjs",
];
for (const file of required) if (!exists(file)) failures.push(`Missing full-system hardening file: ${file}`);

if (!failures.length) {
  const typeTest = read("lib/control-plane/__tests__/internationalDocumentExecutionProfile.test.ts");
  const international = read("lib/international-execution/operationalGovernance.ts");
  const matter = read("lib/matter/matterTruthGovernance.ts");
  const alliance = read("lib/alliance/executionGovernance.ts");
  const intelligence = read("lib/intelligence/controlCenter.ts");
  const architecture = read("lib/control-plane/architectureGovernance.ts");
  const registry = read("lib/control-plane/hardeningRegistry.ts");
  const modes = read("components/control-plane/SystemControlPlaneModes.tsx");
  const apiDeals = read("app/api/deals/route.ts");
  const migration = read("supabase/migrations/055_matter_evidence_ledger.sql");
  const live = read("lib/control-plane/liveAcceptance.ts");
  const certification = read("docs/FINAL_PRODUCTION_CERTIFICATION.md");

  if (!typeTest.includes('(typeof INTERNATIONAL_EXECUTION_LANES)[number]["id"]')) failures.push("Execution-lane test no longer derives its strict union from the canonical lane registry.");
  if (/as any|@ts-ignore/.test(typeTest)) failures.push("Execution-lane test uses forbidden type escape hatch.");

  for (const token of ["contractingParties: 129", "DOCUMENT_ORIGIN_ROUTING_MATRIX", "evaluateRonEligibility", "evaluateWitnessGovernance", "evaluateTranslationGovernance", "evaluateDocumentMedium", "evaluateAuthorityFreshness"]) if (!international.includes(token)) failures.push(`International execution governance missing: ${token}`);
  for (const token of ["findMatterDiscrepancies", "deriveMatterCompleteness", "release_without_custody", "payment_amount_mismatch", "completion_truth_conflict"]) if (!matter.includes(token)) failures.push(`Matter truth governance missing: ${token}`);
  for (const token of ["deriveDispatchDecision", "COMPLIANCE_NOT_CURRENT", "transitionAssignment", "REASSIGNMENT_REQUIRED"]) if (!alliance.includes(token)) failures.push(`Alliance execution governance missing: ${token}`);
  for (const token of ["buildTruthFailureAlerts", "groupReconciliation", "buildProvenanceEdge", "deriveClientReturnProjection"]) if (!intelligence.includes(token)) failures.push(`Intelligence consolidation missing: ${token}`);
  for (let i = 1; i <= 10; i += 1) if (!architecture.includes(`ADR-${String(i).padStart(3, "0")}`)) failures.push(`Missing permanent architecture decision ADR-${String(i).padStart(3, "0")}`);
  for (const id of ["control_plane_architecture_governance", "international_execution_governance", "matter_truth_view", "execution_reconciliation_center", "alliance_execution_governance", "matter_evidence_ledger", "live_acceptance_37_45"]) if (!registry.includes(`id: \"${id}\"`)) failures.push(`Missing registered hardening capability ${id}`);
  for (const view of ["EXECUTIVE", "CTO", "OPERATOR", "129", "Registry Explorer", "What requires attention?"]) if (!modes.includes(view)) failures.push(`Control Plane UX missing ${view}`);

  if (!apiDeals.includes("resolveServerRole") || !apiDeals.includes("UNAUTHENTICATED") || !apiDeals.includes("FORBIDDEN")) failures.push("Matter list API is not protected by canonical server role resolution.");
  if (/user_metadata/.test(apiDeals)) failures.push("Matter list API trusts prohibited user_metadata authorization.");

  if (!migration.includes("matter_evidence_ledger") || !migration.includes("append-only") || !migration.includes("prevent_matter_evidence_ledger_mutation")) failures.push("Immutable Matter evidence ledger is not fail-closed against destructive mutation.");
  if (!migration.includes("auth.jwt() -> 'app_metadata'")) failures.push("Evidence/audit RLS is not app_metadata-authoritative.");
  if (/auth\.jwt\(\)\s*->\s*'user_metadata'/.test(migration)) failures.push("New evidence migration reintroduced user_metadata role authority.");

  const secretNamesOnly = architecture.match(/environmentVariables:\s*\[[^\]]*\]/g) ?? [];
  if (!secretNamesOnly.length) failures.push("Environment dependency registry is missing variable-name metadata.");
  if (/sk_live_|Bearer\s+[A-Za-z0-9]|eyJ[a-zA-Z0-9_-]{10,}/.test(architecture)) failures.push("Environment registry appears to contain a secret value.");

  for (let id = 37; id <= 45; id += 1) {
    if (!live.includes(`id: ${id}`)) failures.push(`Live acceptance gate ${id} is missing.`);
    const pattern = new RegExp(`id: ${id},[\\s\\S]{0,180}status: \\\"PENDING\\\"`);
    if (!pattern.test(live)) failures.push(`Live acceptance gate ${id} is not fail-closed PENDING.`);
  }
  if (!/LIVE VERCEL CERTIFICATION\s+PENDING/.test(certification) || !/WISE PRODUCTION E2E\s+PENDING/.test(certification)) failures.push("Controlling production certification no longer preserves required PENDING live evidence.");

  const combined = [international, matter, alliance, intelligence, architecture, registry].join("\n");
  if (/Stripe/i.test(combined)) failures.push("Full-system hardening reintroduced prohibited Stripe language.");
  if (/trust\s+score|weighted\s+score|best\s+partner/i.test(combined)) failures.push("Full-system hardening introduced synthetic score/ranking language.");
}

if (failures.length) {
  console.error("Full system hardening validation failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log("PASS full system hardening: Control Plane, international execution governance, Matter Truth, reconciliation, Alliance governance, evidence ledger, security registries and live-acceptance boundaries are locked without a second Matter/payment engine.");
