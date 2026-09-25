import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  CLIENT_ACCEPTANCE_NOTICE,
  buildMatterExecutionBrief,
  composeMatterExecutionIntelligence,
  type MatterExecutionIntelligenceInput,
} from "@/lib/intelligence/execution-brain/executionBrain";
import { projectQuoteRouteIntelligence } from "@/lib/pricing/destinationDocumentQuoteIntelligence";
import { evaluateRonProviderCapability, readRonAuthorityPosture } from "@/lib/intelligence/execution-brain/ronProviderCapabilities";
import type { AuthorityPacketProjection } from "@/lib/intelligence/execution-brain/authorityPacket";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
const NOW = new Date("2026-09-25T12:00:00Z");

const clearPosture = readRonAuthorityPosture({
  receiving_authority: "Notaio in Milano",
  receiving_authority_ron_acceptance: "accepted",
  wet_ink_requirement: "not_required",
  original_requirement: "not_required",
});

const route = projectQuoteRouteIntelligence({
  destination_country: "Italy",
  origin_state: "Florida",
  document_type: "Power of Attorney",
  document_category: "power_of_attorney",
  issuing_authority: "private",
  receiving_authority: "Notaio in Milano",
});

const ronReady = evaluateRonProviderCapability({
  matterId: "m1",
  provider: "bluenotary",
  signerLocation: "Florida",
  documentType: "Power of Attorney",
  notarialAct: "acknowledgment",
  posture: clearPosture,
  documentPreflight: "READY",
  schedulingAuthorized: true,
});

const base = (overrides: Partial<MatterExecutionIntelligenceInput> = {}): MatterExecutionIntelligenceInput => ({
  matterId: "m1",
  documentType: "Power of Attorney",
  destinationCountry: "Italy",
  originState: "Florida",
  executionTruth: { execution_method: "ron", notarial_act: "acknowledgment", notarization_requirement: "required" },
  documentPreflight: "READY",
  ronCapability: ronReady,
  ronPosture: clearPosture,
  route,
  authorityName: "Florida Department of State, Division of Corporations",
  authorityEvaluation: { status: "VERIFIED", routeReviewRequired: false, reasons: [] },
  packet: null,
  advisory: null,
  legs: [],
  activeExceptions: [],
  now: NOW,
  ...overrides,
});

const packet = (overrides: Partial<AuthorityPacketProjection> = {}) =>
  ({
    matterId: "m1",
    authorityId: "auth-fl",
    routeType: "florida_dos_apostille",
    packetStatus: "READY_TO_ASSEMBLE",
    blockers: [],
    reviewReasons: [],
    warnings: [],
    returnShippingRequired: true,
    outboundShippingRequired: true,
    createdAt: "2026-09-24T00:00:00Z",
    ...overrides,
  }) as unknown as AuthorityPacketProjection;

test("one projection with every required section, status and metadata", () => {
  const intel = composeMatterExecutionIntelligence(base());
  for (const key of [
    "matterId", "documentPreflight", "executionTruth", "ronReadiness", "providerCapabilities", "destinationIntelligence",
    "documentClassification", "authorityRoute", "authorityEvidence", "receivingAuthority", "authorityPacket",
    "processingAdvisory", "authorityLogistics", "activeExceptions", "status", "blockers", "warnings",
    "recommendedOperatorActions", "clientSafeSummary", "generatedAt",
  ]) {
    assert.ok(key in intel, key);
  }
  assert.equal(intel.generatedAt, NOW.toISOString());
});

test("status: hard block anywhere → BLOCKED", () => {
  assert.equal(composeMatterExecutionIntelligence(base({ documentPreflight: "BLOCKED" })).status, "BLOCKED");
  assert.equal(composeMatterExecutionIntelligence(base({ activeExceptions: ["Matter is in document correction required."] })).status, "BLOCKED");
  const blockedPacket = composeMatterExecutionIntelligence(base({ packet: packet({ packetStatus: "NOT_READY", blockers: ["Official form current: missing"] }) }));
  assert.equal(blockedPacket.status, "BLOCKED");
  assert.ok(blockedPacket.blockers.some((b) => b.startsWith("authorityPacket:")));
  const wetInk = composeMatterExecutionIntelligence(base({ ronPosture: { ...clearPosture, wetInkRequirement: "required" } }));
  assert.equal(wetInk.receivingAuthority.status, "BLOCKED");
  assert.equal(wetInk.status, "BLOCKED");
});

test("status: no hard block but governed review → REVIEW_REQUIRED", () => {
  const unknownAcceptance = composeMatterExecutionIntelligence(
    base({ ronPosture: { ...clearPosture, receivingAuthorityRonAcceptance: "unknown" } }),
  );
  assert.equal(unknownAcceptance.status, "REVIEW_REQUIRED");
  assert.ok(unknownAcceptance.recommendedOperatorActions.includes("Confirm receiving-authority execution posture."));
  assert.equal(composeMatterExecutionIntelligence(base({ authorityEvaluation: { status: "STALE", routeReviewRequired: true, reasons: ["expired"] } })).status, "REVIEW_REQUIRED");
  assert.equal(composeMatterExecutionIntelligence(base({ executionTruth: { execution_method: "ron" } })).status, "REVIEW_REQUIRED");
});

test("status: all applicable requirements satisfied → READY", () => {
  const intel = composeMatterExecutionIntelligence(base());
  assert.equal(intel.status, "READY", JSON.stringify(intel.warnings));
  assert.deepEqual(intel.blockers, []);
  assert.equal(intel.authorityPacket.status, "NOT_APPLICABLE");
  // Non-RON Matter: RON sections are not applicable, not blocking.
  const inPerson = composeMatterExecutionIntelligence(base({ executionTruth: { execution_method: "in_person", notarial_act: "jurat" }, ronCapability: null }));
  assert.equal(inPerson.ronReadiness.status, "NOT_APPLICABLE");
  assert.equal(inPerson.status, "READY");
});

test("return label required surfaces in logistics once the packet is dispatch-ready", () => {
  const intel = composeMatterExecutionIntelligence(base({ packet: packet({ packetStatus: "READY_FOR_DISPATCH" }) }));
  assert.equal(intel.authorityLogistics.status, "REVIEW_REQUIRED");
  assert.ok(intel.authorityLogistics.reasons.some((r) => /Return label required/.test(r)));
});

test("execution brief derives only from canonical facts; unknown stays unknown", () => {
  // Same posture feeds both RON capability and receiving-authority sections (as the loader does).
  const posture = { ...clearPosture, receivingAuthorityRonAcceptance: "unknown" as const };
  const capability = evaluateRonProviderCapability({
    matterId: "m1", provider: "bluenotary", signerLocation: "Florida", documentType: "Power of Attorney",
    notarialAct: "acknowledgment", posture, documentPreflight: "READY", schedulingAuthorized: true,
  });
  const intel = composeMatterExecutionIntelligence(base({ ronPosture: posture, ronCapability: capability }));
  const brief = buildMatterExecutionBrief(intel, { documentType: "Power of Attorney", originState: "Florida", destinationCountry: "Italy", documentOrigin: "power_of_attorney" });
  assert.match(brief, /^MATTER EXECUTION BRIEF/);
  assert.match(brief, /Document: Power of Attorney/);
  assert.match(brief, /Origin: Florida power of attorney/);
  assert.match(brief, /Destination: Italy/);
  assert.match(brief, /Document Preflight: Ready/);
  assert.match(brief, /RON: Operator review required/);
  assert.match(brief, /Reason: Receiving-authority acceptance/);
  assert.match(brief, /Authority Packet: Not started/);
  assert.match(brief, /Next Operator Action: Confirm receiving-authority execution posture\./);
  assert.ok(brief.includes(CLIENT_ACCEPTANCE_NOTICE));

  const unknown = buildMatterExecutionBrief(composeMatterExecutionIntelligence(base({ documentType: null, destinationCountry: null })), {
    documentType: null,
    originState: null,
    destinationCountry: null,
    documentOrigin: null,
  });
  assert.match(unknown, /Document: Unknown/);
  assert.match(unknown, /Origin: Unknown/);
  assert.match(unknown, /Destination: Unknown/);
  assert.doesNotMatch(unknown, /guarantee|legally sufficient|will be accepted|you should sign|we recommend the/i);
  const lib = read("lib/intelligence/execution-brain/executionBrain.ts");
  assert.doesNotMatch(lib, /anthropic|openai|fetch\(/i, "brief is deterministic, no model call");
});

test("client-safe summary: no internal notes, evidence, legal advice or guarantee", () => {
  const intel = composeMatterExecutionIntelligence(
    base({
      activeExceptions: ["A protected-identifier hold is unresolved."],
      authorityEvaluation: { status: "REVIEW_REQUIRED", routeReviewRequired: true, reasons: ["Model-generated authority facts are never verified."] },
      packet: packet({ packetStatus: "NOT_READY", blockers: ["Official form hash does not match the registered repository asset."] }),
    }),
  );
  const serialized = JSON.stringify(intel.clientSafeSummary);
  for (const secret of ["hold", "hash", "Model-generated", "authority facts", "blocked", "exception", "sha", "bluenotary"]) {
    assert.ok(!serialized.toLowerCase().includes(secret.toLowerCase()), secret);
  }
  assert.equal(intel.clientSafeSummary.notice, "Final acceptance remains subject to the receiving authority.");
  assert.doesNotMatch(serialized, /guarantee|legal advice|you should/i);
});

test("read-only projection: no new Matter, no writes, no state machine", () => {
  const server = read("lib/intelligence/execution-brain/executionBrainServer.ts");
  assert.doesNotMatch(server, /\.(insert|update|upsert|delete)\(|\.rpc\(/);
  const lib = read("lib/intelligence/execution-brain/executionBrain.ts");
  assert.doesNotMatch(lib, /createAdminClient|supabase|MATTER_ALLOWED_TRANSITIONS|canTransitionMatter/);
  const route = read("app/api/dashboard/matters/[id]/execution-intelligence/route.ts");
  assert.match(route, /requireDashboardAccess\(\)/);
  assert.doesNotMatch(route, /export async function (POST|PATCH|PUT|DELETE)/);
  const migrations = fs.readdirSync(path.join(process.cwd(), "supabase/migrations"));
  assert.ok(!migrations.some((file) => /execution_intelligence|execution_brain/.test(file)));
});
