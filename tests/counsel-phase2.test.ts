import test from "node:test";
import assert from "node:assert/strict";
import {
  appendOperatorAction,
  operatorActionSchema,
  projectAcquisition,
  acquisitionSummary,
  filterAcquisition,
  type AcquisitionLead,
  type OperatorAction,
} from "@/lib/counsel/operator";
import {
  counselAttribution,
  cleanCounselAttribution,
  counselHref,
  inquirySchema,
  safeCounselFilename,
} from "@/lib/counsel/inquiry";
import { professionalMatterEntryDefaults } from "@/lib/professional/profile";
import { COUNSEL_CORRIDORS, COUNSEL_USE_CASES } from "@/lib/counsel/content";
import { getProfessionalDestination } from "@/lib/professional/universal-attorney-journey";
import { getPublicCountryExecutionIntelligence } from "@/data/public-country-intelligence";
const lead: AcquisitionLead = {
  id: "lead",
  email: "counsel@example.com",
  country: "Italy",
  created_at: "2026-11-07T00:00:00Z",
  canonical_matter_id: null,
  details: {
    document_status: "pending",
    attribution: {
      source: "instagram",
      campaign: "first",
      practice_area: "citizenship",
    },
    destination: "Italy",
  },
};
const action = (
  kind: OperatorAction["kind"],
  extras: Partial<OperatorAction> = {},
): OperatorAction => ({
  id: "91be3b33-7fac-45df-93c0-1cb52171d393",
  kind,
  note: "Reviewed the professional inquiry",
  next_action: "Contact counsel",
  actor: "operator",
  recorded_at: "2026-11-07T01:00:00Z",
  evidence_scope: "operator_attested",
  ...extras,
});
test("operator stages require persisted evidence and canonical records", () => {
  assert.equal(projectAcquisition(lead).stage, "NEW");
  const reviewing = {
    ...lead,
    details: appendOperatorAction(lead, action("review")).details,
  };
  assert.equal(projectAcquisition(reviewing).stage, "REVIEWING");
  assert.equal(
    operatorActionSchema.safeParse(action("respond")).success,
    false,
  );
  const response = action("respond", {
    id: "798ef6bc-f478-4d30-9bfb-e0ae60a7f2c1",
    channel: "phone",
    evidence_reference: "Call record 7",
  });
  const responded = {
    ...reviewing,
    details: appendOperatorAction(reviewing, response).details,
  };
  assert.equal(projectAcquisition(responded).stage, "RESPONDED");
  assert.equal(
    projectAcquisition(responded).response_evidence,
    "operator_attested",
  );
  const qualified = {
    ...responded,
    details: appendOperatorAction(
      responded,
      action("qualify", {
        id: "90cf56b6-0fc9-4f38-8290-2acc936ba95e",
        professional_profile_id: "76820bf9-f811-43f7-8cb0-dfbff211db47",
      }),
    ).details,
  };
  assert.equal(projectAcquisition(qualified).stage, "QUALIFIED");
  const linked = { ...qualified, canonical_matter_id: "matter" };
  assert.notEqual(projectAcquisition(linked).stage, "MATTER CREATED");
  assert.equal(projectAcquisition(linked).linkage_pending, true);
  assert.equal(
    projectAcquisition(linked, { id: "matter" }).stage,
    "MATTER CREATED",
  );
  assert.equal(
    projectAcquisition(linked, {
      id: "matter",
      completed_at: "2026-11-07",
      professional_profile_id: "firm",
    }).repeat_opportunity,
    true,
  );
});
test("action retries preserve the original evidence and cannot be replayed as another action", () => {
  const first = action("review");
  const updated = {
    ...lead,
    details: appendOperatorAction(lead, first).details,
  };
  assert.equal(
    appendOperatorAction(updated, {
      ...first,
      recorded_at: "2026-11-08T00:00:00Z",
    }).duplicate,
    true,
  );
  assert.throws(() =>
    appendOperatorAction(updated, { ...first, note: "Different evidence" }),
  );
  assert.throws(() =>
    appendOperatorAction(
      lead,
      action("qualify", { professional_profile_id: "firm" }),
    ),
  );
  assert.equal(updated.details.document_status, "pending");
  assert.deepEqual(updated.details.attribution, lead.details.attribution);
});
test("operational cohort and marketing source segments remain bounded and unknown remains unknown", () => {
  const other = {
    ...lead,
    id: "unknown",
    details: { document_status: "received" },
  };
  const summary = acquisitionSummary(
    [lead, other],
    [],
    Date.parse("2026-11-07T03:00:00Z"),
  );
  assert.equal(summary.sources.unknown, 1);
  assert.equal(summary.sources.instagram, 1);
  assert.equal(summary.awaiting_response, 2);
  assert.equal(summary.documents_received, 1);
  assert.equal(summary.destinations.Italy.linked_matters, 0);
  assert.equal(
    filterAcquisition(
      [lead, other],
      new URLSearchParams("source=instagram&practice_area=citizenship"),
    ).length,
    1,
  );
  assert.equal(
    filterAcquisition([lead], new URLSearchParams("professional_id=spoofed"))
      .length,
    0,
  );
});
test("context links preserve real campaigns without carrying identity or operational authority", () => {
  const context = counselAttribution(
    new URLSearchParams(
      "source=instagram&medium=social&campaign=first&content=poa&practice_area=private-client&landing_page=%2Fprofessional%2Fitaly&pro=private&ref=secret&payment_confirmed=true",
    ),
  );
  const url = new URL(counselHref("Italy", context), "https://example.com");
  assert.equal(url.searchParams.get("destination"), "Italy");
  assert.equal(url.searchParams.get("medium"), "social");
  assert.equal(url.searchParams.has("pro"), false);
  assert.equal(url.searchParams.has("ref"), false);
  assert.equal(url.searchParams.has("payment_confirmed"), false);
  const clean = cleanCounselAttribution({
    ...context,
    professional_profile_id: "spoof",
    canonical_first_touch: JSON.stringify({
      source: "google",
      pro: "secret",
      referrer: "https://private.example/?token=secret",
    }),
  });
  assert.equal(clean.professional_profile_id, undefined);
  assert.deepEqual(JSON.parse(clean.canonical_first_touch), {
    source: "google",
  });
});
test("new Matter defaults never carry destination, receiving authority or execution preferences forward", () => {
  const safe = professionalMatterEntryDefaults({
    firm_name: "Firm",
    preferred_destination_countries: ["Italy"],
    preferred_execution_method: "ron_when_eligible",
    default_receiving_authority: "Prior recipient",
    default_client_handoff_mode: "client_completes",
    client_instruction_template: "Confirm all current instructions",
  });
  assert.deepEqual(safe, {
    default_client_handoff_mode: "client_completes",
    client_instruction_template: "Confirm all current instructions",
  });
});
test("all selected corridors use existing intelligence and use cases link to supported service scope", () => {
  assert.equal(COUNSEL_CORRIDORS.length, 9);
  assert.equal(COUNSEL_USE_CASES.length, 10);
  for (const slug of COUNSEL_CORRIDORS) {
    const destination = getProfessionalDestination(slug);
    assert.ok(destination);
    const intelligence = getPublicCountryExecutionIntelligence(
      slug,
      destination.name,
    );
    assert.ok(intelligence.sourceStatus);
  }
  const uae = getPublicCountryExecutionIntelligence("uae", "UAE");
  assert.notEqual(uae.routeType, "hague_apostille");
  assert.equal(
    getPublicCountryExecutionIntelligence("unsupported", "Unknown")
      .sourceStatus,
    "UNAVAILABLE",
  );
  assert.equal(new Set(COUNSEL_USE_CASES.map((item) => item.slug)).size, 10);
});
test("malicious filenames cannot control storage paths or expose control characters", () => {
  assert.equal(
    safeCounselFilename("../../private\\file\u0000.pdf"),
    ".._.._private_file_.pdf",
  );
  assert.equal(safeCounselFilename("a".repeat(500)).length, 200);
  assert.equal(safeCounselFilename("  "), "document");
});

test("untrusted source and destination labels cannot mutate object prototypes", () => {
  const input = {
    ...lead,
    details: { attribution: { source: "__proto__" }, destination: "__proto__" },
  };
  const summary = acquisitionSummary([input], []);
  assert.equal(
    Object.prototype.hasOwnProperty.call(summary.sources, "__proto__"),
    true,
  );
  assert.equal(summary.sources["__proto__"], 1);
  assert.equal(summary.destinations["__proto__"].inquiries, 1);
  assert.equal(
    Object.prototype.hasOwnProperty.call(Object.prototype, "inquiries"),
    false,
  );
});

test("public acquisition input cannot establish professional or execution authority", () => {
  const parsed = inquirySchema.parse({
    request_id: "126a94a2-83f0-4a10-b42e-ed0880a2dfb7",
    intent: "execution_review",
    full_name: "Synthetic counsel",
    firm: "Synthetic firm",
    email: "qa@example.com",
    country: "Italy",
    destination: "tampered destination",
    summary: "This input is non-authoritative context only.",
    professional_profile_id: "spoofed",
    payment_confirmed: true,
    execution_truth: { execution_method: "ron" },
    attribution: {
      source: "instagram",
      ref: "forged",
      pro: "spoofed",
      payment_status: "paid",
    },
  });
  assert.equal(parsed.destination, "tampered destination");
  assert.equal("professional_profile_id" in parsed, false);
  assert.equal("execution_truth" in parsed, false);
  assert.equal("payment_confirmed" in parsed, false);
  assert.deepEqual(parsed.attribution, { source: "instagram" });
});

test("today's operator cohort uses the New York business day across UTC midnight", () => {
  const prior = { ...lead, created_at: "2026-11-07T01:00:00Z" };
  const current = {
    ...lead,
    id: "new-day",
    created_at: "2026-11-07T06:00:00Z",
  };
  assert.equal(
    acquisitionSummary([prior, current], [], Date.parse("2026-11-07T08:00:00Z"))
      .new_today,
    1,
  );
});

test("upload-failure telemetry requires evidence and never infers failure from missing confirmation", async () => {
  const { confirmedUploadFailure } = await import("@/lib/counsel/inquiry");
  assert.equal(confirmedUploadFailure("UPLOAD_FAILED"), true);
  assert.equal(confirmedUploadFailure("PRIVATE_STORAGE_UNAVAILABLE"), true);
  for (const code of [
    undefined,
    "PERSISTENCE_UNAVAILABLE",
    "RECEIPT_UNCONFIRMED",
    "DOCUMENT_CONFIRMATION_UNAVAILABLE",
    "DUPLICATE_IN_PROGRESS",
  ])
    assert.equal(confirmedUploadFailure(code), false);
});
