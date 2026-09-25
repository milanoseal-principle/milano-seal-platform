import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { composeGovernedQuote } from "@/lib/pricing/governedQuotePreview";
import {
  RECEIVING_AUTHORITY_ACCEPTANCE_NOTICE,
  classifyQuoteDocument,
  projectQuoteRouteIntelligence,
} from "@/lib/pricing/destinationDocumentQuoteIntelligence";
import { isQuoteMutationLocked } from "@/lib/pricing/quoteMutationLock";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

// Already-issued state record: no new notarization, apostille route.
const alreadyIssued = {
  notarization_requirement: "not_required",
  authentication_requirement: "apostille",
  execution_method: "none",
};

test("1. Italy vital record: state origin, already certified, Hague route, Authentication Matter, first apostille included", () => {
  const { preview, route } = composeGovernedQuote({
    ...alreadyIssued,
    destination_country: "Italy",
    origin_state: "Florida",
    document_type: "Certified birth certificate",
    issuing_authority: "state",
    matter_base: "authentication",
    document_count: 1,
    apostille_count: 1,
  });

  assert.equal(route.documentCategory, "vital_record");
  assert.equal(route.routeType, "hague_apostille");
  assert.equal(route.issuingLane, "state");
  assert.equal(route.authorityStatus, "VERIFIED");
  assert.equal(preview.review_required, false, preview.review_reasons.join(","));
  assert.equal(preview.matter_base, "authentication");
  assert.equal(preview.total, 599);
  assert.equal(preview.breakdown.length, 1, "first apostille is included in the base");
  assert.equal(preview.deposit_amount, 299.5);
  assert.equal(preview.balance_due, 299.5);
  assert.equal(preview.payment_mode, "split_50_50");
  assert.equal(preview.route_intelligence.routeLabel.length > 0, true);
});

test("2. Italy POA: new signer execution is required and never inferred from the POA alone", () => {
  const posture = {
    destination_country: "Italy",
    origin_state: "Florida",
    document_type: "Power of Attorney",
    issuing_authority: "private",
    receiving_authority: "Notaio in Milano",
  };

  // Document name alone: no execution method is invented.
  const unresolved = composeGovernedQuote({ ...posture, authentication_requirement: "apostille" });
  assert.equal(unresolved.route.documentCategory, "power_of_attorney");
  assert.equal(unresolved.preview.review_required, true);
  assert.equal(unresolved.preview.total, null);
  assert.equal(unresolved.truth.execution_method, "review_required");
  assert.notEqual(unresolved.preview.execution_method, "ron");

  // Explicit RON execution facts → Signature Matter.
  const ron = composeGovernedQuote({
    ...posture,
    notarization_requirement: "required",
    notarial_act: "acknowledgment",
    execution_method: "ron",
    signer_location: "Florida",
    ron_kba_status: "required",
    ron_credential_analysis_status: "required",
    authentication_requirement: "apostille",
    matter_base: "signature",
    apostille_count: 1,
  });
  assert.equal(ron.preview.review_required, false, ron.preview.review_reasons.join(","));
  assert.equal(ron.preview.execution_method, "ron");
  assert.equal(ron.preview.total, 750);

  // Explicit in-person facts → same Signature base, no stacking.
  const inPerson = composeGovernedQuote({
    ...posture,
    notarization_requirement: "required",
    notarial_act: "acknowledgment",
    execution_method: "in_person",
    execution_location: "Miami, FL",
    authentication_requirement: "apostille",
    matter_base: "signature",
    apostille_count: 1,
  });
  assert.equal(inPerson.preview.execution_method, "in_person");
  assert.equal(inPerson.preview.total, 750);

  // Without a receiving authority the POA class fails closed.
  const noAuthority = composeGovernedQuote({
    ...posture,
    receiving_authority: "",
    notarization_requirement: "required",
    notarial_act: "acknowledgment",
    execution_method: "in_person",
    execution_location: "Miami, FL",
    authentication_requirement: "apostille",
  });
  assert.equal(noAuthority.preview.review_required, true);
  assert.ok(noAuthority.preview.review_reasons.includes("ROUTE_RECEIVING_AUTHORITY_UNKNOWN"));
});

test("3. FBI background check routes federal and never through state apostille", () => {
  const { preview, route } = composeGovernedQuote({
    ...alreadyIssued,
    destination_country: "Italy",
    document_type: "FBI Identity History Summary (background check)",
    issuing_authority: "federal",
    matter_base: "authentication",
    apostille_count: 1,
  });
  assert.equal(route.documentCategory, "fbi_background_check");
  assert.equal(route.issuingLane, "federal");
  assert.equal(route.federalAgency, "Federal Bureau of Investigation");
  assert.equal(route.pricingFacts.federal_apostille, true);
  assert.match(route.routeLabel, /Federal/);
  assert.ok(route.authorityPath.some((step) => /Department of State/.test(step)));
  assert.ok(!route.authorityPath.some((step) => /Secretary of State/.test(step)));
  assert.ok(preview.breakdown.some((line) => line.code === "fbi_federal_apostille"));

  // Marking a federal record as state-issued is a governed conflict, not a
  // silent conversion into a state apostille Matter.
  const conflict = projectQuoteRouteIntelligence({
    destination_country: "Italy",
    origin_state: "Florida",
    document_type: "FBI background check",
    issuing_authority: "state",
  });
  assert.equal(conflict.issuingLane, "federal");
  assert.ok(conflict.reviewCodes.includes("ROUTE_FEDERAL_STATE_CONFLICT"));

  // Federal issuer without an identified agency fails closed.
  const unidentified = projectQuoteRouteIntelligence({
    destination_country: "Italy",
    document_type: "Government record",
    issuing_authority: "federal",
  });
  assert.ok(unidentified.reviewCodes.includes("ROUTE_FEDERAL_AGENCY_UNIDENTIFIED"));
  assert.equal(unidentified.pricingFacts.federal_apostille, true);
});

test("4. UAE corporate document: consular/legalization review blocks the automatic final quote", () => {
  const { preview, route } = composeGovernedQuote({
    ...alreadyIssued,
    authentication_requirement: "authentication_legalization",
    destination_country: "United Arab Emirates",
    origin_state: "Delaware",
    document_type: "Certificate of Incorporation — corporate document",
    issuing_authority: "state",
    receiving_authority: "Dubai corporate registry",
    matter_base: "executive",
  });
  assert.equal(route.destinationSlug, "uae");
  assert.equal(route.routeType, "consular_legalization");
  assert.equal(route.authorityStatus, "NON_HAGUE");
  assert.equal(route.pricingFacts.consular_legalization, true);
  assert.equal(preview.review_required, true);
  assert.ok(preview.review_reasons.includes("consular_legalization"));
  assert.ok(preview.review_reasons.includes("ROUTE_CONSULAR_LEGALIZATION_REVIEW"));
  assert.ok(
    !preview.breakdown.some((line) => /consul|embassy|legali[sz]ation/i.test(line.label)),
    "consular costs are never auto-priced",
  );
});

test("5. unknown receiving authority for an authority-dependent document class blocks the final quote", () => {
  const { preview, route } = composeGovernedQuote({
    ...alreadyIssued,
    destination_country: "Spain",
    origin_state: "New York",
    document_type: "Board resolution",
    issuing_authority: "private",
    receiving_authority: "unknown",
  });
  assert.equal(route.documentCategory, "corporate_document");
  assert.equal(route.receivingAuthorityType, "unknown");
  assert.equal(route.pricingFacts.receiving_authority_uncertain, true);
  assert.equal(preview.review_required, true);
  assert.ok(preview.review_reasons.includes("ROUTE_RECEIVING_AUTHORITY_UNKNOWN"));
  assert.ok(preview.review_reasons.includes("unknown_authority_fee"));
  assert.equal(route.acceptanceNotice, RECEIVING_AUTHORITY_ACCEPTANCE_NOTICE);
  assert.equal(RECEIVING_AUTHORITY_ACCEPTANCE_NOTICE, "Final acceptance remains subject to the receiving authority.");
});

test("6. six vital records with six apostilles = Authentication base + five additional apostilled documents", () => {
  const { preview } = composeGovernedQuote({
    ...alreadyIssued,
    destination_country: "Italy",
    origin_state: "California",
    document_type: "Birth, marriage and death certificates (vital records)",
    issuing_authority: "state",
    matter_base: "authentication",
    document_count: 6,
    apostille_count: 6,
  });
  assert.equal(preview.review_required, false, preview.review_reasons.join(","));
  assert.equal(preview.total, 599 + 5 * 250);
  const apostilleLine = preview.breakdown.find((line) => line.code === "additional_apostilled_documents");
  assert.equal(apostilleLine?.amount, 1250);
  assert.equal(preview.breakdown.filter((line) => line.category === "base").length, 1, "Matter bases never stack");
});

test("7. apostilled documents are never double-charged the non-apostille document fee", () => {
  const base = {
    ...alreadyIssued,
    destination_country: "Italy",
    origin_state: "Florida",
    document_type: "Vital records",
    issuing_authority: "state",
    matter_base: "authentication",
  };
  const allApostilled = composeGovernedQuote({ ...base, document_count: 3, apostille_count: 3 }).preview;
  assert.ok(!allApostilled.breakdown.some((line) => line.code === "additional_non_apostille_documents"));
  assert.equal(allApostilled.total, 599 + 2 * 250);

  const mixed = composeGovernedQuote({ ...base, document_count: 3, apostille_count: 1 }).preview;
  assert.equal(mixed.breakdown.find((line) => line.code === "additional_non_apostille_documents")?.amount, 2 * 75);
  assert.ok(!mixed.breakdown.some((line) => line.code === "additional_apostilled_documents"));
  assert.equal(mixed.total, 599 + 2 * 75);
});

test("8. payment activity locks quote mutation", () => {
  assert.equal(isQuoteMutationLocked({ payment_status: "unpaid", amount_paid: 0 }), false);
  assert.equal(isQuoteMutationLocked({ payment_status: "observed_pending" }), true);
  assert.equal(isQuoteMutationLocked({ payment_status: "paid" }), true);
  assert.equal(isQuoteMutationLocked({ payment_status: "unpaid", amount_paid: 299.5 }), true);
  assert.equal(isQuoteMutationLocked({ payment_status: "unpaid", payment_observed_at: "2026-09-01T00:00:00Z" }), true);

  const commit = read("app/api/deals/[id]/quote/route.ts");
  const lockIndex = commit.indexOf("isQuoteMutationLocked(");
  const updateIndex = commit.indexOf('.from("deals")\n        .update(');
  assert.ok(lockIndex > -1 && updateIndex > lockIndex, "lock check precedes every pricing write");
  assert.match(commit, /QUOTE_LOCKED_AFTER_PAYMENT_ACTIVITY/);

  const builder = read("components/dashboard/OperatorQuoteBuilder.tsx");
  assert.match(builder, /isQuoteMutationLocked\(/);
});

test("9. browser-supplied route intelligence and review flags cannot override the server projection", () => {
  const { preview } = composeGovernedQuote({
    ...alreadyIssued,
    destination_country: "United Arab Emirates",
    origin_state: "Florida",
    document_type: "Corporate resolution",
    issuing_authority: "state",
    receiving_authority: "Dubai bank",
    consular_legalization: false,
    review_required: false,
    review_reasons: [],
    route_intelligence: {
      routeType: "hague_apostille",
      reviewRequired: false,
      reviewReasons: [],
      authorityStatus: "VERIFIED",
    },
    total: 1,
    deposit_amount: 0.5,
    discount_amount: 5000,
  });
  assert.equal(preview.review_required, true);
  assert.equal(preview.route_intelligence.routeType, "consular_legalization");
  assert.equal(preview.route_intelligence.reviewRequired, true);
  assert.equal(preview.discount_amount, 0, "discounts apply only through the governed discount service");

  const commit = read("app/api/deals/[id]/quote/route.ts");
  assert.match(commit, /composeGovernedQuote\(/);
  assert.match(commit, /quote_route_review_required/);
  assert.match(commit, /deal_status: "reviewing"/);
  assert.match(commit, /canonical_quote_approved/);
  const reviewBranch = commit.slice(
    commit.indexOf("if (!projection || reviewReasons.length > 0)"),
    commit.indexOf("const quote = projection.quote;"),
  );
  assert.doesNotMatch(reviewBranch, /awaiting_payment/);
  assert.doesNotMatch(reviewBranch, /amount_due/);
  for (const field of [
    "matter_pricing_type",
    "quote_execution_method",
    "pricing_version",
    "quote_breakdown",
    "quote_review_required: false",
    "quote_review_reasons: []",
    "base_price",
    "original_total",
    "eligible_subtotal",
    "non_discountable_total",
    "final_total",
    "invoice_subtotal",
    "invoice_retainer",
    "invoice_balance",
    "amount_due",
    "currency",
    "quote_approved_at",
    "quote_approved_by",
  ]) {
    assert.ok(commit.includes(field), `approved quote must persist ${field}`);
  }
});

test("10. public surfaces cannot import the private numeric pricing catalog or quote engine", () => {
  const privateModules = /lib\/pricing\/(pricingCatalog|pricingComposer|canonicalQuoteOrchestrator|governedQuotePreview|destinationDocumentQuoteIntelligence)["']/;
  const internalPrefixes = ["app/api/", "app/dashboard/", "app/admin/", "app/founder/", "app/operator/"];
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(rel);
      else if (/\.(ts|tsx)$/.test(entry.name)) {
        if (internalPrefixes.some((prefix) => rel.startsWith(prefix))) continue;
        if (rel.startsWith("components/dashboard/")) continue;
        if (privateModules.test(read(rel))) offenders.push(rel);
      }
    }
  };
  walk("app");
  walk("components");
  assert.deepEqual(offenders, []);

  const preview = read("app/api/pricing/quote/route.ts");
  assert.match(preview, /isOperatorOrFounder\(role\)/, "private quote preview is operator-only");
});

test("document classification fails closed and never selects an execution method", () => {
  assert.equal(classifyQuoteDocument("mystery packet").category, "other_review_required");
  assert.equal(classifyQuoteDocument("U.S. District Court judgment").category, "federal_document");
  assert.equal(classifyQuoteDocument("Divorce decree").category, "court_document");
  assert.equal(classifyQuoteDocument("anything", "vital_record").source, "operator");

  const unclassified = projectQuoteRouteIntelligence({
    destination_country: "Italy",
    origin_state: "Florida",
    document_type: "mystery packet",
    issuing_authority: "private",
    receiving_authority: "Comune di Roma",
  });
  assert.ok(unclassified.reviewCodes.includes("ROUTE_DOCUMENT_CLASSIFICATION_REVIEW"));

  const unknownDestination = projectQuoteRouteIntelligence({
    destination_country: "Atlantis",
    origin_state: "Florida",
    document_type: "Birth certificate",
    issuing_authority: "state",
  });
  assert.equal(unknownDestination.routeType, "review_required");
  assert.equal(unknownDestination.authorityStatus, "INSUFFICIENT_EVIDENCE");
  assert.ok(unknownDestination.reviewCodes.includes("ROUTE_DESTINATION_NOT_IN_REGISTRY"));

  const embassy = projectQuoteRouteIntelligence({
    destination_country: "Italy",
    origin_state: "Florida",
    document_type: "Birth certificate",
    issuing_authority: "state",
    receiving_authority: "Italian Consulate in Miami",
  });
  assert.equal(embassy.receivingAuthorityType, "consulate");
  assert.equal(embassy.pricingFacts.consular_legalization, true);
});
