import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const pricing = read("lib/pricing.ts");
const canonicalPricing = read("src/features/pricing/pricingEngine.ts");
const routePricing = read("src/features/pricing/globalRoutePricing.ts");
const courierService = read("src/features/pricing/courierPricingService.ts");
const credit = read("lib/shippo/courierCredit.ts");
const rates = read("app/api/dashboard/shippo/rates/route.ts");
const rateSelection = read("app/api/dashboard/shippo/rates/select/route.ts");
const labels = read("app/api/dashboard/shippo/labels/route.ts");
const gates = read("lib/shippo/gates.ts");
const invoiceRoute = read("app/api/portal/me/invoice/route.ts");
const invoice = read("lib/portalInvoice.ts");
const migration = read("supabase/migrations/078_global_route_shippo_pricing.sql");
const payment = read("components/payments/SecurePaymentCard.tsx");

for (const amount of ["signature: 750", "priority: 975", "executive: 1850"]) {
  assert.match(canonicalPricing, new RegExp(amount));
}
assert.match(credit, /signature: 0/);
assert.match(credit, /priority: 5_000/);
assert.match(credit, /executive: 10_000/);
assert.match(credit, /Math\.min/);
assert.match(credit, /rateCents - creditCents/);

assert.match(routePricing, /hague_apostille/);
assert.match(routePricing, /non_hague_consular_legalization/);
assert.match(routePricing, /pending_authority_confirmation/);
assert.match(routePricing, /amount: null/);
assert.match(routePricing, /MILANO_PRICING\.addOns\.apostilleCoordination/);

assert.match(rates, /createShippoShipment/);
assert.match(rates, /calculateCourierCharge/);
assert.match(rates, /pricing_mutable/);
assert.doesNotMatch(rates, /assertPaymentConfirmed/);
assert.doesNotMatch(rates, /matter\.tier/);

assert.match(rateSelection, /getShippoShipment/);
assert.match(rateSelection, /applySelectedShippoRate/);
assert.match(courierService, /apply_shippo_rate_to_matter/);
assert.match(courierService, /buildPaymentLink/);

assert.match(labels, /courier_shippo_shipment_id/);
assert.match(labels, /courier_shippo_rate_id/);
assert.match(labels, /PERSISTED_QUOTE/);
assert.match(labels, /DOC_APOSTILLE_RECEIVED/);
assert.doesNotMatch(labels, /matter\.tier/);
assert.doesNotMatch(labels, /matter_status/);
assert.doesNotMatch(labels, /paid_and_released/);
assert.match(gates, /apostille_complete/);
assert.doesNotMatch(gates, /matter_status/);

assert.match(migration, /courier_provider_rate/);
assert.match(migration, /courier_tier_credit/);
assert.match(migration, /courier_client_charge/);
assert.match(migration, /COURIER_PRICING_LOCKED_AFTER_WISE_SUBMISSION/);
assert.match(migration, /ux_shippo_shipments_shippo_shipment_id/);
assert.match(migration, /apply_shippo_rate_to_matter/);
assert.match(migration, /service_role/);

assert.match(invoiceRoute, /runGlobalAcceptanceReview/);
assert.match(invoiceRoute, /authentication_route/);
assert.match(invoice, /projectAuthenticationPricing/);
assert.match(invoice, /courier_provider_rate/);
assert.match(invoice, /courier_tier_credit/);
assert.match(invoice, /courier_client_charge/);

assert.match(payment, /amount_due/);
assert.match(payment, /payment_observed_at/);

const active = [canonicalPricing, routePricing, courierService, credit, rates, rateSelection, labels, gates, invoiceRoute, invoice, migration, payment].join("\n");
assert.doesNotMatch(active, /stripe/i);
assert.doesNotMatch(active, /paypal/i);

// Legacy pricing remains a compatibility projection; it cannot become the new
// route/courier authority. Keep this read so drift is visible without expanding it.
assert.match(pricing, /export const TIERS/);

console.log("PASS global route pricing, Wise itemization and Shippo courier continuity");
