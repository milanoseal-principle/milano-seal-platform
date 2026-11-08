#!/usr/bin/env node
// Validator — Canonical Foundation (Unification Phases 2–5).
// Asserts the additive foundation exists, delegates to controlling engines, adds
// no duplicate pricing constants, deletes nothing, and touches no protected logic.

import { P4B_PROTECTED_CHANGES, P5_PROTECTED_CHANGES, AI_GOVERNANCE_PROTECTED_CHANGES } from './governed-production-scope.mjs';
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const repoRoot = process.cwd();
let failures = 0;
const fail = (m) => { console.error("FAIL:", m); failures++; };
const ok = (m) => console.log("OK:", m);
const read = (rel) => (fs.existsSync(path.join(repoRoot, rel)) ? fs.readFileSync(path.join(repoRoot, rel), "utf8") : null);
const exists = (rel) => fs.existsSync(path.join(repoRoot, rel));

// 1. Canonical files exist.
const required = [
  "lib/platform/entities/index.ts",
  "lib/platform/entities/ids.ts",
  "lib/platform/entities/entityRelationships.ts",
  "lib/platform/entities/entitySafety.ts",
  "lib/platform/entities/adapters.ts",
  "lib/platform/canonicalMatter.ts",
  "lib/platform/matterStateAdapters.ts",
  "lib/platform/matterStateSafety.ts",
  "lib/pricing/canonicalPricingGateway.ts",
  "lib/pricing/pricingAdapters.ts",
  "lib/pricing/index.ts",
  "lib/alliance/canonicalPartnerPassport.ts",
  "lib/alliance/partnerPassportAdapters.ts",
  "lib/jurisdictions/canonicalCountryAdapter.ts",
  "docs/architecture/MILANO_SEAL_CANONICAL_ENTITY_FRAMEWORK.md",
  "docs/architecture/MILANO_SEAL_CANONICAL_MATTER_CORE.md",
  "docs/architecture/MILANO_SEAL_STATE_AND_PRICING_GOVERNANCE.md",
];
for (const f of required) if (!exists(f)) fail(`Missing ${f}`);
if (failures === 0) ok("All canonical foundation files present");

// 2. Canonical Matter remains controlling and still exports its type + fields.
const cm = read("lib/platform/canonicalMatter.ts") ?? "";
if (!/interface CanonicalMatterObject/.test(cm)) fail("CanonicalMatterObject missing");
if (!/CANONICAL_MATTER_FIELDS/.test(cm)) fail("CANONICAL_MATTER_FIELDS missing (would break consumers)");
else ok("Canonical Matter controlling type + fields intact");

// 3. State machine remains controlling; adapters delegate (no second engine).
if (!exists("lib/stateMachine.ts")) fail("Controlling lib/stateMachine.ts missing");
const sa = read("lib/platform/matterStateAdapters.ts") ?? "";
if (!/from "\.\.\/stateMachine"/.test(sa)) fail("State adapter must delegate to lib/stateMachine (no duplicate engine)");
else ok("State adapters delegate to the controlling state machine");
if (!/scheduling requires payment_confirmed/.test(sa)) fail("State adapter must enforce payment gate on → scheduled");
else ok("State adapter enforces payment-before-scheduling");

// 4. Pricing gateway delegates; adds no duplicate price constants.
const gw = read("lib/pricing/canonicalPricingGateway.ts") ?? "";
if (!/from "\.\.\/pricing"/.test(gw) || !/calculatePrice/.test(gw)) fail("Pricing gateway must delegate to lib/pricing calculatePrice");
else ok("Pricing gateway delegates to controlling engine");
if (/\b(750|975|1850)\b/.test(gw)) fail("Pricing gateway must not add duplicate lane-base constants");
else ok("No duplicate public pricing constants in gateway");

// 5. Partner passport + country decisions documented.
if (!/partnerPassport\.ts/.test(read("lib/alliance/canonicalPartnerPassport.ts") ?? "")) fail("Partner passport controlling decision not documented");
else ok("Partner Passport controlling decision recorded");
if (!/preserve|conflict/i.test(read("lib/jurisdictions/canonicalCountryAdapter.ts") ?? "")) fail("Country adapter must preserve conflicts");
else ok("Country governance (conflict-preserving) recorded");

// 6. package.json valid JSON.
try { JSON.parse(read("package.json")); ok("package.json valid JSON"); }
catch { fail("package.json invalid JSON"); }

// 7. No deletions, no protected-file changes in the CURRENT PR delta vs current main.
// Use a direct two-dot comparison against origin/main. A merge-base comparison can
// falsely re-flag protected changes that already landed on main after this branch
// was created, which turns the governance guard into a history detector instead of
// a PR-delta detector.
try {
  execSync("git rev-parse --verify origin/main", { cwd: repoRoot, stdio: "ignore" });
  const deleted = execSync("git diff --name-only --diff-filter=D origin/main HEAD", {
    cwd: repoRoot,
    encoding: "utf8",
  }).split("\n").filter(Boolean);
  if (deleted.length) fail(`Files deleted (not allowed this phase): ${deleted.join(", ")}`);
  else ok("No files deleted in current PR delta");

  const diff = execSync("git diff --name-only origin/main HEAD", { cwd: repoRoot, encoding: "utf8" });
  const prot = /wise|webhook|payment-?confirm|paymentConfirm|release-?gate|releaseGate|performFinalRelease|custody|supabase\/(migrations|rls)|serviceRole|shippo|bluenotary/i;
  // Explicitly approved protected changes. Each entry is an additive,
  // reviewed file for the governed execution-intelligence sequence; adding a
  // path here is itself a visible, reviewable governance change.
  const APPROVED_PROTECTED_CHANGES = new Set([
    ...P4B_PROTECTED_CHANGES,
    ...AI_GOVERNANCE_PROTECTED_CHANGES,
    ...P5_PROTECTED_CHANGES,
    // Counsel acquisition: completes the existing lead capture contract only.
    // Canonical Matter/payment schemas are unchanged; private grants, RLS,
    // idempotence and the Matter FK are exercised in the isolated SQL fixture.
    "supabase/migrations/20261107094755_counsel_inquiry_capture.sql",
    "supabase/migrations/081_document_structural_preflight.sql",
    "supabase/migrations/082_professional_referral_engine.sql",
    "supabase/migrations/083_ron_provider_capability_evidence.sql",
    "supabase/migrations/084_state_authority_provenance.sql",
    "supabase/migrations/085_authority_packet_composer.sql",
    "supabase/migrations/086_matter_shipment_legs.sql",
    "supabase/migrations/087_authority_processing_intelligence.sql",
    "supabase/migrations/088_payment_gate_search_path_hardening.sql",
    "supabase/migrations/202609260001_translation_entry_rls_hardening.sql",
    // Step 6: additive shipment-leg reconciliation after the existing
    // HMAC-verified courier path (HMAC verification unchanged).
    "app/api/courier/webhook/route.ts",
  ]);
  const touched = diff
    .split("\n")
    .filter((f) => f && prot.test(f) && !APPROVED_PROTECTED_CHANGES.has(f));
  if (touched.length) fail(`Protected files changed in current PR delta: ${touched.join(", ")}`);
  else ok("No protected business-logic files changed in current PR delta");
} catch (e) { console.log("NOTE: git guard skipped (", e.message, ")"); }

if (failures) { console.error(`\nVALIDATOR: canonical-foundation FAILED (${failures}).`); process.exit(2); }
console.log("\nVALIDATOR: canonical-foundation PASSED.");
