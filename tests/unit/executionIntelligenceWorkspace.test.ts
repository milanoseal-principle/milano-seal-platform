import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { evaluateRonProviderCapability, readRonAuthorityPosture } from "@/lib/intelligence/execution-brain/ronProviderCapabilities";
import { composeAuthorityPacket, type AuthorityPacketInput } from "@/lib/intelligence/execution-brain/authorityPacket";
import {
  evaluateShipmentLegReadiness,
  mapTrackingToLegCustody,
  completeShipmentLegEvidence,
} from "@/lib/intelligence/execution-brain/authorityLogistics";
import { projectQuoteRouteIntelligence } from "@/lib/pricing/destinationDocumentQuoteIntelligence";
import { evaluateSchedulingGate } from "@/lib/scheduling/complimentarySchedulingGate";
import { FLORIDA_DOS_APOSTILLE_FORM } from "@/lib/intelligence/execution-brain/stateAuthorityProvenance";
import { PAPER_OUT_ITEMS } from "@/lib/intelligence/execution-brain/paperOut";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
const NOW = new Date("2026-09-25T12:00:00Z");

const posture = readRonAuthorityPosture({
  receiving_authority: "Notaio",
  receiving_authority_ron_acceptance: "accepted",
  wet_ink_requirement: "not_required",
  original_requirement: "not_required",
});
const ron = (overrides: Record<string, unknown> = {}) =>
  evaluateRonProviderCapability({
    matterId: "m1",
    provider: "bluenotary",
    signerLocation: "Florida",
    documentType: "Power of Attorney",
    notarialAct: "acknowledgment",
    posture,
    documentPreflight: "READY",
    schedulingAuthorized: true,
    ...overrides,
  } as never);

const authority = {
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
  verified_by: "op",
};
const form = {
  id: "asset",
  authority_id: "auth-fl",
  state_code: "FL",
  asset_type: "official_form",
  title: FLORIDA_DOS_APOSTILLE_FORM.title,
  repository_path: FLORIDA_DOS_APOSTILLE_FORM.repositoryPath,
  official_source_url: FLORIDA_DOS_APOSTILLE_FORM.officialSourceUrl,
  verified_at: "2026-09-20T00:00:00Z",
  status: "ACTIVE",
  sha256: FLORIDA_DOS_APOSTILLE_FORM.sha256,
};
const packetInput = (overrides: Partial<AuthorityPacketInput> = {}): AuthorityPacketInput => ({
  matterId: "m1",
  matterState: "execution_qa",
  destinationCountry: "Italy",
  executionTruth: {
    execution_method: "ron",
    paper_out: {
      generated_at: "x",
      items: Object.fromEntries(PAPER_OUT_ITEMS.map((item) => [item.key, { status: item.optional ? "not_applicable" : "confirmed" }])),
      operator_approved_at: "y",
    },
    authority_packet: {
      authority_id: "auth-fl",
      route_type: "florida_dos_apostille",
      document_count: 1,
      government_fee_payment_method: "READY",
      return_shipment_mode: "outbound_only",
    },
  },
  files: [{ id: "f1", name: "poa.pdf", mime_type: "application/pdf", structural_status: "READY" }],
  ronSessionStatus: "RON_COMPLETED",
  authority,
  assets: [form],
  custodyEvents: [],
  issuingLane: "state",
  ...overrides,
});
const finalLeg = (state: string, overrides: Record<string, unknown> = {}) =>
  evaluateShipmentLegReadiness({
    legType: "final_international",
    matter: { id: "m1", state, apostilleRequired: true, releaseFrozen: false, isPaidAndReleased: false, ...overrides },
    packet: null,
    existingLegs: [],
    origin: { name: "Milano", street1: "1 Seal Way", city: "Miami", state: "FL", zip: "33101", country: "US" },
    destination: { name: "Client", street1: "Via Roma 1", city: "Milano", country: "IT" },
    operatorRequest: { releaseActionConfirmed: true },
  });

test("hard gate: document BLOCKED → no RON", () => {
  assert.equal(ron({ documentPreflight: "BLOCKED" }).status, "RON_BLOCKED");
  assert.match(read("app/api/dashboard/ron/sessions/route.ts"), /capability\.status !== 'RON_READY'/);
});

test("hard gate: RON review unresolved → no RON", () => {
  const unresolved = ron({ posture: { ...posture, receivingAuthorityRonAcceptance: "unknown" } });
  assert.equal(unresolved.status, "RON_OPERATOR_REVIEW_REQUIRED");
  assert.notEqual(unresolved.status, "RON_READY");
});

test("hard gate: authority stale → no authoritative dispatch", () => {
  const stale = composeAuthorityPacket(
    packetInput({ authority: { ...authority, source_verified_at: "2026-03-01T00:00:00Z", next_review_at: "2026-09-01T00:00:00Z" } }),
    NOW,
  );
  assert.equal(stale.packetStatus, "REVIEW_REQUIRED");
  const outbound = evaluateShipmentLegReadiness({
    legType: "outbound_to_authority",
    matter: { id: "m1", state: "execution_qa", apostilleRequired: true, releaseFrozen: false, isPaidAndReleased: false },
    packet: { packetStatus: stale.packetStatus, returnShippingRequired: false },
    existingLegs: [],
    origin: { name: "Milano", street1: "1 Seal Way", city: "Miami", state: "FL", zip: "33101", country: "US" },
    destination: { name: "FL DOS", street1: "PO Box 6800", city: "Tallahassee", state: "FL", zip: "32314", country: "US" },
    operatorRequest: {},
  });
  assert.equal(outbound.code, "PACKET_NOT_DISPATCH_READY");
});

test("hard gate: federal document → no state apostille", () => {
  const federalRoute = projectQuoteRouteIntelligence({ destination_country: "Italy", document_type: "FBI Identity History Summary", issuing_authority: "federal" });
  assert.equal(federalRoute.issuingLane, "federal");
  const packet = composeAuthorityPacket(packetInput({ issuingLane: "federal" }), NOW);
  assert.equal(packet.packetStatus, "NOT_READY");
  assert.ok(packet.blockers.some((b) => /Federal document/.test(b)));
  assert.equal(composeAuthorityPacket(packetInput({ issuingLane: "unresolved" }), NOW).packetStatus, "REVIEW_REQUIRED");
  assert.match(read("lib/intelligence/execution-brain/authorityPacketServer.ts"), /issuingLane: route\.issuingLane/);
});

test("hard gate: consular unresolved → review required", () => {
  const consular = projectQuoteRouteIntelligence({ destination_country: "United Arab Emirates", document_type: "Power of Attorney", issuing_authority: "private" });
  assert.equal(consular.reviewRequired, true);
  assert.ok(consular.reviewCodes.length > 0);
});

test("hard gate: no Wise payment truth → no scheduling", () => {
  const gate = evaluateSchedulingGate({ matter: { id: "m1", payment_status: "unpaid", amount_due: 250 } as never });
  assert.equal(gate.schedulingEligible, false);
  assert.equal(ron({ schedulingAuthorized: false }).status, "RON_BLOCKED");
});

test("hard gate: no execution evidence → no apostille progression", () => {
  const packet = composeAuthorityPacket(packetInput({ ronSessionStatus: "SESSION_STARTED", matterState: "in_execution" }), NOW);
  assert.equal(packet.packetStatus, "NOT_READY");
});

test("hard gate: no authentication completion → no final release; no final payment → no release", () => {
  assert.equal(finalLeg("apostille_submitted").code, "APOSTILLE_NOT_COMPLETE");
  assert.equal(finalLeg("final_balance_due", { apostilleRequired: false }).code, "FINAL_PAYMENT_REQUIRED");
  assert.equal(finalLeg("ready_for_release").allowed, true);
});

test("hard gates: label created ≠ shipped; tracking ≠ delivered; delivered leg ≠ Matter completed", () => {
  const migration = read("supabase/migrations/086_matter_shipment_legs.sql");
  const labelBlock = migration.slice(migration.indexOf("function public.record_shipment_leg_label"), migration.indexOf("function public.record_shipment_leg_dispatch"));
  assert.doesNotMatch(labelBlock, /shipped_at\s*=/);
  assert.equal(mapTrackingToLegCustody("final_international", "final_handoff", "PRE_TRANSIT"), "final_handoff");
  assert.equal(mapTrackingToLegCustody("final_international", "final_handoff", "TRANSIT"), "in_transit");
  assert.notEqual(mapTrackingToLegCustody("final_international", "final_handoff", "TRANSIT"), "delivered");
  assert.equal(completeShipmentLegEvidence({ leg_type: "final_international", custody_status: "delivered", delivered_at: "t", completed_at: "t" }).matterCompleted, false);
});

test("existing Matter workspace carries every Step 9 section (no second dashboard or shell)", () => {
  const page = read("app/dashboard/matters/[matterId]/execution/page.tsx");
  for (const panel of [
    "MatterExecutionIntelligencePanel",
    "DocumentPreflightPanel",
    "MatterRONReadiness",
    "AuthorityRoutePanel",
    "AuthorityPacketPanel",
    "AuthorityLogisticsPanel",
    "AuthorityAdvisoryPanel",
  ]) {
    assert.ok(page.includes(`<${panel} `), panel);
  }
  const labels: Record<string, string[]> = {
    "components/dashboard/execution/DocumentPreflightPanel.tsx": ["Document Preflight", "Structural Integrity", "Signature State", "Certification Signature", "Encryption State", "Execution Readiness"],
    "components/ron/MatterRONReadiness.tsx": ["Provider", "Provider capability", "Selected identity method", "Identity status", "Receiving authority", "Wet-ink requirement", "Original requirement", "RON status"],
    "components/dashboard/execution/AuthorityRoutePanel.tsx": ["Authority Route", "Origin", "State/Federal", "Hague/Non-Hague", "Competent Authority", "Authority Evidence", "Source Freshness", "Submission Method", "Review Status"],
    "components/dashboard/execution/AuthorityPacketPanel.tsx": ["Official Form", "Documents", "Paper-Out", "Government Fee", "Return Envelope", "Operator QA", "Packet Status"],
    "components/dashboard/execution/AuthorityLogisticsPanel.tsx": ["Authority Logistics", "Origin", "Destination", "Carrier", "Service", "Tracking", "label", "custody"],
    "components/dashboard/execution/AuthorityAdvisoryPanel.tsx": ["Current advisory", "Official source", "Observed date", "Estimated days", "Last verified", "Confidence", "Expiration", "ESTIMATE_NOTICE", "uppercase"],
    "components/dashboard/execution/MatterExecutionIntelligencePanel.tsx": ["Execution Intelligence", "Recommended operator actions", "MatterExecutionBriefButton"],
    "components/dashboard/execution/MatterExecutionBriefButton.tsx": ["Generate Matter execution brief"],
  };
  for (const [file, expected] of Object.entries(labels)) {
    const source = read(file);
    for (const label of expected) assert.ok(source.includes(label), `${file}: ${label}`);
    assert.doesNotMatch(source, /\b(slate|indigo)-\d/, file);
  }
  assert.match(read("app/dashboard/matters/[matterId]/page.tsx"), /<ExecutionIntelligenceStatusCard matterId=\{matterId\} \/>/);
  // No new dashboard route or shell was added for execution intelligence.
  assert.ok(!fs.existsSync(path.join(process.cwd(), "app/dashboard/execution-intelligence")));
});
