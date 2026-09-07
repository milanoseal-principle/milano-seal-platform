import { readFileSync } from "node:fs";

const read = (p) => readFileSync(p, "utf8");
const release = read("lib/release/performFinalRelease.ts");
const readiness = read("lib/release/releaseReviewEvidence.ts");
const route = read("app/api/dashboard/matters/[id]/release-review/route.ts");
const panel = read("components/dashboard/FinalSealReviewPanel.tsx");
const migration = read("supabase/migrations/078_final_release_review_evidence.sql");

const checks = [
  ["durable release evidence table", /final_release_review_evidence/.test(migration)],
  ["immutable decision receipt table", /final_release_review_events/.test(migration)],
  ["release evidence service-role governed", /revoke all[\s\S]*anon, authenticated/.test(migration) && /grant select, insert, update[\s\S]*service_role/.test(migration)],
  ["canonical release path consumes server readiness", /loadCanonicalReleaseReadiness\(deal\.id\)/.test(release)],
  ["release fails closed on integrity gate", /!readiness\.gate\.canRelease/.test(release) && /FINAL_RELEASE_BLOCKED/.test(release)],
  ["settlement remains fail closed", /Verified Wise settlement is required before final release/.test(release)],
  ["RON completion comes from canonical provider session", /ron_sessions/.test(readiness) && /RON_COMPLETED/.test(readiness)],
  ["apostille completion comes from canonical Matter evidence", /apostille_at/.test(readiness) && /apostille_required/.test(readiness)],
  ["Italy identifier lock is still required", /identifier_locks/.test(readiness) && /codice_fiscale/.test(readiness)],
  ["missing review evidence defaults blocked", /review\?\.final_pdf_locked === true/.test(readiness) && /review\?\.founder_approved === true/.test(readiness)],
  ["operator and founder API is authenticated", /isOperatorOrFounder/.test(route)],
  ["founder-only final approval enforced", /founder_approved/.test(route) && /isFounderAdmin/.test(route)],
  ["compliance-hold clearance founder governed", /requested\.compliance_hold === false/.test(route)],
  ["review changes write decision receipts", /final_release_review_events/.test(route) && /previous_state/.test(route) && /new_state/.test(route)],
  ["browser panel reads server gate", /release-review/.test(panel) && /gate\.canRelease/.test(panel)],
  ["browser panel does not use legacy local checklist authority", !/buildFinalReleaseChecklist|evaluateFinalRelease\(/.test(panel)],
  ["no fake browser release approval", !/All internal checks complete/.test(panel)],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
  if (!ok) failed++;
}

console.log(`Final release governance: ${checks.length - failed}/${checks.length} passed`);
if (failed) process.exit(1);
