import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  completeShipmentLegEvidence,
  evaluateLabelPurchaseReadiness,
  evaluateReturnLabelReadiness,
  evaluateShipmentLegReadiness,
  mapTrackingToLegCustody,
  operatorShipmentLegProjection,
  publicShipmentLegProjection,
  selectGovernedRate,
  trackingEventHash,
  updateShipmentLegFromProvider,
  type LegReadinessInput,
  type ShipmentLegRow,
} from "@/lib/intelligence/execution-brain/authorityLogistics";
import { verifyShippoHmac } from "@/lib/shippo/webhookAuth";
import type { ShippoRate } from "@/lib/shippo/types";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
const migration = read("supabase/migrations/086_matter_shipment_legs.sql");

const milano = { name: "The Milano Seal", street1: "1 Seal Way", city: "Miami", state: "FL", zip: "33101", country: "US" };
const authorityAddress = { name: "Florida Department of State", street1: "PO Box 6800", city: "Tallahassee", state: "FL", zip: "32314", country: "US" };
const italy = { name: "Client Name", street1: "Via Roma 1", city: "Milano", country: "IT" };

const readyPacket = { packetStatus: "READY_FOR_DISPATCH" as const, returnShippingRequired: true };
const matter = (state: string, overrides: Partial<LegReadinessInput["matter"]> = {}): LegReadinessInput["matter"] => ({
  id: "m1",
  state,
  apostilleRequired: true,
  releaseFrozen: false,
  isPaidAndReleased: false,
  ...overrides,
});
const input = (overrides: Partial<LegReadinessInput> = {}): LegReadinessInput => ({
  legType: "outbound_to_authority",
  matter: matter("apostille_packet_ready"),
  packet: readyPacket,
  existingLegs: [],
  origin: milano,
  destination: authorityAddress,
  operatorRequest: {},
  ...overrides,
});

const leg = (overrides: Partial<ShipmentLegRow> = {}): ShipmentLegRow => ({
  id: "leg-1",
  matter_id: "m1",
  provider: "shippo",
  provider_shipment_id: "shp_secret_123",
  provider_transaction_id: "txn_secret_456",
  leg_type: "outbound_to_authority",
  sequence: 1,
  direction: "outbound",
  origin_json: milano,
  destination_json: authorityAddress,
  rate_snapshot: {
    provider_rate_id: "rate_internal_789",
    carrier: "UPS",
    service: "Ground",
    service_token: "ups_ground",
    amount: "12.40",
    currency: "USD",
    estimated_days: 2,
    rank: 1,
    recommended: true,
    selection_policy: "LOWEST_APPROVED_COST",
    selection_reason: "Signature lane: lowest-cost approved service.",
    selected_at: "2026-09-25T00:00:00Z",
    selected_by: "op-1",
  },
  carrier: "UPS",
  service_level: "Ground",
  label_status: "created",
  tracking_number: "1Z999",
  tracking_status: "TRANSIT",
  custody_status: "in_transit",
  provider_evidence: { label: { label_url: "https://shippo-delivery.s3.amazonaws.com/secret-label.pdf", tracking_url_provider: "https://ups.example/track/1Z999" } },
  exception_reason: "internal operator note",
  label_created_at: "2026-09-25T01:00:00Z",
  shipped_at: "2026-09-25T02:00:00Z",
  delivered_at: null,
  completed_at: null,
  created_at: "2026-09-25T00:00:00Z",
  ...overrides,
});

const rate = (id: string, provider: string, amount: string, days: number): ShippoRate => ({
  object_id: id,
  provider,
  servicelevel: { name: `${provider} service`, token: `${provider.toLowerCase()}_svc` },
  estimated_days: days,
  amount,
  currency: "USD",
  amount_local: amount,
  currency_local: "USD",
});

test("1. outbound authority leg: Matter-linked, sequence 1, created only when the packet is dispatch-ready", () => {
  assert.equal(evaluateShipmentLegReadiness(input()).allowed, true);
  assert.match(migration, /select coalesce\(max\(sequence\), 0\) \+ 1 into v_sequence/);
  assert.match(migration, /matter_id uuid not null references public\.deals\(id\)/);
  assert.match(migration, /perform 1 from public\.deals where id = p_matter_id for update/);
});

test("2. return leg only when the packet requires a prepaid return (and explicit request)", () => {
  const noReturn = evaluateShipmentLegReadiness(
    input({ legType: "return_from_authority", origin: authorityAddress, destination: milano, packet: { ...readyPacket, returnShippingRequired: false }, operatorRequest: { explicitReturnRequest: true } }),
  );
  assert.equal(noReturn.allowed, false);
  assert.equal(noReturn.code, "RETURN_NOT_REQUIRED");
  const ok = evaluateShipmentLegReadiness(
    input({ legType: "return_from_authority", origin: authorityAddress, destination: milano, operatorRequest: { explicitReturnRequest: true } }),
  );
  assert.equal(ok.allowed, true);
  const implicit = evaluateShipmentLegReadiness(input({ legType: "return_from_authority", origin: authorityAddress, destination: milano }));
  assert.equal(implicit.code, "OPERATOR_REQUEST_REQUIRED");
});

test("3. return label without explicit operator request → RETURN_LABEL_REVIEW_REQUIRED", () => {
  const result = evaluateReturnLabelReadiness({
    leg: leg({ leg_type: "return_from_authority", label_status: "rate_selected" }),
    matterId: "m1",
    packet: readyPacket,
    explicitRequest: false,
  });
  assert.equal(result.allowed, false);
  assert.equal(result.code, "RETURN_LABEL_REVIEW_REQUIRED");
  const label = read("app/api/deals/[id]/shipment-legs/[legId]/label/route.ts");
  assert.match(label, /explicitRequest: body\.explicit_return_label_request === true/);
});

test("4. no rate snapshot → no label (return and outbound)", () => {
  const returnResult = evaluateReturnLabelReadiness({
    leg: leg({ leg_type: "return_from_authority", label_status: "not_created", rate_snapshot: null }),
    matterId: "m1",
    packet: readyPacket,
    explicitRequest: true,
  });
  assert.equal(returnResult.allowed, false);
  const outbound = evaluateLabelPurchaseReadiness({
    leg: leg({ label_status: "not_created", rate_snapshot: null }),
    matterId: "m1",
    operatorAuthorized: true,
    currentGate: { allowed: true, code: null, reasons: [] },
  });
  assert.equal(outbound.allowed, false);
  assert.match(migration, /matter_shipment_legs_rate_snapshot_check/);
  assert.match(migration, /label_status = 'rate_selected' and rate_snapshot is not null/);
});

test("5. absolute-cheapest bypass prohibited; existing governed ranking is used", () => {
  const rates = [rate("r_cheap_unapproved", "Colissimo", "1.00", 9), rate("r_ups", "UPS", "12.00", 2), rate("r_fedex", "FedEx", "15.00", 1)];
  const governed = selectGovernedRate({ rates, lane: "signature", destinationCountry: "US", selectedBy: "op-1" });
  assert.notEqual(governed.snapshot?.provider_rate_id, "r_cheap_unapproved");
  assert.ok(governed.ranked.every((entry) => entry.rate.provider !== "Colissimo"));
  const forced = selectGovernedRate({ rates, lane: "signature", destinationCountry: "US", selectedRateId: "r_cheap_unapproved", selectedBy: "op-1" });
  assert.equal(forced.error, "SELECTED_RATE_NOT_APPROVED");
  assert.equal(forced.snapshot, null);
  const alternative = selectGovernedRate({ rates, lane: "signature", destinationCountry: "US", selectedRateId: "r_fedex", selectedBy: "op-1" });
  assert.match(alternative.snapshot!.selection_reason, /approved alternative \(rank 2\)/);
  const lib = read("lib/intelligence/execution-brain/authorityLogistics.ts");
  assert.match(lib, /rankApprovedRates\(\{\s*rates: filterApprovedRates\(input\.rates\)/);
});

test("6. label creation stores transaction + tracking and does not set shipped", () => {
  const block = migration.slice(migration.indexOf("function public.record_shipment_leg_label"), migration.indexOf("function public.record_shipment_leg_dispatch"));
  assert.match(block, /provider_transaction_id = p_transaction_id/);
  assert.match(block, /tracking_number = nullif\(p_tracking_number, ''\)/);
  assert.match(block, /label_status = 'created'/);
  assert.doesNotMatch(block, /shipped_at\s*=/);
  assert.doesNotMatch(block, /custody_status\s*=/);
});

test("7. dispatch confirmation updates canonical custody evidence (and feeds Step 5 DISPATCHED)", () => {
  const block = migration.slice(migration.indexOf("function public.record_shipment_leg_dispatch"), migration.indexOf("function public.record_shipment_leg_void"));
  assert.match(block, /perform public\.append_shipment_leg_custody/);
  assert.match(block, /when 'outbound_to_authority' then 'DOC_APOSTILLE_SUBMITTED'/);
  assert.match(block, /shipped_at = v_now/);
  assert.match(block, /LABEL_REQUIRED_BEFORE_DISPATCH/);
  assert.match(migration, /insert into public\.custody_ledger/);
  const packet = read("lib/intelligence/execution-brain/authorityPacket.ts");
  assert.match(packet, /AUTHORITY_DISPATCH_CUSTODY_EVENT = "DOC_APOSTILLE_SUBMITTED"/);
});

test("8. webhook HMAC failure is rejected before any leg update", () => {
  const body = JSON.stringify({ event: "track_updated", data: { tracking_number: "1Z999" } });
  assert.equal(verifyShippoHmac(body, "deadbeef", "secret-key").ok, false);
  assert.equal(verifyShippoHmac(body, null, "secret-key").ok, false);
  const good = createHmac("sha256", "secret-key").update(body).digest("hex");
  assert.equal(verifyShippoHmac(body, good, "secret-key").ok, true);
  const webhook = read("app/api/courier/webhook/route.ts");
  assert.ok(webhook.indexOf("verifyShippoHmac(") < webhook.indexOf("updateShipmentLegFromProvider("));
  assert.match(webhook, /if \(!auth\.ok\)/);
});

test("9. duplicate webhook is idempotent (stable event hash + unique event_hash)", () => {
  const a = trackingEventHash({ legId: "leg-1", trackingNumber: "1Z999", status: "transit", statusDate: "2026-09-25T03:00:00Z", substatus: null });
  const b = trackingEventHash({ legId: "leg-1", trackingNumber: "1Z999", status: "TRANSIT", statusDate: "2026-09-25T03:00:00Z", substatus: null });
  assert.equal(a, b);
  assert.match(migration, /on conflict \(event_hash\) do nothing/);
  assert.match(migration, /return query select 'duplicate'::text/);
});

test("10. authority delivery → authority_received; Matter is not completed", () => {
  assert.equal(mapTrackingToLegCustody("outbound_to_authority", "in_transit", "DELIVERED"), "authority_received");
  const block = migration.slice(migration.indexOf("function public.record_shipment_leg_tracking"));
  assert.doesNotMatch(block, /update public\.deals/);
  assert.doesNotMatch(block, /completed_at\s*=\s*[^,]*deals|status\s*=\s*'completed'/);
  assert.equal(completeShipmentLegEvidence({ leg_type: "outbound_to_authority", custody_status: "authority_received", delivered_at: "x", completed_at: "y" }).matterCompleted, false);
});

test("11. return delivery → received_back", () => {
  assert.equal(mapTrackingToLegCustody("return_from_authority", "carrier_accepted", "TRANSIT"), "return_in_transit");
  assert.equal(mapTrackingToLegCustody("return_from_authority", "return_in_transit", "DELIVERED"), "received_back");
});

test("12. final international delivery → leg delivered; Matter completion stays governed separately", () => {
  assert.equal(mapTrackingToLegCustody("final_international", "in_transit", "DELIVERED"), "delivered");
  const evidence = completeShipmentLegEvidence({ leg_type: "final_international", custody_status: "delivered", delivered_at: "t", completed_at: "t" });
  assert.equal(evidence.legComplete, true);
  assert.equal(evidence.matterCompleted, false);
  // Monotonic: late transit or exception never reopens a delivered leg.
  assert.equal(mapTrackingToLegCustody("final_international", "delivered", "TRANSIT"), "delivered");
  assert.equal(mapTrackingToLegCustody("final_international", "delivered", "FAILURE"), "delivered");
  assert.equal(mapTrackingToLegCustody("final_international", "in_transit", "FAILURE"), "exception");
});

test("13 + 14. portal projection hides raw label URL, provider transaction/shipment ids, rate ids, costs, evidence and notes", () => {
  const projection = publicShipmentLegProjection(leg({ leg_type: "final_international", direction: "final" }), { trackingApproved: true });
  const serialized = JSON.stringify(projection);
  for (const secret of ["secret-label.pdf", "txn_secret_456", "shp_secret_123", "rate_internal_789", "12.40", "internal operator note", "label_url", "provider_evidence"]) {
    assert.ok(!serialized.includes(secret), secret);
  }
  assert.equal(projection.tracking_number, "1Z999");
  assert.equal(publicShipmentLegProjection(leg(), { trackingApproved: false }).tracking_number, null);
  // Operator JSON never carries the raw label URL either.
  assert.ok(!JSON.stringify(operatorShipmentLegProjection(leg())).includes("secret-label.pdf"));
  const portal = read("app/api/portal/me/courier/route.ts");
  assert.match(portal, /publicShipmentLegProjection\(leg/);
  assert.doesNotMatch(portal, /operatorShipmentLegProjection|provider_transaction_id|label_url:/);
});

test("15. duplicate Matter sequence rejected (unique constraint)", () => {
  assert.match(migration, /constraint matter_shipment_legs_matter_sequence_key unique \(matter_id, sequence\)/);
  const active = evaluateShipmentLegReadiness(input({ existingLegs: [{ leg_type: "outbound_to_authority", custody_status: "prepared" }] }));
  assert.equal(active.code, "LEG_ALREADY_ACTIVE");
});

test("16. wrong-Matter leg mutation rejected", async () => {
  assert.equal(evaluateReturnLabelReadiness({ leg: leg({ leg_type: "return_from_authority", label_status: "rate_selected", matter_id: "other" }), matterId: "m1", packet: readyPacket, explicitRequest: true }).allowed, false);
  assert.equal(evaluateLabelPurchaseReadiness({ leg: leg({ label_status: "rate_selected", matter_id: "other" }), matterId: "m1", operatorAuthorized: true, currentGate: { allowed: true, code: null, reasons: [] } }).allowed, false);
  for (const fn of ["record_shipment_leg_rate", "record_shipment_leg_label", "record_shipment_leg_dispatch", "record_shipment_leg_void", "record_shipment_leg_tracking"]) {
    const block = migration.slice(migration.indexOf(`function public.${fn}`));
    assert.match(block.slice(0, 1500), /v_leg\.matter_id <> p_matter_id/, fn);
  }
  // Webhook metadata for another Matter never mutates the leg.
  const calls: string[] = [];
  const fakeDb = {
    from: () => ({ select: () => ({ eq: () => ({ limit: async () => ({ data: [{ id: "leg-1", matter_id: "m1", tracking_number: "1Z999" }], error: null }) }) }) }),
    rpc: async (name: string) => {
      calls.push(name);
      return { data: [{ outcome: "applied", custody_status: "in_transit" }], error: null };
    },
  };
  const result = await updateShipmentLegFromProvider(fakeDb as never, { trackingNumber: "1Z999", metadataMatterId: "m2", status: "TRANSIT" });
  assert.equal(result?.outcome, "rejected_matter_mismatch");
  assert.deepEqual(calls, []);
});

test("17. final shipment before the release gate → blocked", () => {
  const result = evaluateShipmentLegReadiness(
    input({ legType: "final_international", destination: italy, matter: matter("final_payment_confirmed", { apostilleRequired: false }), operatorRequest: { releaseActionConfirmed: true } }),
  );
  assert.equal(result.code, "RELEASE_GATE_NOT_SATISFIED");
  const frozen = evaluateShipmentLegReadiness(
    input({ legType: "final_international", destination: italy, matter: matter("ready_for_release", { releaseFrozen: true }), operatorRequest: { releaseActionConfirmed: true } }),
  );
  assert.equal(frozen.allowed, false);
  const ok = evaluateShipmentLegReadiness(
    input({ legType: "final_international", destination: italy, matter: matter("ready_for_release"), operatorRequest: { releaseActionConfirmed: true } }),
  );
  assert.equal(ok.allowed, true);
  const dispatch = read("app/api/deals/[id]/shipment-legs/[legId]/dispatch/route.ts");
  assert.match(dispatch, /Final legs re-check the release \/ payment gates/);
});

test("18. final shipment before the required Wise final payment → blocked", () => {
  const result = evaluateShipmentLegReadiness(
    input({ legType: "final_to_client", destination: milano, matter: matter("final_balance_due", { apostilleRequired: false }), operatorRequest: { releaseActionConfirmed: true } }),
  );
  assert.equal(result.allowed, false);
  assert.ok(result.reasons.some((reason) => /Wise final payment/.test(reason)));
  const rejected = evaluateShipmentLegReadiness(
    input({ legType: "final_to_client", destination: milano, matter: matter("apostille_rejected"), operatorRequest: { releaseActionConfirmed: true } }),
  );
  assert.equal(rejected.code, "APOSTILLE_NOT_COMPLETE");
});

test("19. exception return requires a documented operator reason", () => {
  const missing = evaluateShipmentLegReadiness(input({ legType: "exception_return", destination: italy, operatorRequest: { exceptionReason: "oops" } }));
  assert.equal(missing.code, "EXCEPTION_REASON_REQUIRED");
  const ok = evaluateShipmentLegReadiness(input({ legType: "exception_return", destination: italy, operatorRequest: { exceptionReason: "Authority returned the packet for a missing cover letter." } }));
  assert.equal(ok.allowed, true);
  assert.match(migration, /leg_type <> 'exception_return' or length\(trim\(coalesce\(exception_reason, ''\)\)\) >= 10/);
});

test("20. authority packet not dispatch-ready → outbound leg blocked", () => {
  for (const status of ["NOT_READY", "REVIEW_REQUIRED", "READY_TO_ASSEMBLE", "ASSEMBLED", "DISPATCHED"] as const) {
    const result = evaluateShipmentLegReadiness(input({ packet: { packetStatus: status, returnShippingRequired: true } }));
    assert.equal(result.code, "PACKET_NOT_DISPATCH_READY", status);
  }
  assert.equal(evaluateShipmentLegReadiness(input({ packet: null })).code, "PACKET_NOT_DISPATCH_READY");
});

test("addresses are never invented; operator routes are gated; no second shipping engine", () => {
  assert.equal(evaluateShipmentLegReadiness(input({ destination: { name: "FL DOS" } })).code, "ADDRESS_INVALID");
  const create = read("app/api/deals/[id]/shipment-legs/route.ts");
  assert.match(create, /destination = parseAddress\(body\.destination\)/);
  for (const file of [
    "app/api/deals/[id]/shipment-legs/route.ts",
    "app/api/deals/[id]/shipment-legs/[legId]/rates/route.ts",
    "app/api/deals/[id]/shipment-legs/[legId]/label/route.ts",
    "app/api/deals/[id]/shipment-legs/[legId]/dispatch/route.ts",
  ]) {
    const source = read(file);
    assert.match(source, /authorizeLogisticsOperator\(\)/, file);
    assert.doesNotMatch(source, /new Shippo|shippo-node|from "shippo"|express/i, file);
  }
  const label = read("app/api/deals/[id]/shipment-legs/[legId]/label/route.ts");
  assert.match(label, /purchaseShippoLabel\(leg\.rate_snapshot!\.provider_rate_id\)/);
  assert.doesNotMatch(label, /purchaseShippoLabel\([^)]*\)[\s\S]*purchaseShippoLabel\(/);
  assert.doesNotMatch(label, /NextResponse\.json\([^)]*label_url/);
  assert.match(migration, /revoke all on function public\.record_shipment_leg_tracking[^;]*from public, anon, authenticated/);
  assert.match(migration, /alter table public\.matter_shipment_legs enable row level security/);
});
