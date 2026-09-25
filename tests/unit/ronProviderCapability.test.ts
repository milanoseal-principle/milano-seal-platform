import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  RON_PROVIDER_REGISTRY,
  documentPreflightPosture,
  evaluateRonProviderCapability,
  readRonAuthorityPosture,
  ronCapabilityEvidenceColumns,
  type RonProviderCapabilityInput,
} from "@/lib/intelligence/execution-brain/ronProviderCapabilities";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");

const clearPosture = readRonAuthorityPosture({
  receiving_authority: "Notaio in Milano",
  receiving_authority_ron_acceptance: "accepted",
  wet_ink_requirement: "not_required",
  original_requirement: "not_required",
});

const base = (overrides: Partial<RonProviderCapabilityInput> = {}): RonProviderCapabilityInput => ({
  matterId: "m1",
  provider: "bluenotary",
  signerLocation: "Florida",
  documentType: "Power of Attorney",
  notarialAct: "acknowledgment",
  posture: clearPosture,
  documentPreflight: "READY",
  schedulingAuthorized: true,
  ...overrides,
});

test("clean document + supported provider + known authority → RON_READY", () => {
  const result = evaluateRonProviderCapability(base());
  assert.equal(result.status, "RON_READY");
  assert.equal(result.provider, "bluenotary");
  assert.equal(result.selectedIdentityMethod, "kba");
  assert.deepEqual(result.availableIdentityMethods, ["credential_analysis", "biometric_idv", "kba"]);
  assert.equal(result.providerEligibilityStatus, "ELIGIBLE");
  assert.equal(result.reviewRequired, false);
  assert.deepEqual(result.blockers, []);
});

test("document preflight REVIEW_REQUIRED / NOT_RUN → operator review; BLOCKED → RON_BLOCKED", () => {
  assert.equal(evaluateRonProviderCapability(base({ documentPreflight: "REVIEW_REQUIRED" })).status, "RON_OPERATOR_REVIEW_REQUIRED");
  assert.equal(evaluateRonProviderCapability(base({ documentPreflight: "NOT_RUN" })).status, "RON_OPERATOR_REVIEW_REQUIRED");
  assert.equal(evaluateRonProviderCapability(base({ documentPreflight: "BLOCKED" })).status, "RON_BLOCKED");

  assert.equal(documentPreflightPosture([]), "NOT_RUN");
  assert.equal(documentPreflightPosture([{ id: "a", mime_type: "application/pdf", structural_status: null }]), "NOT_RUN");
  assert.equal(documentPreflightPosture([{ id: "a", mime_type: "application/pdf", structural_status: "BLOCKED" }]), "BLOCKED");
  assert.equal(documentPreflightPosture([{ id: "a", file_type: "application/pdf", structural_status: "REVIEW_REQUIRED" }]), "REVIEW_REQUIRED");
  assert.equal(documentPreflightPosture([{ id: "a", file_type: "application/pdf", structural_status: "READY" }]), "READY");
});

test("unknown receiving-authority acceptance → review; not accepted → blocked", () => {
  const unknown = evaluateRonProviderCapability(base({ posture: readRonAuthorityPosture({ wet_ink_requirement: "not_required", original_requirement: "not_required" }) }));
  assert.equal(unknown.status, "RON_OPERATOR_REVIEW_REQUIRED");
  assert.ok(unknown.reviewReasons.some((r) => /Receiving-authority acceptance/.test(r)));

  const refused = evaluateRonProviderCapability(base({ posture: { ...clearPosture, receivingAuthorityRonAcceptance: "not_accepted" } }));
  assert.equal(refused.status, "RON_BLOCKED");
});

test("wet-ink or original requirement is incompatible with RON → blocked", () => {
  assert.equal(evaluateRonProviderCapability(base({ posture: { ...clearPosture, wetInkRequirement: "required" } })).status, "RON_BLOCKED");
  assert.equal(evaluateRonProviderCapability(base({ posture: { ...clearPosture, originalRequirement: "required" } })).status, "RON_BLOCKED");
  assert.equal(
    evaluateRonProviderCapability(base({ posture: { ...clearPosture, wetInkRequirement: "unknown" } })).status,
    "RON_OPERATOR_REVIEW_REQUIRED",
  );
});

test("unsupported identity capability or provider is governed by deterministic provider truth", () => {
  const passport = evaluateRonProviderCapability(base({ requestedIdentityMethod: "passport_idv" }));
  assert.equal(passport.status, "RON_BLOCKED");
  assert.equal(passport.providerEligibilityStatus, "INELIGIBLE");
  assert.equal(passport.selectedIdentityMethod, null);

  const madeUp = evaluateRonProviderCapability(base({ requestedIdentityMethod: "face_scan_magic" }));
  assert.equal(madeUp.status, "RON_BLOCKED");

  const unknownProvider = evaluateRonProviderCapability(base({ provider: "some-other-ron" }));
  assert.equal(unknownProvider.status, "RON_BLOCKED");
  assert.deepEqual(unknownProvider.availableIdentityMethods, []);

  assert.equal(evaluateRonProviderCapability(base({ requestedIdentityMethod: "biometric_idv" })).status, "RON_READY");
  assert.equal(RON_PROVIDER_REGISTRY.bluenotary.source, "provider_configuration");
});

test("notarial act is never inferred and unresolved execution facts need review", () => {
  assert.equal(evaluateRonProviderCapability(base({ notarialAct: null })).status, "RON_OPERATOR_REVIEW_REQUIRED");
  assert.equal(evaluateRonProviderCapability(base({ notarialAct: "review_required" })).status, "RON_OPERATOR_REVIEW_REQUIRED");
  assert.equal(evaluateRonProviderCapability(base({ signerLocation: null })).status, "RON_OPERATOR_REVIEW_REQUIRED");
});

test("payment / scheduling gate remains required", () => {
  const result = evaluateRonProviderCapability(base({ schedulingAuthorized: false }));
  assert.equal(result.status, "RON_BLOCKED");
  assert.ok(result.blockers.some((b) => /Payment \/ scheduling gate/.test(b)));
});

test("provider identity outcomes are read as status words only; failures need review", () => {
  const verified = evaluateRonProviderCapability(
    base({ providerSession: { bn_session_id: "bn_123", kba_status: "KBA_PASSED", identity_status: "PHOTO_ID_PASSED" } }),
    new Date("2026-09-25T12:00:00Z"),
  );
  assert.equal(verified.identityStatus, "VERIFIED");
  assert.equal(verified.identityEvidenceReference, "bluenotary:session:bn_123:kba");
  assert.equal(verified.verifiedAt, "2026-09-25T12:00:00.000Z");

  const failed = evaluateRonProviderCapability(base({ providerSession: { bn_session_id: "bn_123", kba_status: "KBA_FAILED" } }));
  assert.equal(failed.identityStatus, "FAILED");
  assert.equal(failed.status, "RON_OPERATOR_REVIEW_REQUIRED");

  const none = evaluateRonProviderCapability(base());
  assert.equal(none.identityEvidenceReference, null);
});

test("persisted evidence is provider-safe only; no raw passport, MRZ, image, biometric or KBA content", () => {
  const columns = ronCapabilityEvidenceColumns(
    evaluateRonProviderCapability(base({ providerSession: { bn_session_id: "bn_1", kba_status: "KBA_PASSED" } })),
  );
  assert.deepEqual(Object.keys(columns).sort(), [
    "capability_verified_at",
    "identity_evidence_reference",
    "provider_eligibility_status",
    "ron_provider",
    "selected_identity_method",
  ]);
  const migration = read("supabase/migrations/083_ron_provider_capability_evidence.sql");
  const added = [...migration.matchAll(/add column if not exists (\w+)/g)].map((m) => m[1]);
  assert.deepEqual(added.sort(), ["capability_verified_at", "identity_evidence_reference", "provider_eligibility_status", "ron_provider", "selected_identity_method"]);
  for (const forbidden of ["passport", "mrz", "nfc", "selfie", "biometric_vector", "kba_answer", "kba_question", "secret", "token"]) {
    assert.ok(!added.some((column) => column.includes(forbidden)), forbidden);
  }
  const lib = read("lib/intelligence/execution-brain/ronProviderCapabilities.ts");
  assert.doesNotMatch(lib, /\.insert\(|\.update\(|from\(/, "capability module never writes identity data");
});

test("server recomputes readiness before the BlueNotary call and ignores client-supplied capability", () => {
  const route = read("app/api/dashboard/ron/sessions/route.ts");
  const gate = route.indexOf("evaluateRonProviderCapability(");
  const providerCall = route.indexOf("createBlueNotarySession(");
  assert.ok(gate > -1 && providerCall > gate, "capability gate precedes the provider call");
  assert.ok(route.indexOf("assertCanCreateRONSession(") < gate, "payment/scheduling guard runs first");
  assert.match(route, /provider: 'bluenotary'/);
  assert.match(route, /capability\.status !== 'RON_READY'/);
  assert.doesNotMatch(route, /body\.(provider_capabilities|capabilities|available_identity_methods|ron_status)/);
  assert.match(route, /\.\.\.ronCapabilityEvidenceColumns\(capability\)/);

  // A spoofed capability payload has no input path: the evaluator only takes
  // provider configuration + canonical facts.
  const spoof = evaluateRonProviderCapability({
    ...base({ requestedIdentityMethod: "passport_idv" }),
    ...({ availableIdentityMethods: ["passport_idv"], status: "RON_READY" } as object),
  });
  assert.equal(spoof.status, "RON_BLOCKED");
});

test("operator posture is recorded atomically with evidence and never inferred", () => {
  const route = read("app/api/dashboard/matters/[id]/ron-posture/route.ts");
  assert.match(route, /canPerformProtectedMatterTransition\(role\)/);
  assert.match(route, /EVIDENCE_NOTE_REQUIRED/);
  assert.match(route, /record_matter_ron_posture/);
  const migration = read("supabase/migrations/083_ron_provider_capability_evidence.sql");
  assert.match(migration, /RON_AUTHORITY_POSTURE_RECORDED/);
  assert.match(migration, /STALE_MATTER_STATE/);
  assert.match(migration, /grant execute on function public\.record_matter_ron_posture[^;]*to service_role/);

  assert.deepEqual(readRonAuthorityPosture({ receiving_authority_ron_acceptance: "definitely" }), {
    receivingAuthority: null,
    receivingAuthorityRonAcceptance: "unknown",
    wetInkRequirement: "unknown",
    originalRequirement: "unknown",
  });
  const panel = read("components/ron/MatterRONReadiness.tsx");
  assert.match(panel, /capability\.status === 'RON_READY'/);
  assert.match(panel, /Final acceptance remains subject to the receiving authority\./);
});
