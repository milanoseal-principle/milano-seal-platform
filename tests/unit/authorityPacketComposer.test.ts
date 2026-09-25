import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  composeAuthorityPacket,
  executionCompleted,
  readRecordedAuthorityPacket,
  type AuthorityPacketInput,
  type RecordedAuthorityPacket,
} from "@/lib/intelligence/execution-brain/authorityPacket";
import { PAPER_OUT_ITEMS } from "@/lib/intelligence/execution-brain/paperOut";
import {
  FLORIDA_DOS_APOSTILLE_FORM,
  type AuthoritySourceAsset,
  type StateAuthorityRecord,
} from "@/lib/intelligence/execution-brain/stateAuthorityProvenance";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
const NOW = new Date("2026-09-25T12:00:00Z");

const authority: StateAuthorityRecord = {
  id: "auth-fl",
  state_code: "FL",
  authority_name: FLORIDA_DOS_APOSTILLE_FORM.authorityName,
  authority_type: "secretary_of_state",
  official_source_url: "https://dos.fl.gov/sunbiz/certification/apostille/",
  state_fee: "10.00",
  source_verified_at: "2026-09-01T00:00:00Z",
  next_review_at: "2027-03-01T00:00:00Z",
  confidence: "OFFICIAL_SOURCE",
  status: "VERIFIED",
  verified_by: "00000000-0000-4000-8000-000000000001",
};

const form: AuthoritySourceAsset = {
  id: "asset-fl",
  authority_id: "auth-fl",
  state_code: "FL",
  asset_type: "official_form",
  title: FLORIDA_DOS_APOSTILLE_FORM.title,
  purpose: FLORIDA_DOS_APOSTILLE_FORM.purpose,
  repository_path: FLORIDA_DOS_APOSTILLE_FORM.repositoryPath,
  official_source_url: FLORIDA_DOS_APOSTILLE_FORM.officialSourceUrl,
  source_version: FLORIDA_DOS_APOSTILLE_FORM.sourceVersion,
  verified_at: "2026-09-20T00:00:00Z",
  status: "ACTIVE",
  sha256: FLORIDA_DOS_APOSTILLE_FORM.sha256,
};

const approvedPaperOut = {
  generated_at: "2026-09-24T00:00:00Z",
  items: Object.fromEntries(
    PAPER_OUT_ITEMS.map((item) => [item.key, { status: item.optional ? "not_applicable" : "confirmed" }]),
  ),
  operator_approved_at: "2026-09-24T02:00:00Z",
};

const recordedFacts: RecordedAuthorityPacket = {
  authority_id: "auth-fl",
  route_type: "florida_dos_apostille",
  document_count: 2,
  destination_confirmed: true,
  government_fee_method_status: "ready",
  return_shipping: "required",
  built_at: "2026-09-24T03:00:00Z",
};

const complete = (overrides: Partial<AuthorityPacketInput> = {}): AuthorityPacketInput => ({
  matterId: "m1",
  matterState: "execution_qa",
  destinationCountry: "Italy",
  executionTruth: { execution_method: "ron", paper_out: approvedPaperOut },
  files: [{ id: "f1", name: "poa.pdf", mime_type: "application/pdf", structural_status: "READY" }],
  ronSessionStatus: "RON_COMPLETED",
  authority,
  assets: [form],
  recorded: recordedFacts,
  ...overrides,
});

const status = (overrides: Partial<AuthorityPacketInput> = {}) => composeAuthorityPacket(complete(overrides), NOW).packet_status;

test("everything satisfied → READY_TO_ASSEMBLE, with pass-through fee and registered form", () => {
  const packet = composeAuthorityPacket(complete(), NOW);
  assert.equal(packet.packet_status, "READY_TO_ASSEMBLE");
  assert.deepEqual(packet.missing_items, []);
  assert.equal(packet.official_form_asset?.sha256, FLORIDA_DOS_APOSTILLE_FORM.sha256);
  assert.equal(packet.official_form_asset?.repository_path, FLORIDA_DOS_APOSTILLE_FORM.repositoryPath);
  assert.deepEqual(packet.authority_fee, {
    amount: 10,
    currency: "USD",
    treatment: "PASS_THROUGH",
    milano_revenue: false,
    source: "state_authority_record",
  });
  assert.equal(packet.return_shipping_required, true);
  assert.equal(packet.outbound_shipping_required, true);
});

test("no official form → NOT_READY; superseded form is never used", () => {
  assert.equal(status({ assets: [] }), "NOT_READY");
  assert.equal(status({ assets: [{ ...form, status: "SUPERSEDED" }] }), "NOT_READY");
  assert.equal(status({ authority: null }), "NOT_READY");
});

test("stale official form / authority → REVIEW_REQUIRED", () => {
  assert.equal(status({ authority: { ...authority, next_review_at: "2026-09-01T00:00:00Z", source_verified_at: "2026-03-01T00:00:00Z" } }), "REVIEW_REQUIRED");
  assert.equal(status({ assets: [{ ...form, verified_at: null }] }), "REVIEW_REQUIRED");
});

test("missing source document → NOT_READY; failed preflight → NOT_READY; unscanned → REVIEW_REQUIRED", () => {
  assert.equal(status({ files: [] }), "NOT_READY");
  assert.equal(status({ files: [{ id: "f1", mime_type: "application/pdf", structural_status: "BLOCKED" }] }), "NOT_READY");
  assert.equal(status({ files: [{ id: "f1", mime_type: "application/pdf", structural_status: null }] }), "REVIEW_REQUIRED");
});

test("execution incomplete → NOT_READY; execution is read from canonical evidence only", () => {
  assert.equal(status({ ronSessionStatus: "SESSION_STARTED", matterState: "in_execution" }), "NOT_READY");
  assert.equal(executionCompleted("execution_qa", null), true);
  assert.equal(executionCompleted("scheduled", "RON_COMPLETED"), true);
  assert.equal(executionCompleted("cancelled", null), false);
  assert.equal(executionCompleted(null, null), false);
  // Document with no execution requirement does not wait on execution.
  assert.equal(
    status({
      ronSessionStatus: null,
      matterState: "under_review",
      executionTruth: { notarization_requirement: "not_required" },
    }),
    "READY_TO_ASSEMBLE",
  );
});

test("paper-out incomplete → REVIEW_REQUIRED", () => {
  assert.equal(status({ executionTruth: { execution_method: "ron" } }), "REVIEW_REQUIRED");
  assert.equal(
    status({ executionTruth: { execution_method: "ron", paper_out: { ...approvedPaperOut, operator_approved_at: undefined } } }),
    "REVIEW_REQUIRED",
  );
});

test("unknown government fee → REVIEW_REQUIRED; fee is never invented", () => {
  const packet = composeAuthorityPacket(complete({ authority: { ...authority, state_fee: null } }), NOW);
  assert.equal(packet.packet_status, "REVIEW_REQUIRED");
  assert.equal(packet.authority_fee.amount, null);
  assert.ok(packet.missing_items.some((item) => /Government fee/.test(item)));
  assert.equal(status({ recorded: { ...recordedFacts, government_fee_method_status: "unknown" } }), "REVIEW_REQUIRED");
});

test("return method unresolved / destination or count unconfirmed → REVIEW_REQUIRED", () => {
  assert.equal(status({ recorded: { ...recordedFacts, return_shipping: "unknown" } }), "REVIEW_REQUIRED");
  assert.equal(status({ recorded: { ...recordedFacts, destination_confirmed: false } }), "REVIEW_REQUIRED");
  assert.equal(status({ destinationCountry: null }), "REVIEW_REQUIRED");
  assert.equal(status({ recorded: { ...recordedFacts, document_count: null } }), "REVIEW_REQUIRED");
});

test("assembly → ASSEMBLED; operator final QA → READY_FOR_DISPATCH; QA is void if evidence regresses", () => {
  const assembled = { ...recordedFacts, assembled_at: "2026-09-25T01:00:00Z", assembled_by: "op" };
  assert.equal(status({ recorded: assembled }), "ASSEMBLED");
  const qa = { ...assembled, approved_at: "2026-09-25T02:00:00Z", approved_by: "op" };
  const ready = composeAuthorityPacket(complete({ recorded: qa }), NOW);
  assert.equal(ready.packet_status, "READY_FOR_DISPATCH");
  assert.equal(ready.operator_qa.complete, true);
  assert.equal(ready.approved_by, "op");
  assert.equal(status({ recorded: { ...qa, dispatched_at: "2026-09-25T03:00:00Z" } }), "DISPATCHED");

  // Evidence regression after QA drops the packet back and voids QA.
  const regressed = composeAuthorityPacket(complete({ recorded: qa, assets: [{ ...form, status: "SUPERSEDED" }] }), NOW);
  assert.equal(regressed.packet_status, "NOT_READY");
  assert.equal(regressed.operator_qa.complete, false);
  assert.equal(regressed.approved_at, null);
});

test("recorded packet facts are whitelisted from execution truth", () => {
  const recorded = readRecordedAuthorityPacket({
    authority_packet: { document_count: -3, government_fee_method_status: "paid_by_magic", return_shipping: "maybe", destination_confirmed: "yes" },
  });
  assert.equal(recorded?.document_count, null);
  assert.equal(recorded?.government_fee_method_status, "unknown");
  assert.equal(recorded?.return_shipping, "unknown");
  assert.equal(recorded?.destination_confirmed, false);
  assert.equal(readRecordedAuthorityPacket({}), null);
});

test("server recomputes before every lifecycle step; RPC guards transitions atomically", () => {
  const route = read("app/api/dashboard/matters/[id]/authority-packet/route.ts");
  assert.match(route, /canPerformProtectedMatterTransition\(role\)/);
  assert.match(route, /EVIDENCE_NOTE_REQUIRED/);
  assert.match(route, /loaded\.manifest\.packet_status !== "READY_TO_ASSEMBLE"/);
  assert.match(route, /loaded\.manifest\.packet_status !== "ASSEMBLED"/);
  assert.match(route, /p_computed_status: loaded\.manifest\.packet_status/);
  assert.doesNotMatch(route, /body\.(packet_status|status|state_fee|authority_fee|official_form)/);

  const migration = read("supabase/migrations/085_authority_packet_composer.sql");
  assert.match(migration, /STALE_MATTER_STATE/);
  assert.match(migration, /PACKET_NOT_READY_TO_ASSEMBLE/);
  assert.match(migration, /PACKET_QA_NOT_PERMITTED/);
  assert.match(migration, /PACKET_ALREADY_DISPATCHED/);
  assert.match(migration, /grant execute on function public\.record_matter_authority_packet[^;]*to service_role/);
  // Pass-through fee never touches Milano revenue / pricing fields.
  assert.doesNotMatch(migration, /verified_revenue|amount_due|amount_paid|quote_total/);
});

test("composer never generates, modifies or signs an official form, and never claims acceptance", () => {
  for (const file of [
    "lib/intelligence/execution-brain/authorityPacket.ts",
    "lib/intelligence/execution-brain/authorityPacketServer.ts",
    "components/dashboard/execution/AuthorityPacketPanel.tsx",
    "components/dashboard/execution/AuthorityPacketActions.tsx",
  ]) {
    const source = read(file);
    assert.doesNotMatch(source, /pdf-lib|PDFDocument|pdfkit|jspdf|writeFile/i, file);
    assert.doesNotMatch(source, /guaranteed|legally sufficient|will be accepted/i, file);
  }
  const panel = read("components/dashboard/execution/AuthorityPacketPanel.tsx");
  for (const section of ["Official Form", "Source Documents", "Paper-Out", "Government Fee", "Return Envelope", "QA", "Missing Items"]) {
    assert.ok(panel.includes(`'${section}'`) || panel.includes(`>${section}<`), section);
  }
  assert.match(panel, /Final acceptance remains subject to the receiving authority\./);
});
