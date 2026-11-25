import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  detectShipmentLegExceptions,
  evaluateProviderTransactionScan,
  purchaseCorrelationRef,
  RECONCILE_MIN_PENDING_MS,
  reconciliationWindowOpen,
  transactionBelongsToAttempt,
  evaluateLabelPurchaseReadiness,
  evaluateReturnLabelReadiness,
  operatorShipmentLegProjection,
  RATE_SNAPSHOT_MAX_AGE_MS,
  selectGovernedRate,
  type ShipmentLegRow,
} from "@/lib/intelligence/execution-brain/authorityLogistics";
import { filterApprovedRates } from "@/lib/shippo/carrierPolicy";
import { classifyShippoPurchaseError } from "@/lib/shippo/client";
import { calculateCourierCharge } from "@/lib/shippo/courierCredit";
import {
  buildDocumentCustomsPayload,
  CustomsReviewRequiredError,
  getCustomsAdvisory,
  resolveAuthorizedCustomsDeclarant,
} from "@/lib/shippo/customs";
import { buildClientDeliveryJourney, safeCarrierTrackingUrl } from "@/lib/shippo/deliveryJourney";
import { partitionComparableRates, rankApprovedRates, rateAmountMinorUnits } from "@/lib/shippo/rateSelection";
import type { ShippoRate } from "@/lib/shippo/types";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
const NOW = new Date("2026-11-25T12:00:00Z");
const PASS = { allowed: true, code: null, reasons: [] };

const rate = (id: string, provider: string, amount: string, days: number, currency = "USD"): ShippoRate => ({
  object_id: id,
  provider,
  servicelevel: { name: `${provider} service`, token: `${provider.toLowerCase().replace(/\s+/g, "_")}_svc` },
  estimated_days: days,
  amount,
  currency,
  amount_local: amount,
  currency_local: currency,
});

const leg = (overrides: Partial<ShipmentLegRow> = {}): ShipmentLegRow => ({
  id: "leg-1",
  matter_id: "m1",
  provider: "shippo",
  provider_shipment_id: "shp_secret",
  provider_transaction_id: "txn_secret",
  leg_type: "final_international",
  sequence: 3,
  direction: "final",
  origin_json: { name: "The Milano Seal", street1: "1 Seal Way", city: "Miami", state: "FL", zip: "33101", country: "US" },
  destination_json: { name: "Recipient", street1: "Via Roma 1", city: "Milano", country: "IT" },
  rate_snapshot: {
    provider_rate_id: "rate_internal",
    carrier: "DHL Express",
    service: "Express Worldwide",
    service_token: "dhl_express_worldwide",
    amount: "61.20",
    currency: "USD",
    estimated_days: 3,
    rank: 1,
    recommended: true,
    selection_policy: "FASTEST_APPROVED",
    selection_reason: "Executive lane",
    selected_at: new Date(NOW.getTime() - 60 * 60 * 1000).toISOString(),
    selected_by: "op-1",
  },
  carrier: "DHL Express",
  service_level: "Express Worldwide",
  label_status: "rate_selected",
  tracking_number: null,
  tracking_status: null,
  custody_status: "not_started",
  provider_evidence: {},
  exception_reason: null,
  label_created_at: null,
  shipped_at: null,
  delivered_at: null,
  completed_at: null,
  created_at: "2026-11-20T00:00:00Z",
  ...overrides,
});

// ── Carrier ranking ──

test("domestic USPS is eligible and wins the Signature lane on lowest approved cost", () => {
  const ranked = rankApprovedRates({
    rates: filterApprovedRates([rate("usps", "USPS", "9.50", 3), rate("ups", "UPS", "10.00", 2), rate("fedex", "FedEx", "18.00", 1)]),
    lane: "signature",
    destinationCountry: "US",
  });
  assert.equal(ranked[0].rate.object_id, "usps");
  assert.equal(ranked[0].recommended, true);
});

test("FedEx stays a ranked approved alternative; UPS remains the fallback when others are absent", () => {
  const ranked = rankApprovedRates({ rates: [rate("dhl", "DHL Express", "60.00", 2), rate("fedex", "FedEx", "70.00", 2)], lane: "executive", destinationCountry: "IT" });
  assert.deepEqual(ranked.map((r) => r.rate.object_id), ["dhl", "fedex"]);
  assert.equal(ranked[1].selectionReason, "Approved alternative retained for operator review.");
  const fallback = rankApprovedRates({ rates: filterApprovedRates([rate("ups", "UPS", "40.00", 4), rate("x", "SpeedX", "5.00", 1)]), lane: "signature", destinationCountry: "IT" });
  assert.deepEqual(fallback.map((r) => r.rate.object_id), ["ups"]);
});

test("DHL Express leads international executive ranking on speed", () => {
  const ranked = rankApprovedRates({ rates: [rate("ups", "UPS", "50.00", 4), rate("dhl", "DHL Express", "75.00", 2)], lane: "executive", destinationCountry: "DE" });
  assert.equal(ranked[0].rate.object_id, "dhl");
});

test("rejected and unapproved carriers (ShipX, SpeedX, Better Trucks, Canada Post, LSO) are excluded", () => {
  const approved = filterApprovedRates([
    rate("a", "ShipX", "1.00", 1),
    rate("b", "SpeedX", "1.00", 1),
    rate("c", "Better Trucks", "1.00", 1),
    rate("d", "Canada Post", "1.00", 1),
    rate("e", "LSO", "1.00", 1),
    rate("f", "UPS", "30.00", 3),
  ]);
  assert.deepEqual(approved.map((r) => r.object_id), ["f"]);
});

test("a EUR rate is never ranked as if it were USD, and malformed amounts are excluded", () => {
  const rates = [rate("eur", "DHL Express", "20.00", 2, "EUR"), rate("bad", "FedEx", "N/A", 1), rate("usd", "UPS", "45.00", 3)];
  const ranked = rankApprovedRates({ rates, lane: "signature", destinationCountry: "IT" });
  assert.deepEqual(ranked.map((r) => r.rate.object_id), ["usd"]);
  const { excluded } = partitionComparableRates(rates);
  assert.deepEqual(excluded.map((e) => [e.rate.object_id, e.reason]), [["eur", "CURRENCY_REVIEW_REQUIRED"], ["bad", "RATE_AMOUNT_UNAVAILABLE"]]);
  assert.equal(rateAmountMinorUnits("10.5"), 1050);
  assert.equal(rateAmountMinorUnits("-1.00"), null);
});

test("selecting a non-USD approved rate is a currency review, not a silent purchase", () => {
  const result = selectGovernedRate({
    rates: [rate("eur", "DHL Express", "20.00", 2, "EUR"), rate("usd", "UPS", "45.00", 3)],
    lane: "signature",
    destinationCountry: "IT",
    selectedRateId: "eur",
    selectedBy: "op-1",
  });
  assert.equal(result.error, "COURIER_CURRENCY_REVIEW_REQUIRED");
  assert.equal(result.snapshot, null);
  const none = selectGovernedRate({ rates: [rate("eur", "DHL Express", "20.00", 2, "EUR")], lane: "signature", destinationCountry: "IT", selectedBy: "op-1" });
  assert.equal(none.error, "NO_APPROVED_CARRIER_RATE");
});

// ── Purchase gates ──

test("an expired rate snapshot cannot be purchased; a fresh one passes", () => {
  const fresh = evaluateLabelPurchaseReadiness({ leg: leg(), matterId: "m1", operatorAuthorized: true, currentGate: PASS, now: NOW });
  assert.equal(fresh.allowed, true);
  const stale = leg({
    rate_snapshot: { ...leg().rate_snapshot!, selected_at: new Date(NOW.getTime() - RATE_SNAPSHOT_MAX_AGE_MS - 1).toISOString() },
  });
  const blocked = evaluateLabelPurchaseReadiness({ leg: stale, matterId: "m1", operatorAuthorized: true, currentGate: PASS, now: NOW });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.code, "RATE_EXPIRED");
  const futureDated = leg({ rate_snapshot: { ...leg().rate_snapshot!, selected_at: "2027-01-01T00:00:00Z" } });
  assert.equal(evaluateLabelPurchaseReadiness({ leg: futureDated, matterId: "m1", operatorAuthorized: true, currentGate: PASS, now: NOW }).code, "RATE_EXPIRED");
});

test("a non-USD persisted snapshot cannot be purchased", () => {
  const eur = leg({ rate_snapshot: { ...leg().rate_snapshot!, currency: "EUR" } });
  const result = evaluateLabelPurchaseReadiness({ leg: eur, matterId: "m1", operatorAuthorized: true, currentGate: PASS, now: NOW });
  assert.equal(result.code, "COURIER_CURRENCY_REVIEW_REQUIRED");
});

test("return-label purchase also enforces snapshot freshness", () => {
  const stale = leg({
    leg_type: "return_from_authority",
    rate_snapshot: { ...leg().rate_snapshot!, selected_at: "2026-09-25T00:00:00Z" },
  });
  const result = evaluateReturnLabelReadiness({
    leg: stale,
    matterId: "m1",
    packet: { packetStatus: "READY_FOR_DISPATCH", returnShippingRequired: true },
    explicitRequest: true,
    now: NOW,
  });
  assert.equal(result.allowed, false);
  assert.ok(result.reasons.some((reason) => /re-quote/.test(reason)));
});

test("only an explicit provider 4xx is a definitive purchase failure; timeouts and 5xx are unknown", () => {
  assert.equal(classifyShippoPurchaseError(new Error("Shippo POST /transactions/ → 400: rate expired")), "DEFINITIVE_REJECTION");
  assert.equal(classifyShippoPurchaseError(new Error("Shippo POST /transactions/ → 503: unavailable")), "OUTCOME_UNKNOWN");
  assert.equal(classifyShippoPurchaseError(new TypeError("fetch failed")), "OUTCOME_UNKNOWN");
  assert.equal(classifyShippoPurchaseError(Object.assign(new Error("aborted"), { name: "AbortError" })), "OUTCOME_UNKNOWN");
});

test("label route keeps ambiguous purchases locked and reconciles read-only against the snapshot rate", () => {
  const route = read("app/api/deals/[id]/shipment-legs/[legId]/label/route.ts");
  const unknownBranch = route.slice(route.indexOf('classifyShippoPurchaseError(error) === "OUTCOME_UNKNOWN"'));
  // The OUTCOME_UNKNOWN branch returns before the failure RPC that would re-arm the leg.
  assert.ok(unknownBranch.indexOf("PURCHASE_OUTCOME_UNKNOWN") < unknownBranch.indexOf("record_shipment_leg_label"));
  assert.match(route, /transactionBelongsToAttempt\(found, binding\)/);
  assert.match(route, /PROVIDER_TRANSACTION_NOT_THIS_ATTEMPT/);
  assert.match(route, /PURCHASE_ATTEMPT_MAY_BE_ACTIVE/);
  // The no-purchase unlock requires a provider scan; an attestation alone cannot unlock.
  const unlock = route.slice(route.indexOf("confirmed_not_purchased !== true"));
  assert.ok(unlock.indexOf("evaluateProviderTransactionScan") < unlock.indexOf("record_shipment_leg_label"));
  assert.match(route, /LABEL_PERSIST_FAILED_RECONCILE_REQUIRED/);
  assert.match(route, /status !== "ERROR"/);
  // Reconcile never purchases.
  const reconcile = route.slice(route.indexOf('body.action === "reconcile"'), route.indexOf('body.action !== "purchase"'));
  assert.doesNotMatch(reconcile, /purchaseShippoLabel/);
});

// ── Customs integrity ──

test("customs keeps no Hague registry and makes no authentication claim", () => {
  const source = read("lib/shippo/customs.ts");
  assert.doesNotMatch(source, /HAGUE_COUNTRIES|new Set\(\[\s*"DE"/);
  assert.doesNotMatch(getCustomsAdvisory("IT"), /Apostille satisfies|may require embassy/);
  assert.equal(getCustomsAdvisory("IT"), getCustomsAdvisory("CN"));
});

test("customs is certified by the configured Milano declarant, never the client, and uses the real parcel weight", () => {
  const parcel = { weight: "1.5", mass_unit: "lb" };
  assert.throws(() => buildDocumentCustomsPayload({ document_type: "Power of attorney" }, parcel, {}), CustomsReviewRequiredError);
  const payload = buildDocumentCustomsPayload(
    { document_type: "Power of attorney", document_count: 2, client_name: "Jane Client" } as never,
    parcel,
    { SHIPPO_CUSTOMS_CERTIFY_SIGNER: "Milano Shipping Desk" },
  );
  assert.equal(payload.declaration.certify_signer, "Milano Shipping Desk");
  assert.notEqual(payload.declaration.certify_signer, "Jane Client");
  assert.equal(payload.item.net_weight, "1.5");
  assert.equal(payload.item.quantity, 2);
  assert.doesNotMatch(payload.item.description, /authenticated/i);
  assert.throws(() => buildDocumentCustomsPayload({}, { weight: "0", mass_unit: "lb" }, { SHIPPO_CUSTOMS_CERTIFY_SIGNER: "Milano Desk" }), /weight/);
  assert.equal(resolveAuthorizedCustomsDeclarant({ SHIPPO_CUSTOMS_CERTIFY_SIGNER: " " }), null);
});

test("both rate endpoints surface customs review instead of fabricating a declaration", () => {
  for (const file of ["app/api/dashboard/shippo/rates/route.ts", "app/api/deals/[id]/shipment-legs/[legId]/rates/route.ts"]) {
    const source = read(file);
    assert.match(source, /CustomsReviewRequiredError/, file);
    assert.match(source, /buildDocumentCustomsPayload\([^,)]+,\s*parcel\)/, file);
    assert.match(source, /rates_requiring_review/, file);
  }
});

// ── Exceptions ──

test("exception detection is evidence-based and read-only", () => {
  const settledPending = leg({ label_status: "purchase_pending", label_claim_id: "claim-1", label_claimed_at: new Date(NOW.getTime() - RECONCILE_MIN_PENDING_MS).toISOString() });
  assert.deepEqual(detectShipmentLegExceptions(settledPending, NOW).map((e) => e.code), ["PURCHASE_OUTCOME_UNKNOWN"]);
  const activePending = leg({ label_status: "purchase_pending", label_claim_id: "claim-1", label_claimed_at: new Date(NOW.getTime() - 30_000).toISOString() });
  assert.deepEqual(detectShipmentLegExceptions(activePending, NOW).map((e) => e.code), ["PURCHASE_IN_PROGRESS"]);
  assert.ok(detectShipmentLegExceptions(leg({ label_status: "created", tracking_number: null }), NOW).some((e) => e.code === "TRACKING_NOT_REGISTERED"));
  const stale = leg({
    label_status: "created",
    tracking_number: "1234567890",
    custody_status: "in_transit",
    provider_evidence: { last_tracking: { status: "TRANSIT", status_date: "2026-11-10T00:00:00Z" } },
  });
  assert.ok(detectShipmentLegExceptions(stale, NOW).some((e) => e.code === "TRACKING_STALE"));
  const returned = leg({ label_status: "created", tracking_number: "1234567890", custody_status: "exception", provider_evidence: { last_tracking: { status: "RETURNED" } } });
  assert.deepEqual(detectShipmentLegExceptions(returned, NOW).map((e) => e.code), ["RETURN_TO_SENDER"]);
  const failure = leg({ label_status: "created", tracking_number: "1234567890", custody_status: "exception", provider_evidence: { last_tracking: { status: "FAILURE" } } });
  assert.deepEqual(detectShipmentLegExceptions(failure, NOW).map((e) => e.code), ["DELIVERY_EXCEPTION"]);
  const delivered = leg({ label_status: "created", tracking_number: "1234567890", custody_status: "delivered", delivered_at: "2026-11-01T00:00:00Z" });
  assert.deepEqual(detectShipmentLegExceptions(delivered, NOW), []);
  const projected = operatorShipmentLegProjection(settledPending, NOW);
  assert.equal(projected.exceptions[0].code, "PURCHASE_OUTCOME_UNKNOWN");
  assert.equal(projected.reconcile_available, true);
  assert.equal(operatorShipmentLegProjection(activePending, NOW).reconcile_available, false);
  assert.equal(projected.completion.matterCompleted, false);
});

// ── Client delivery journey ──

const stateOf = (journey: ReturnType<typeof buildClientDeliveryJourney>) =>
  Object.fromEntries(journey.milestones.map((m) => [m.key, m.state]));

test("no legs: not started, nothing invented", () => {
  const journey = buildClientDeliveryJourney([]);
  assert.equal(journey.status, "not_started");
  assert.equal(journey.carrier, null);
  assert.equal(journey.tracking_url, null);
  assert.equal(stateOf(journey).preparing, "upcoming");
});

test("label created is 'ready for dispatch', never 'shipped'", () => {
  const journey = buildClientDeliveryJourney([leg({ label_status: "created", tracking_number: "1234567890", label_created_at: "2026-11-24T00:00:00Z" })]);
  const s = stateOf(journey);
  assert.equal(s.ready_for_dispatch, "current");
  assert.equal(s.shipped, "upcoming");
  assert.equal(journey.carrier, "DHL Express");
  assert.match(journey.tracking_url ?? "", /^https:\/\/www\.dhl\.com\/.*tracking-id=1234567890$/);
});

test("in transit, with out-for-delivery only when the carrier reports it", () => {
  const base = { label_status: "created" as const, tracking_number: "1234567890", shipped_at: "2026-11-24T00:00:00Z", custody_status: "in_transit" as const };
  const transit = buildClientDeliveryJourney([leg({ ...base, provider_evidence: { last_tracking: { status: "TRANSIT", status_date: "2026-11-25T08:00:00Z" } } })]);
  assert.equal(stateOf(transit).in_transit, "current");
  assert.equal(stateOf(transit).out_for_delivery, "upcoming");
  assert.equal(transit.last_verified_update, "2026-11-25T08:00:00Z");
  const ofd = buildClientDeliveryJourney([leg({ ...base, provider_evidence: { last_tracking: { status: "TRANSIT", substatus: "out_for_delivery" } } })]);
  assert.equal(stateOf(ofd).out_for_delivery, "current");
});

test("no false Delivered: a DELIVERED tracking status alone does not mark delivery", () => {
  const notYet = buildClientDeliveryJourney([
    leg({ label_status: "created", tracking_number: "1234567890", shipped_at: "2026-11-24T00:00:00Z", custody_status: "in_transit", tracking_status: "DELIVERED" }),
  ]);
  assert.notEqual(notYet.status, "delivered");
  assert.equal(stateOf(notYet).delivered, "upcoming");
  const done = buildClientDeliveryJourney([
    leg({ label_status: "created", tracking_number: "1234567890", shipped_at: "2026-11-24T00:00:00Z", custody_status: "delivered", delivered_at: "2026-11-25T10:00:00Z" }),
  ]);
  assert.equal(done.status, "delivered");
  assert.equal(stateOf(done).delivered, "complete");
  // Delivery never claims release or completion.
  assert.match(done.release_note, /separately confirms release/);
  assert.doesNotMatch(JSON.stringify(done), /completed|released"/i);
});

test("carrier exception stays unresolved and visible to the client", () => {
  const journey = buildClientDeliveryJourney([
    leg({ label_status: "created", tracking_number: "1234567890", shipped_at: "2026-11-24T00:00:00Z", custody_status: "exception", provider_evidence: { last_tracking: { status: "FAILURE" } } }),
  ]);
  assert.equal(journey.status, "attention");
  assert.match(journey.exception_message ?? "", /exception/);
});

test("client projection never leaks provider ids, costs, label URLs, street addresses or authority tracking", () => {
  const journey = buildClientDeliveryJourney([
    leg({ id: "a", leg_type: "outbound_to_authority", sequence: 1, label_status: "created", tracking_number: "AUTH999999", custody_status: "authority_received" }),
    leg({
      label_status: "created",
      tracking_number: "1234567890",
      provider_evidence: { label: { label_url: "https://shippo-delivery.example/label.pdf", eta: "2026-11-28T00:00:00Z" } },
    }),
  ]);
  const json = JSON.stringify(journey);
  for (const secret of ["txn_secret", "shp_secret", "rate_internal", "61.20", "label.pdf", "Via Roma", "AUTH999999"]) {
    assert.ok(!json.includes(secret), `journey leaked ${secret}`);
  }
  assert.equal(journey.destination_summary, "Milano, IT");
  assert.equal(journey.provider_eta, "2026-11-28T00:00:00Z");
  assert.deepEqual(journey.authority_stages, [{ stage: "Sent to the authentication authority", status: "Received by authority" }]);
});

test("tracking links are official carrier pages only and reject injection", () => {
  assert.equal(safeCarrierTrackingUrl("USPS", "9400111202555842332669"), "https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111202555842332669");
  assert.equal(safeCarrierTrackingUrl("UPS", "1Z999AA10123456784"), "https://www.ups.com/track?tracknum=1Z999AA10123456784");
  assert.match(safeCarrierTrackingUrl("FedEx", "123456789012") ?? "", /^https:\/\/www\.fedex\.com\//);
  assert.equal(safeCarrierTrackingUrl("SpeedX", "123456789012"), null);
  assert.equal(safeCarrierTrackingUrl("UPS", "1Z9&x=<script>"), null);
});

test("portal courier endpoint keeps ownership check and returns the journey", () => {
  const route = read("app/api/portal/me/courier/route.ts");
  assert.match(route, /\.eq\("email", user\.email\)/);
  assert.match(route, /buildClientDeliveryJourney\(legRows\)/);
  assert.ok(route.indexOf('.eq("email", user.email)') < route.indexOf("getMatterShipmentLegs(createAdminClient()"));
  const component = read("components/portal/PortalDeliveryJourney.tsx");
  assert.doesNotMatch(component, /label_url|amount|provider_transaction/);
  assert.match(read("app/portal/tracking/page.tsx"), /<PortalDeliveryJourney matterId=\{deal\.id\} \/>/);
});

// ── Pricing preserved ──

test("existing USD courier credits are unchanged and non-USD still fails closed", () => {
  assert.equal(calculateCourierCharge({ providerRateAmount: "72.00", currency: "USD", tier: "priority" }).clientCourierCharge, "22.00");
  assert.equal(calculateCourierCharge({ providerRateAmount: "72.00", currency: "USD", tier: "executive" }).clientCourierCharge, "0.00");
  assert.equal(calculateCourierCharge({ providerRateAmount: "72.00", currency: "USD", tier: "signature" }).clientCourierCharge, "72.00");
  assert.throws(() => calculateCourierCharge({ providerRateAmount: "72.00", currency: "EUR", tier: "priority" }), /COURIER_CURRENCY_REVIEW_REQUIRED/);
});

// ── Codex P1: reconciliation is bound to the current, settled attempt ──

const CLAIMED = NOW.getTime() - 20 * 60 * 1000;
const binding = { matterId: "m1", legId: "leg-1", rateId: "rate_internal", claimedAt: CLAIMED };
const txn = (overrides: Record<string, unknown> = {}) => ({
  object_id: "txn_current",
  rate: "rate_internal",
  metadata: purchaseCorrelationRef("m1", "leg-1"),
  object_created: new Date(CLAIMED + 5_000).toISOString(),
  status: "SUCCESS",
  ...overrides,
});

test("an in-flight attempt cannot be reconciled; the window opens only after the bounded attempt", () => {
  const pending = (at: string, extra: Partial<ShipmentLegRow> = {}) =>
    leg({ label_status: "purchase_pending", label_claim_id: "claim-1", label_claimed_at: at, ...extra });
  assert.equal(reconciliationWindowOpen(pending(new Date(NOW.getTime() - 60_000).toISOString()), NOW), false);
  assert.equal(reconciliationWindowOpen(pending(new Date(CLAIMED).toISOString()), NOW), true);
  assert.equal(reconciliationWindowOpen(pending(new Date(CLAIMED).toISOString(), { label_status: "rate_selected" }), NOW), false);
  assert.equal(reconciliationWindowOpen(pending("not-a-date"), NOW), false);
  // No stamped claim identity → fail closed (never reconcilable).
  assert.equal(reconciliationWindowOpen(pending(new Date(CLAIMED).toISOString(), { label_claim_id: null }), NOW), false);
  // A later write (e.g. a stale tracking webhook) moving updated_at does not move the claim.
  assert.equal(reconciliationWindowOpen(pending(new Date(CLAIMED).toISOString(), { updated_at: NOW.toISOString() }), NOW), true);
  assert.ok(RECONCILE_MIN_PENDING_MS > 60_000 * 5, "window must far exceed the 60s purchase timeout");
  assert.match(read("lib/shippo/client.ts"), /timeoutMs: SHIPPO_PURCHASE_TIMEOUT_MS/);
});

test("an earlier attempt's transaction on the same rate cannot settle the current attempt", () => {
  assert.equal(transactionBelongsToAttempt(txn(), binding), true);
  const earlierError = txn({ object_id: "txn_old", status: "ERROR", object_created: new Date(CLAIMED - 60_000).toISOString() });
  assert.equal(transactionBelongsToAttempt(earlierError, binding), false);
  assert.equal(transactionBelongsToAttempt(txn({ metadata: purchaseCorrelationRef("m1", "other-leg") }), binding), false);
  assert.equal(transactionBelongsToAttempt(txn({ metadata: undefined }), binding), false);
  assert.equal(transactionBelongsToAttempt(txn({ rate: "rate_other" }), binding), false);
  assert.equal(transactionBelongsToAttempt(txn({ object_created: undefined }), binding), false);
});

test("'none purchased' requires a complete provider scan with no transaction for the leg since the claim", () => {
  const older = txn({ object_id: "txn_unrelated", rate: "r_x", metadata: "matter:z;leg:z", object_created: new Date(CLAIMED - 1_000).toISOString() });
  const unrelatedNew = txn({ object_id: "txn_other", rate: "r_y", metadata: "matter:z;leg:y", object_created: new Date(CLAIMED + 9_000).toISOString() });
  assert.deepEqual(evaluateProviderTransactionScan([{ results: [unrelatedNew, older], next: "p2" }], binding), { outcome: "NONE_SINCE_CLAIM" });
  assert.deepEqual(evaluateProviderTransactionScan([{ results: [unrelatedNew], next: null }], binding), { outcome: "NONE_SINCE_CLAIM" });
  const hit = evaluateProviderTransactionScan([{ results: [unrelatedNew, txn(), older], next: null }], binding);
  assert.equal(hit.outcome, "FOUND");
  // A transaction on the leg's rate still blocks the unlock even without metadata (pre-correlation purchase).
  assert.equal(evaluateProviderTransactionScan([{ results: [txn({ metadata: undefined }), older] }], binding).outcome, "FOUND");
  // Did not reach the claim time → fail closed.
  assert.equal(evaluateProviderTransactionScan([{ results: [unrelatedNew], next: "p2" }], binding).outcome, "INCOMPLETE");
  // Oldest-first ordering → fail closed rather than a false "none".
  assert.equal(evaluateProviderTransactionScan([{ results: [older, unrelatedNew], next: null }], binding).outcome, "INCOMPLETE");
  assert.equal(evaluateProviderTransactionScan([{ results: [txn({ object_created: undefined })] }], binding).outcome, "INCOMPLETE");
});

test("reconciliation writes are compared to the scanned attempt under the database row lock", () => {
  const route = read("app/api/deals/[id]/shipment-legs/[legId]/label/route.ts");
  const reconcile = route.slice(route.indexOf('body.action === "reconcile"'), route.indexOf('body.action !== "purchase"'));
  assert.doesNotMatch(reconcile, /rpc\("record_shipment_leg_label"/);
  assert.match(reconcile, /rpc\("reconcile_shipment_leg_label"/);
  assert.match(reconcile, /recordPurchaseOutcome\(context, leg\.id, auth\.user\.id, found, null, expectedClaimId\)/);
  assert.match(route, /p_expected_claim_id: expectedClaimId/);
  assert.doesNotMatch(reconcile, /updated_at/);
  const sql = read("supabase/migrations/20261125090000_shipment_leg_reconcile_attempt_binding.sql");
  const lock = sql.indexOf("for update");
  const compare = sql.indexOf("v_leg.label_claim_id is distinct from p_expected_claim_id");
  const write = sql.indexOf("public.record_shipment_leg_label(");
  assert.ok(lock > 0 && lock < compare && compare < write, "compare must happen under the lock, before the write");
  assert.match(sql, /RECONCILE_ATTEMPT_CHANGED/);
  assert.match(sql, /revoke all on function public\.reconcile_shipment_leg_label[^;]*from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.reconcile_shipment_leg_label[^;]*to service_role/);
});

test("the claim identity is stamped only on entering purchase_pending and the build requires it", () => {
  const sql = read("supabase/migrations/20261125090000_shipment_leg_reconcile_attempt_binding.sql");
  assert.match(sql, /new\.label_status = 'purchase_pending' and old\.label_status is distinct from 'purchase_pending'/);
  assert.match(sql, /new\.label_claim_id := old\.label_claim_id/);
  const schema = read("scripts/verify-production-schema-capabilities.mjs");
  assert.match(schema, /matter_shipment_legs: \['id','label_status','label_claim_id','label_claimed_at'\]/);
  assert.match(schema, /'reconcile_shipment_leg_label'/);
});

test("a carrier OUT_FOR_DELIVERY status (not only the substatus) is shown as out for delivery", () => {
  const journey = buildClientDeliveryJourney([
    leg({ label_status: "created", tracking_number: "1234567890", shipped_at: "2026-11-24T00:00:00Z", custody_status: "in_transit", provider_evidence: { last_tracking: { status: "OUT_FOR_DELIVERY" } } }),
  ]);
  assert.equal(stateOf(journey).out_for_delivery, "current");
  assert.equal(stateOf(journey).in_transit, "complete");
  assert.equal(stateOf(journey).delivered, "upcoming");
});
