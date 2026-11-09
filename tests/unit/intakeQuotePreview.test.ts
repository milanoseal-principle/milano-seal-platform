import { test } from "node:test";
import assert from "node:assert/strict";
import { buildIntakeQuotePreview, intakeQuotePreviewSchema } from "@/lib/pricing/intakeQuotePreview";
import { classifyIntake } from "@/lib/intake/smartClassification";
import { priceSmartIntake } from "@/lib/pricing/milanoPricingTruth";
import { projectClientPricing } from "@/lib/pricing/pricingProjections";
import { POST } from "@/app/api/intake/quote-preview/route";

const ron = { text: "I need a power of attorney notarized online for one signer in Florida.", structured: { ron: true, signerCount: 1, notarization: true as const }, timeline: "standard" as const, delivery: "digital" as const };

test("server preview equals the one canonical engine's client projection (no second pricing engine)", () => {
  for (const input of [ron, { text: "I need two birth certificates apostilled for Italy", structured: { apostille: true, destinationCountry: "Italy" } }, { text: "not sure what I need" }]) {
    const parsed = intakeQuotePreviewSchema.parse(input);
    const preview = buildIntakeQuotePreview(parsed);
    const canonical = projectClientPricing(priceSmartIntake({ classification: classifyIntake(parsed), selectedLane: parsed.selectedLane, commercialContext: "consumer", timeline: parsed.timeline, delivery: parsed.delivery }));
    assert.equal(preview.mode, canonical.mode);
    assert.equal(preview.amount, canonical.mode === "approved_price" ? canonical.amount : undefined);
    assert.equal(preview.paymentGateRequired, true);
    assert.equal(preview.schedulingLockedUntilPayment, true);
  }
});

test("preview exposes only client-safe keys — never lane bases, add-ons, review reasons or confidence", () => {
  const preview = buildIntakeQuotePreview(intakeQuotePreviewSchema.parse(ron));
  assert.deepEqual(Object.keys(preview).sort(), (preview.mode === "approved_price"
    ? ["amount", "lineItems", "mode", "paymentGateRequired", "schedulingLockedUntilPayment", "summary"]
    : ["lineItems", "mode", "paymentGateRequired", "schedulingLockedUntilPayment", "summary"]).sort());
  const serialized = JSON.stringify(preview);
  assert.doesNotMatch(serialized, /laneBase|authorizedAddOns|manualReviewReasons|pricingConfidence|suggestedLane|internal_only/);
  for (const item of preview.lineItems) assert.deepEqual(Object.keys(item).sort(), ["amount", "key", "label"]);
});

test("schema rejects unknown keys and forged pricing/payment fields", () => {
  for (const forged of [{ ...ron, amount: 1 }, { ...ron, laneBase: 0 }, { ...ron, payment_confirmed: true }, { ...ron, structured: { ...ron.structured, price: 1 } }, { ...ron, selectedLane: "free" }]) {
    assert.equal(intakeQuotePreviewSchema.safeParse(forged).success, false, JSON.stringify(Object.keys(forged)));
  }
});

test("route is stateless, origin-checked and size-limited", async () => {
  const ok = await POST(new Request("https://www.themilanoseal.com/api/intake/quote-preview", { method: "POST", headers: { origin: "https://www.themilanoseal.com" }, body: JSON.stringify(ron) }));
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get("cache-control"), "no-store");
  const cross = await POST(new Request("https://www.themilanoseal.com/api/intake/quote-preview", { method: "POST", headers: { origin: "https://evil.example" }, body: JSON.stringify(ron) }));
  assert.equal(cross.status, 403);
  const big = await POST(new Request("https://www.themilanoseal.com/api/intake/quote-preview", { method: "POST", body: JSON.stringify({ text: "x".repeat(40_000) }) }));
  assert.equal(big.status, 413);
  const bad = await POST(new Request("https://www.themilanoseal.com/api/intake/quote-preview", { method: "POST", body: "{not json" }));
  assert.equal(bad.status, 400);
});
