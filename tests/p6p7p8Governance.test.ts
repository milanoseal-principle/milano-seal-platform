import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { acceptanceMismatch, missingAcceptances, type PolicyVersionRow } from "../lib/policy/acceptance";

const read = (path: string) => readFileSync(path, "utf8");
const p7 = read("supabase/migrations/20261108110000_p7_retention_matrix.sql");
const p8 = read("supabase/migrations/20261108120000_p8_policy_registry_acceptance.sql");\nconst p8Atomic = read("supabase/migrations/20261108150000_policy_atomic_acceptance_governance.sql");
const acceptRoute = read("app/api/portal/me/policy-acceptance/route.ts");
const adminRoute = read("app/api/dashboard/policies/route.ts");
const payment = read("app/api/portal/me/payment-observation/route.ts");
const pricing = read("lib/pricing.ts");

// ── P6 external provider fee separation ───────────────────────────────────────
test("P6 provider fee evidence never enters Milano quote, Wise amount or revenue", () => {
  assert.doesNotMatch(pricing, /EXTERNAL_PROVIDER_NOTARIAL_FEE|provider_fee_evidence|bluenotary/i);
  assert.doesNotMatch(read("lib/economics/matterEconomics.ts"), /provider_fee_evidence|bluenotary/i);
  assert.doesNotMatch(payment, /provider_fee_evidence/);
  assert.match(read("scripts/validate-provider-fee-separation.mjs"), /providerFeeSeparation\\.test\\.ts/);\n  assert.doesNotMatch(read("scripts/validate-provider-fee-separation.mjs"), /OWNER DECISION REQUIRED/);
});

// ── P7 retention matrix ───────────────────────────────────────────────────────
test("P7 every inventoried class is registered; unresolved durations stay review_required", () => {
  for (const id of ["RON_STATUTORY_EVIDENCE", "MATTER_RECORD", "INTAKE_AND_LEAD", "CLIENT_UPLOAD", "EXECUTED_DOCUMENT", "PAYMENT_RECORD",
    "CUSTODY_EVIDENCE", "AUTHENTICATION_COURIER", "NOTIFICATION_RECORD", "POLICY_ACCEPTANCE", "SECURITY_AUDIT", "COUNSEL_INQUIRY"]) {
    assert.match(p7, new RegExp(`\\('${id}'`), `${id} registered`);
  }
  const resolved = p7.match(/'resolved'\)/g) ?? [];
  assert.equal(resolved.length, 1, "only the RON class has a governed duration");
  assert.match(p7, /'FL_RON_10Y',10/);
  assert.match(p7, /check \(policy_status <> 'resolved' or \(duration_years is not null and basis is not null\)\)/);
});

test("P7 unresolved class fails closed; cross-class isolation; class history immutable", () => {
  assert.match(p7, /RETENTION_CLASS_NOT_DELETION_ELIGIBLE/);
  assert.match(p7, /retention_records_class_fk/);
  assert.match(p7, /RESOLVED_RETENTION_CLASS_IMMUTABLE/);
  assert.match(p7, /RETENTION_CLASS_IMMUTABLE/);
  assert.doesNotMatch(p7, /\bdelete from\b|\bdrop table\b/i);
});

// ── P8 versioned policy acceptance ────────────────────────────────────────────
const v1: PolicyVersionRow = { id: "v1", policy_type: "TERMS_OF_SERVICE", version: "1", content_sha256: "a".repeat(64), effective_at: "2026-01-01T00:00:00Z", status: "active", required_surfaces: ["wise_payment_submission"] };

test("P8 policy versions are immutable and supersession preserves history", () => {
  assert.match(p8, /POLICY_VERSION_IMMUTABLE/);
  assert.match(p8, /INVALID_POLICY_STATUS_TRANSITION/);
  assert.match(p8, /policy_versions_one_active_per_type/);
  assert.match(adminRoute, /update\(\{ status: "superseded" \}\)/);
  assert.doesNotMatch(adminRoute, /from\("policy_acceptances"\)\.(update|delete)/);
});

test("P8 historical acceptance is append-only and never rewritten to a new version", () => {
  assert.match(p8, /POLICY_ACCEPTANCE_APPEND_ONLY/);
  assert.match(p8, /before insert or update or delete on public\.policy_acceptances/);
});

test("P8 wrong-version acceptance is rejected", () => {
  assert.equal(acceptanceMismatch(v1, "b".repeat(64)), "POLICY_ACCEPTANCE_VERSION_MISMATCH");
  assert.equal(acceptanceMismatch({ ...v1, status: "superseded" }, v1.content_sha256), "POLICY_VERSION_NOT_ACTIVE");
  assert.equal(acceptanceMismatch({ ...v1, effective_at: "2999-01-01T00:00:00Z" }, v1.content_sha256), "POLICY_VERSION_NOT_ACTIVE");
  assert.equal(acceptanceMismatch(null, v1.content_sha256), "POLICY_VERSION_NOT_FOUND");
  assert.equal(acceptanceMismatch(v1, v1.content_sha256), null);
  assert.match(p8Atomic, /POLICY_ACCEPTANCE_VERSION_MISMATCH/);
});

test("P8 missing required acceptance blocks the governed action server-side", () => {
  assert.deepEqual(missingAcceptances([v1], new Set(), "wise_payment_submission"), ["TERMS_OF_SERVICE:1"]);
  assert.deepEqual(missingAcceptances([v1], new Set(["v1"]), "wise_payment_submission"), []);
  assert.deepEqual(missingAcceptances([v1], new Set(), "intake"), []);
  assert.match(payment, /requiredPolicyBlockers\(createAdminClient\(\), ctx\.deal\.id, "wise_payment_submission"\)/);
  assert.match(payment, /POLICY_ACCEPTANCE_REQUIRED/);
  assert.match(read("lib/policy/acceptance.ts"), /POLICY_REGISTRY_UNAVAILABLE/);
});

test("P8 client cannot forge acceptance for another Matter", () => {
  assert.match(acceptRoute, /getCurrentClientDeal\(dealId\)/);
  assert.match(acceptRoute, /ctx\.deal\.id !== dealId/);
  assert.match(acceptRoute, /actor_user_id: user\.id/);
  assert.doesNotMatch(acceptRoute, /body\.(actor_user_id|actor_email|accepted_at|matter_id)/);
  assert.match(p8, /revoke all on public\.policy_versions, public\.policy_acceptances from anon, authenticated/);
});

test("P8 refund/cancellation can reference the governing version", () => {
  assert.match(p8, /governing_policy_version\(p_matter_id uuid, p_policy_type text\)/);
  assert.match(p8, /order by a\.accepted_at asc limit 1/);
});


test("P8 client has an exact-version review surface before Wise submission", () => {
  const gate = read("components/portal/PolicyAcceptanceGate.tsx");
  const paymentPage = read("app/portal/payment/page.tsx");
  const activeDetail = read("app/api/policy/active/[id]/route.ts");
  assert.match(paymentPage, /PolicyAcceptanceGate matterId=\{deal\.id\}/);
  assert.match(gate, /I have reviewed and accept this exact version/);
  assert.match(activeDetail, /POLICY_CONTENT_INTEGRITY_FAILED/);
  assert.doesNotMatch(read("app/api/policy/active/route.ts"), /content_reference/);
});
