import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  AUTHORITY_DISPATCH_CUSTODY_EVENT,
  FLORIDA_FORM_VERIFICATION_REASON,
  REGISTERED_REPOSITORY_ASSET_HASHES,
  activeMatterExceptions,
  composeAuthorityPacket,
  executionCompleted,
  readRecordedAuthorityPacket,
  simulatePacketEvaluation,
  type AuthorityPacketInput,
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
  items: Object.fromEntries(PAPER_OUT_ITEMS.map((item) => [item.key, { status: item.optional ? "not_applicable" : "confirmed" }])),
  operator_approved_at: "2026-09-24T02:00:00Z",
};

const facts = {
  authority_id: "auth-fl",
  route_type: "florida_dos_apostille",
  document_count: 1,
  government_fee_payment_method: "READY",
  return_shipment_mode: "outbound_prepaid_return",
  evaluated_at: "2026-09-24T03:00:00Z",
};

const qaAll = {
  document_count_confirmed: true,
  official_form_confirmed: true,
  authority_confirmed: true,
  fees_confirmed: true,
  payment_instrument_confirmed: true,
  return_shipping_confirmed: true,
  destination_confirmed: true,
  paper_out_confirmed: true,
  operator_note: "All packet contents verified against the manifest.",
  approved_by: "op-1",
  approved_at: "2026-09-25T02:00:00Z",
};

const truth = (packet: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) => ({
  execution_method: "ron",
  paper_out: approvedPaperOut,
  authority_packet: { ...facts, ...packet },
  ...extra,
});

const input = (overrides: Partial<AuthorityPacketInput> = {}): AuthorityPacketInput => ({
  matterId: "m1",
  matterState: "execution_qa",
  destinationCountry: "Italy",
  documentType: "Power of Attorney",
  executionTruth: truth(),
  files: [{ id: "f1", name: "poa.pdf", category: "client-upload", mime_type: "application/pdf", structural_status: "READY", sha256: "a".repeat(64), storage_path: "matters/m1/poa.pdf" }],
  ronSessionStatus: "RON_COMPLETED",
  authority,
  assets: [form],
  custodyEvents: [],
  ...overrides,
});

const compose = (overrides: Partial<AuthorityPacketInput> = {}) => composeAuthorityPacket(input(overrides), NOW);
const status = (overrides: Partial<AuthorityPacketInput> = {}) => compose(overrides).packetStatus;

test("1. missing authority → NOT_READY", () => {
  assert.equal(status({ authority: null }), "NOT_READY");
  assert.equal(status({ executionTruth: truth({ route_type: undefined }) }), "NOT_READY");
});

test("2. official form absent → NOT_READY", () => {
  const packet = compose({ assets: [] });
  assert.equal(packet.packetStatus, "NOT_READY");
  assert.ok(packet.blockers.some((b) => /No official form is registered/.test(b)));
});

test("3. official form unverified → REVIEW_REQUIRED with the Florida verification reason", () => {
  const packet = compose({ assets: [{ ...form, verified_at: null }] });
  assert.equal(packet.packetStatus, "REVIEW_REQUIRED");
  assert.ok(packet.reviewReasons.some((r) => r.includes(FLORIDA_FORM_VERIFICATION_REASON)));
  assert.equal(FLORIDA_FORM_VERIFICATION_REASON, "Current Florida DOS form requires operator verification before packet assembly.");
});

test("4. superseded / review-required / ambiguous form → REVIEW_REQUIRED, never selected", () => {
  const superseded = compose({ assets: [{ ...form, status: "SUPERSEDED" }] });
  assert.equal(superseded.packetStatus, "REVIEW_REQUIRED");
  assert.equal(superseded.officialFormAsset, null);
  assert.equal(status({ assets: [{ ...form, status: "REVIEW_REQUIRED" }] }), "REVIEW_REQUIRED");
  assert.equal(status({ assets: [form, { ...form, id: "asset-2" }] }), "REVIEW_REQUIRED");
});

test("5. document preflight BLOCKED → NOT_READY; unscanned → REVIEW_REQUIRED", () => {
  assert.equal(status({ files: [{ id: "f1", mime_type: "application/pdf", structural_status: "BLOCKED" }] }), "NOT_READY");
  assert.equal(status({ files: [{ id: "f1", mime_type: "application/pdf", structural_status: null }] }), "REVIEW_REQUIRED");
  assert.equal(status({ files: [] }), "NOT_READY");
});

test("6. execution incomplete where required → NOT_READY; RON evidence required for RON", () => {
  assert.equal(status({ ronSessionStatus: "SESSION_STARTED", matterState: "in_execution" }), "NOT_READY");
  // Matter state alone does not satisfy RON execution evidence.
  const noSession = compose({ ronSessionStatus: null, matterState: "execution_qa" });
  assert.equal(noSession.packetStatus, "NOT_READY");
  assert.ok(noSession.blockers.some((b) => /RON execution evidence/.test(b)));
  assert.equal(executionCompleted("execution_qa", null), true);
  assert.equal(executionCompleted("cancelled", null), false);
  // Wet-ink execution: paper-out N/A by governed rule; execution from Matter state.
  assert.equal(status({ ronSessionStatus: null, executionTruth: truth({}, { execution_method: "in_person", paper_out: undefined }) }), "READY_TO_ASSEMBLE");
});

test("7. paper-out required but incomplete → NOT_READY (not generated) / REVIEW_REQUIRED (in progress); never silently N/A", () => {
  assert.equal(status({ executionTruth: truth({}, { paper_out: undefined }) }), "NOT_READY");
  assert.equal(status({ executionTruth: truth({}, { paper_out: { ...approvedPaperOut, operator_approved_at: undefined } }) }), "REVIEW_REQUIRED");
  // Unknown execution method: paper-out applicability must be explicitly resolved.
  const unresolved = compose({ executionTruth: truth({}, { execution_method: "already_notarized", paper_out: undefined }) });
  assert.equal(unresolved.paperOutEvidence.applicability, "UNRESOLVED");
  assert.equal(unresolved.packetStatus, "REVIEW_REQUIRED");
  const operatorNa = compose({
    executionTruth: truth({ paper_out_not_applicable_at: "2026-09-24T00:00:00Z" }, { execution_method: "already_notarized", paper_out: undefined }),
  });
  assert.equal(operatorNa.paperOutEvidence.applicability, "NOT_APPLICABLE");
  assert.equal(operatorNa.packetStatus, "READY_TO_ASSEMBLE");
});

test("8. unknown government fee → REVIEW_REQUIRED; fee never invented", () => {
  const packet = compose({ authority: { ...authority, state_fee: null } });
  assert.equal(packet.packetStatus, "REVIEW_REQUIRED");
  assert.equal(packet.authorityFee, null);
  assert.equal(status({ executionTruth: truth({ government_fee_payment_method: "UNKNOWN" }) }), "REVIEW_REQUIRED");
  assert.equal(status({ executionTruth: truth({ government_fee_payment_method: "REQUIRED" }) }), "REVIEW_REQUIRED");
  assert.equal(status({ executionTruth: truth({ government_fee_payment_method: "NOT_REQUIRED" }) }), "REVIEW_REQUIRED");
});

test("9. stale government fee source → REVIEW_REQUIRED and fee hidden", () => {
  const stale = compose({ authority: { ...authority, source_verified_at: "2026-03-01T00:00:00Z", next_review_at: "2026-09-01T00:00:00Z" } });
  assert.equal(stale.packetStatus, "REVIEW_REQUIRED");
  assert.equal(stale.authorityFeeSourceStatus, "STALE");
  assert.equal(stale.authorityFee, null);
});

test("10. destination missing → NOT_READY", () => {
  assert.equal(status({ destinationCountry: null }), "NOT_READY");
});

test("11. document count mismatch → NOT_READY; unrecorded count → REVIEW_REQUIRED", () => {
  assert.equal(status({ executionTruth: truth({ document_count: 3 }) }), "NOT_READY");
  assert.equal(status({ executionTruth: truth({ document_count: undefined }) }), "REVIEW_REQUIRED");
});

test("12. return shipment requirement unknown → REVIEW_REQUIRED", () => {
  const packet = compose({ executionTruth: truth({ return_shipment_mode: "unknown" }) });
  assert.equal(packet.packetStatus, "REVIEW_REQUIRED");
  assert.equal(packet.returnShippingRequired, null);
  assert.equal(packet.outboundShippingRequired, null);
  const manual = compose({ executionTruth: truth({ return_shipment_mode: "manual_return" }) });
  assert.equal(manual.returnShippingRequired, false);
  assert.equal(manual.outboundShippingRequired, true);
});

test("13. operator QA incomplete → not READY_FOR_DISPATCH", () => {
  const assembled = { assembled_at: "2026-09-25T01:00:00Z", assembled_by: "op-1" };
  assert.equal(status({ executionTruth: truth(assembled) }), "ASSEMBLED");
  const partial = { ...qaAll, paper_out_confirmed: false };
  assert.equal(status({ executionTruth: truth({ ...assembled, qa: partial, dispatch_ready_at: "2026-09-25T03:00:00Z" }) }), "ASSEMBLED");
  const noNote = { ...qaAll, operator_note: null };
  assert.equal(status({ executionTruth: truth({ ...assembled, qa: noNote, dispatch_ready_at: "2026-09-25T03:00:00Z" }) }), "ASSEMBLED");
});

test("14. all prerequisites satisfied → READY_TO_ASSEMBLE", () => {
  const packet = compose();
  assert.equal(packet.packetStatus, "READY_TO_ASSEMBLE");
  assert.deepEqual(packet.blockers, []);
  assert.deepEqual(packet.reviewReasons, []);
  assert.equal(packet.officialFormAsset?.sha256, FLORIDA_DOS_APOSTILLE_FORM.sha256);
  assert.equal(packet.sourceDocuments[0].packet_role, "source_document");
  assert.equal(packet.sourceDocuments[0].execution_status, "EXECUTED");
  assert.equal(packet.sourceDocuments[0].reference, "matters/m1/poa.pdf");
});

test("15. operator marks assembled → ASSEMBLED", () => {
  const packet = compose({ executionTruth: truth({ assembled_at: "2026-09-25T01:00:00Z", assembled_by: "op-1" }) });
  assert.equal(packet.packetStatus, "ASSEMBLED");
  assert.ok(packet.warnings.some((w) => /Operator QA/.test(w)));
});

test("16. QA complete + dispatch approval + all gates → READY_FOR_DISPATCH; regression voids it", () => {
  const ready = compose({
    executionTruth: truth({ assembled_at: "2026-09-25T01:00:00Z", qa: qaAll, dispatch_ready_at: "2026-09-25T03:00:00Z", dispatch_approved_by: "op-1" }),
  });
  assert.equal(ready.packetStatus, "READY_FOR_DISPATCH");
  assert.equal(ready.operatorQa.complete, true);
  assert.equal(ready.approvedBy, "op-1");
  const qaOnly = compose({ executionTruth: truth({ assembled_at: "2026-09-25T01:00:00Z", qa: qaAll }) });
  assert.equal(qaOnly.packetStatus, "ASSEMBLED");
  assert.ok(qaOnly.warnings.some((w) => /Dispatch has not been approved/.test(w)));
  const regressed = compose({
    assets: [{ ...form, status: "SUPERSEDED" }],
    executionTruth: truth({ assembled_at: "2026-09-25T01:00:00Z", qa: qaAll, dispatch_ready_at: "2026-09-25T03:00:00Z" }),
  });
  assert.equal(regressed.packetStatus, "REVIEW_REQUIRED");
  assert.equal(regressed.operatorQa.complete, false);
  assert.equal(regressed.approvedAt, null);
});

test("17. browser cannot set READY_FOR_DISPATCH (or any status) directly", () => {
  const spoofed = compose({ executionTruth: truth({ packet_status: "READY_FOR_DISPATCH", status: "DISPATCHED" }) });
  assert.equal(spoofed.packetStatus, "READY_TO_ASSEMBLE");
  const route = read("app/api/dashboard/matters/[id]/authority-packet/route.ts");
  assert.doesNotMatch(route, /body\.(packet_status|packetStatus|status|state_fee|authority_fee|official_form|dispatch)/);
  assert.match(route, /p_computed_status: before\.packetStatus/);
  assert.match(route, /before\.packetStatus !== required/);
  assert.match(route, /canPerformProtectedMatterTransition\(role\)/);
  const migration = read("supabase/migrations/085_authority_packet_composer.sql");
  for (const key of ["authority_id", "route_type", "document_count", "government_fee_payment_method", "return_shipment_mode", "paper_out_not_applicable"]) {
    assert.ok(migration.includes(`'${key}'`), key);
  }
  assert.match(migration, /INVALID_PACKET_FACT/);
  assert.match(migration, /PACKET_NOT_READY_TO_ASSEMBLE/);
  assert.match(migration, /PACKET_DISPATCH_NOT_PERMITTED/);
  assert.match(migration, /revoke all on function public\.record_matter_authority_packet[^;]*from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.record_matter_authority_packet[^;]*to service_role/);
});

test("18. government fee is PASS_THROUGH and never Milano service revenue", () => {
  const packet = compose();
  assert.equal(packet.authorityFee, 10);
  assert.equal(packet.authorityFeeTreatment, "PASS_THROUGH");
  assert.equal(packet.countsAsMilanoRevenue, false);
  const migration = read("supabase/migrations/085_authority_packet_composer.sql");
  assert.doesNotMatch(migration, /verified_revenue|amount_due|amount_paid|quote_total|payment_status/);
  const lib = read("lib/intelligence/execution-brain/authorityPacket.ts");
  assert.doesNotMatch(lib, /verified_revenue|amount_due|amount_paid|wise_reference/);
});

test("19. official asset hash mismatch → NOT_READY (blocked)", () => {
  const packet = compose({ assets: [{ ...form, sha256: "b".repeat(64) }] });
  assert.equal(packet.packetStatus, "NOT_READY");
  assert.ok(packet.blockers.some((b) => /hash does not match/.test(b)));
  const bytes = fs.readFileSync(path.join(process.cwd(), FLORIDA_DOS_APOSTILLE_FORM.repositoryPath));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), REGISTERED_REPOSITORY_ASSET_HASHES[FLORIDA_DOS_APOSTILLE_FORM.repositoryPath]);
});

test("20. DISPATCHED only from canonical custody evidence after dispatch approval", () => {
  const readyTruth = truth({ assembled_at: "2026-09-25T01:00:00Z", qa: qaAll, dispatch_ready_at: "2026-09-25T03:00:00Z", dispatch_approved_by: "op-1" });
  assert.equal(
    status({ executionTruth: readyTruth, custodyEvents: [{ event: AUTHORITY_DISPATCH_CUSTODY_EVENT, created_at: "2026-09-25T04:00:00Z" }] }),
    "DISPATCHED",
  );
  // Earlier submission evidence (before approval) or unrelated custody events do not count.
  assert.equal(
    status({ executionTruth: readyTruth, custodyEvents: [{ event: AUTHORITY_DISPATCH_CUSTODY_EVENT, created_at: "2026-09-25T02:00:00Z" }] }),
    "READY_FOR_DISPATCH",
  );
  assert.equal(status({ executionTruth: readyTruth, custodyEvents: [{ event: "DOC_SHIPPED", created_at: "2026-09-25T04:00:00Z" }] }), "READY_FOR_DISPATCH");
  // Custody evidence without an approved packet never yields DISPATCHED.
  assert.equal(status({ custodyEvents: [{ event: AUTHORITY_DISPATCH_CUSTODY_EVENT, created_at: "2026-09-25T04:00:00Z" }] }), "READY_TO_ASSEMBLE");
});

test("blocking Matter exceptions and route consistency", () => {
  assert.equal(status({ matterState: "document_correction_required", ronSessionStatus: "RON_COMPLETED" }), "NOT_READY");
  assert.deepEqual(
    activeMatterExceptions("execution_qa", [
      { event: "PROTECTED_IDENTIFIER_RELEASE_HOLD", created_at: "2026-09-25T01:00:00Z" },
    ]),
    ["A protected-identifier hold is unresolved."],
  );
  assert.deepEqual(
    activeMatterExceptions("execution_qa", [
      { event: "PROTECTED_IDENTIFIER_RELEASE_HOLD", created_at: "2026-09-25T01:00:00Z" },
      { event: "PROTECTED_IDENTIFIER_VERIFIED", created_at: "2026-09-25T02:00:00Z" },
    ]),
    [],
  );
  // Apostille route to a non-Hague destination (or unknown destination) needs review.
  assert.equal(status({ destinationCountry: "United Arab Emirates" }), "REVIEW_REQUIRED");
  assert.equal(status({ destinationCountry: "Atlantis" }), "REVIEW_REQUIRED");
  assert.equal(status({ destinationCountry: "United Arab Emirates", executionTruth: truth({ route_type: "florida_dos_notarial_certificate" }) }), "READY_TO_ASSEMBLE");
});

test("evaluation simulation mirrors the RPC merge: changed facts clear assembly, QA and dispatch approval", () => {
  const base = truth({ assembled_at: "a", qa: qaAll, dispatch_ready_at: "b" });
  const unchanged = simulatePacketEvaluation(base, { document_count: 1 }, "t", "op") as { authority_packet: Record<string, unknown> };
  assert.equal(unchanged.authority_packet.assembled_at, "a");
  const changed = simulatePacketEvaluation(base, { document_count: 2 }, "t", "op") as { authority_packet: Record<string, unknown> };
  assert.equal(changed.authority_packet.assembled_at, undefined);
  assert.equal(changed.authority_packet.qa, undefined);
  assert.equal(changed.authority_packet.dispatch_ready_at, undefined);
  assert.equal(readRecordedAuthorityPacket({ authority_packet: { route_type: "fake", document_count: -1 } })?.route_type, null);
});

test("no form generation, no legal advice, no label creation, operator-only surface", () => {
  for (const file of [
    "lib/intelligence/execution-brain/authorityPacket.ts",
    "lib/intelligence/execution-brain/authorityPacketServer.ts",
    "components/dashboard/execution/AuthorityPacketPanel.tsx",
    "components/dashboard/execution/AuthorityPacketActions.tsx",
    "app/api/dashboard/matters/[id]/authority-packet/route.ts",
  ]) {
    const source = read(file);
    assert.doesNotMatch(source, /pdf-lib|PDFDocument|pdfkit|jspdf|writeFile/i, file);
    assert.doesNotMatch(source, /guaranteed|legally sufficient|will be accepted/i, file);
    assert.doesNotMatch(source, /shippo|createLabel|label_url/i, file);
  }
  const panel = read("components/dashboard/execution/AuthorityPacketPanel.tsx");
  for (const label of [
    "Authority", "Route", "Official Form", "Official Form Status", "Documents", "Document Count", "Paper-Out",
    "Government Fee", "Government Fee Source", "Government Fee Payment Method", "Outbound Shipment",
    "Return Shipment", "Operator QA", "Packet Status", "Missing Items", "Review Reasons", "Blockers",
  ]) {
    assert.ok(panel.includes(`'${label}'`) || panel.includes(`>${label}<`), label);
  }
  const actions = read("components/dashboard/execution/AuthorityPacketActions.tsx");
  for (const label of ["Refresh packet", "Mark assembled", "Complete QA", "Approve for dispatch"]) assert.ok(actions.includes(label), label);
  // Not exposed on client portal surfaces.
  const portal = fs.readdirSync(path.join(process.cwd(), "app")).filter((dir) => /portal/.test(dir));
  for (const dir of portal) {
    const hits = fs.readdirSync(path.join(process.cwd(), "app", dir), { recursive: true }) as string[];
    for (const file of hits.filter((f) => /\.tsx?$/.test(String(f)))) {
      assert.doesNotMatch(read(path.join("app", dir, String(file))), /authority-packet|AuthorityPacket/, `${dir}/${file}`);
    }
  }
});
