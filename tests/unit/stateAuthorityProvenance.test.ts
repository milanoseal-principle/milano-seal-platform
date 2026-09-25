import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  FLORIDA_DOS_APOSTILLE_FORM,
  FLORIDA_SUBMISSION_NOTICE,
  authorityFact,
  authorityStateFee,
  evaluateStateAuthority,
  isOfficialGovernmentSource,
  legacyStateAuthorityRecord,
  resolveOfficialAsset,
  type AuthoritySourceAsset,
  type StateAuthorityRecord,
} from "@/lib/intelligence/execution-brain/stateAuthorityProvenance";
import { PAPER_OUT_ITEMS, readPaperOutChecklist } from "@/lib/intelligence/execution-brain/paperOut";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
const NOW = new Date("2026-09-25T12:00:00Z");
const migration = read("supabase/migrations/084_state_authority_provenance.sql");

const verified = (overrides: Partial<StateAuthorityRecord> = {}): StateAuthorityRecord => ({
  id: "auth-fl",
  state_code: "FL",
  authority_name: "Florida Department of State, Division of Corporations",
  authority_type: "secretary_of_state",
  official_source_url: "https://dos.fl.gov/sunbiz/certification/apostille/",
  ron_supported_by_state_notary: "supported",
  electronic_document_submission_status: "not_accepted",
  papering_out_rule: "permitted",
  apostille_submission_method: "mail_or_in_person",
  state_fee: "10.00",
  source_verified_at: "2026-09-01T00:00:00Z",
  next_review_at: "2027-03-01T00:00:00Z",
  confidence: "OFFICIAL_SOURCE",
  status: "VERIFIED",
  verified_by: "00000000-0000-4000-8000-000000000001",
  ...overrides,
});

const floridaAsset = (overrides: Partial<AuthoritySourceAsset> = {}): AuthoritySourceAsset => ({
  id: "asset-1",
  authority_id: "auth-fl",
  state_code: "FL",
  asset_type: "official_form",
  title: FLORIDA_DOS_APOSTILLE_FORM.title,
  purpose: FLORIDA_DOS_APOSTILLE_FORM.purpose,
  repository_path: FLORIDA_DOS_APOSTILLE_FORM.repositoryPath,
  official_source_url: FLORIDA_DOS_APOSTILLE_FORM.officialSourceUrl,
  source_version: FLORIDA_DOS_APOSTILLE_FORM.sourceVersion,
  source_date: FLORIDA_DOS_APOSTILLE_FORM.sourceDate,
  verified_at: "2026-09-20T00:00:00Z",
  status: "ACTIVE",
  sha256: FLORIDA_DOS_APOSTILLE_FORM.sha256,
  ...overrides,
});

test("official government source may become VERIFIED; facts surface only then", () => {
  const record = verified();
  assert.equal(evaluateStateAuthority(record, NOW).status, "VERIFIED");
  assert.equal(authorityFact(record, "ron_supported_by_state_notary", NOW), "supported");
  assert.equal(authorityStateFee(record, NOW), 10);
  assert.ok(isOfficialGovernmentSource("https://files.floridados.gov/media/702388/form.pdf"));
  assert.ok(isOfficialGovernmentSource("https://sos.state.tx.us/authentication"));
  assert.ok(!isOfficialGovernmentSource("http://dos.fl.gov/"), "https required");
  assert.ok(!isOfficialGovernmentSource("https://apostille-helpers.com/florida"));
  assert.ok(!isOfficialGovernmentSource("https://dos.fl.gov.example.com/"));
});

test("third-party-only or model-generated rules cannot become VERIFIED", () => {
  const thirdParty = evaluateStateAuthority(verified({ official_source_url: "https://apostille-helpers.com/florida", confidence: "THIRD_PARTY" }), NOW);
  assert.equal(thirdParty.status, "REVIEW_REQUIRED");
  const thirdPartyConfidence = evaluateStateAuthority(verified({ confidence: "THIRD_PARTY" }), NOW);
  assert.equal(thirdPartyConfidence.status, "REVIEW_REQUIRED");
  const model = evaluateStateAuthority(verified({ confidence: "MODEL_GENERATED" }), NOW);
  assert.equal(model.status, "REVIEW_REQUIRED");
  assert.ok(model.reasons.some((r) => /Model-generated/.test(r)));
  // Operator independently confirmed an official source → may verify.
  assert.equal(evaluateStateAuthority(verified({ confidence: "OPERATOR_CONFIRMED" }), NOW).status, "VERIFIED");
  // Unverified facts never surface, even if stored.
  const unverified = verified({ confidence: "UNVERIFIED", status: "REVIEW_REQUIRED" });
  assert.equal(authorityFact(unverified, "ron_supported_by_state_notary", NOW), "unknown");
  assert.equal(authorityFact(unverified, "electronic_document_submission_status", NOW), "unknown");
  assert.equal(authorityStateFee(unverified, NOW), null);

  // Database constraint mirrors the rule.
  assert.match(migration, /state_authorities_verified_requires_official_source/);
  assert.match(migration, /confidence in \('OFFICIAL_SOURCE', 'OPERATOR_CONFIRMED'\)/);
});

test("missing source → INSUFFICIENT_EVIDENCE", () => {
  const result = evaluateStateAuthority(verified({ official_source_url: null }), NOW);
  assert.equal(result.status, "INSUFFICIENT_EVIDENCE");
  assert.equal(result.routeReviewRequired, true);
});

test("expired next_review_at → STALE, and stale facts read as unknown", () => {
  const stale = verified({ next_review_at: "2026-09-01T00:00:00Z", source_verified_at: "2026-03-01T00:00:00Z" });
  assert.equal(evaluateStateAuthority(stale, NOW).status, "STALE");
  assert.equal(authorityFact(stale, "papering_out_rule", NOW), "unknown");
  assert.equal(authorityStateFee(stale, NOW), null);
});

test("legacy in-code state registry is never production truth", () => {
  const florida = legacyStateAuthorityRecord("fl");
  assert.ok(florida);
  const evaluation = evaluateStateAuthority(florida!, NOW);
  assert.notEqual(evaluation.status, "VERIFIED");
  assert.equal(evaluation.routeReviewRequired, true);
  // The legacy row asserts ronAllowed=true; provenance does not surface it.
  assert.equal(authorityFact(florida!, "ron_supported_by_state_notary", NOW), "unknown");
  assert.equal(legacyStateAuthorityRecord("ZZ"), null);
});

test("superseded or review-required form cannot be selected for a packet", () => {
  assert.equal(resolveOfficialAsset([floridaAsset({ status: "SUPERSEDED" })], { stateCode: "FL" }).status, "MISSING");
  assert.equal(resolveOfficialAsset([floridaAsset({ status: "REVIEW_REQUIRED" })], { stateCode: "FL" }).status, "MISSING");
  const mixed = resolveOfficialAsset(
    [floridaAsset({ id: "old", status: "SUPERSEDED" }), floridaAsset({ id: "new" })],
    { stateCode: "FL", purpose: FLORIDA_DOS_APOSTILLE_FORM.purpose },
  );
  assert.equal(mixed.status, "CURRENT");
  assert.equal(mixed.asset?.id, "new");
  assert.equal(resolveOfficialAsset([floridaAsset({ official_source_url: "https://forms-mirror.com/fl.pdf" })], { stateCode: "FL" }).status, "MISSING");
  assert.equal(resolveOfficialAsset([floridaAsset({ sha256: null })], { stateCode: "FL" }).status, "MISSING");
  assert.equal(resolveOfficialAsset([floridaAsset({ id: "a" }), floridaAsset({ id: "b" })], { stateCode: "FL" }).status, "AMBIGUOUS");
  assert.match(migration, /authority_source_assets_active_uidx[\s\S]*where status = 'ACTIVE'/);
});

test("active Florida DOS form resolves from the registry; unverified asset needs operator verification", () => {
  const current = resolveOfficialAsset([floridaAsset()], { stateCode: "FL", purpose: FLORIDA_DOS_APOSTILLE_FORM.purpose });
  assert.equal(current.status, "CURRENT");
  assert.equal(current.asset?.repository_path, FLORIDA_DOS_APOSTILLE_FORM.repositoryPath);
  const pending = resolveOfficialAsset([floridaAsset({ verified_at: null })], { stateCode: "FL" });
  assert.equal(pending.status, "OPERATOR_VERIFICATION_REQUIRED");

  // Seeded registration matches the committed file and the official URL.
  assert.ok(migration.includes(FLORIDA_DOS_APOSTILLE_FORM.officialSourceUrl));
  assert.ok(migration.includes(`'${FLORIDA_DOS_APOSTILLE_FORM.sha256}'`));
  assert.ok(migration.includes(`'${FLORIDA_DOS_APOSTILLE_FORM.repositoryPath}'`));
  assert.equal(
    FLORIDA_DOS_APOSTILLE_FORM.officialSourceUrl,
    "https://files.floridados.gov/media/702388/1-apostille_and_notarial_certificate_request_form-10-19-2023.pdf",
  );
});

test("no AI-generated substitute: committed official form is byte-identical to the registered hash", () => {
  const bytes = fs.readFileSync(path.join(process.cwd(), FLORIDA_DOS_APOSTILLE_FORM.repositoryPath));
  assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), FLORIDA_DOS_APOSTILLE_FORM.sha256);
  assert.equal(bytes.subarray(0, 5).toString("latin1"), "%PDF-");

  // Official forms require official provenance + hash at the database level.
  assert.match(migration, /authority_source_assets_official_form_provenance/);
  // Nothing in the provenance / paper-out layer generates or rewrites PDFs.
  for (const file of [
    "lib/intelligence/execution-brain/stateAuthorityProvenance.ts",
    "lib/intelligence/execution-brain/paperOut.ts",
    "components/ron/PaperOutChecklistPanel.tsx",
    "app/api/dashboard/state-authorities/assets/[id]/route.ts",
  ]) {
    const source = read(file);
    assert.doesNotMatch(source, /pdf-lib|PDFDocument|pdfkit|jspdf|writeFile/i, file);
  }
  // Rule facts are not seeded by the migration.
  assert.doesNotMatch(migration, /ron_supported_by_state_notary\s*=\s*'supported'|state_fee\s*,\s*[\s\S]{0,40}\d+\.\d{2}/);
});

test("paper-out checklist is operator-recorded, complete only with approval, and never asserts DOS acceptance", () => {
  assert.equal(readPaperOutChecklist({}).status, "NOT_GENERATED");
  const generated = readPaperOutChecklist({ paper_out: { generated_at: "2026-09-25T00:00:00Z", items: {} } });
  assert.equal(generated.status, "IN_PROGRESS");
  assert.equal(generated.pending.length, PAPER_OUT_ITEMS.length);
  assert.equal(generated.notice, FLORIDA_SUBMISSION_NOTICE);
  assert.equal(FLORIDA_SUBMISSION_NOTICE, "Florida submission eligibility requires current operator verification.");

  const allItems = Object.fromEntries(
    PAPER_OUT_ITEMS.map((item) => [item.key, { status: item.optional ? "not_applicable" : "confirmed", recorded_at: "2026-09-25T01:00:00Z" }]),
  );
  assert.equal(readPaperOutChecklist({ paper_out: { generated_at: "x", items: allItems } }).status, "READY_FOR_APPROVAL");
  assert.equal(
    readPaperOutChecklist({ paper_out: { generated_at: "x", items: allItems, operator_approved_at: "2026-09-25T02:00:00Z" } }).status,
    "APPROVED",
  );
  // not_applicable is only allowed for the statutory certificate item.
  const bad = readPaperOutChecklist({
    paper_out: { generated_at: "x", items: { ...allItems, tamper_evidence_reviewed: { status: "not_applicable" } }, operator_approved_at: "y" },
  });
  assert.equal(bad.status, "IN_PROGRESS");
  assert.equal(bad.operatorApprovedAt, null);

  assert.match(migration, /PAPER_OUT_INCOMPLETE/);
  assert.match(migration, /STALE_MATTER_STATE/);
  assert.match(migration, /grant execute on function public\.record_matter_paper_out[^;]*to service_role/);
  const route = read("app/api/dashboard/matters/[id]/paper-out/route.ts");
  assert.match(route, /canPerformProtectedMatterTransition\(role\)/);
  assert.match(route, /EVIDENCE_NOTE_REQUIRED/);
  const panel = read("components/ron/PaperOutChecklistPanel.tsx");
  assert.match(panel, /FLORIDA_SUBMISSION_NOTICE/);
  for (const source of [panel, read("lib/intelligence/execution-brain/paperOut.ts")]) {
    assert.doesNotMatch(source, /guaranteed|will be accepted|acceptance is assured/i);
  }
});

test("server decides verification status; the request cannot set it", () => {
  const route = read("app/api/dashboard/state-authorities/[id]/route.ts");
  assert.match(route, /evaluateStateAuthority\(candidate, now\)/);
  assert.match(route, /patch\.status = evaluation\.status/);
  assert.doesNotMatch(route, /body\.status/);
  assert.doesNotMatch(route, /MODEL_GENERATED/);
  const assetRoute = read("app/api/dashboard/state-authorities/assets/[id]/route.ts");
  assert.match(assetRoute, /SHA256_MISMATCH/);
});
