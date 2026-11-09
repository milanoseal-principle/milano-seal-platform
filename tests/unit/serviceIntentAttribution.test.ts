import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { summarizeByServiceIntent } from "@/lib/intake/serviceIntentAttribution";
import { INTAKE_ANALYTICS_EVENTS } from "@/lib/intake/intakeAnalytics";

const tag = (intent: string) => `[client_requested_service] ${intent} (context only)`;
const settled = { payment_confirmed: true, payment_status: "paid", payment_settlement_status: "cleared", amount_due: 500, amount_paid: 500, currency: "USD" };

test("verified revenue counts only exact verified settlement, per currency, grouped by requested service", () => {
  const rows = [
    { id: "1", notes: tag("ron"), quote_approved_at: "2026-11-01", ...settled },
    { id: "2", notes: tag("ron"), quote_approved_at: "2026-11-01", payment_confirmed: false, payment_status: "unpaid", payment_settlement_status: "observed_pending", amount_due: 500, amount_paid: 0, currency: "USD" },
    { id: "3", notes: tag("ron"), ...settled, amount_paid: 250 },
    { id: "4", notes: tag("apostille"), ...settled, currency: "EUR" },
    { id: "5", notes: tag("witness"), quote_approved_at: "2026-11-02", payment_confirmed: true, payment_status: "unpaid", amount_due: 500, amount_paid: 0, currency: "USD" },
    { id: "6", notes: "legacy Matter", ...settled },
    { id: "7", notes: tag("ron"), is_sample: true, ...settled },
  ];
  const by = Object.fromEntries(summarizeByServiceIntent(rows).map((r) => [r.intent, r]));
  assert.deepEqual(by.ron, { intent: "ron", matters: 3, quoted: 2, verifiedSettled: 1, verifiedRevenueByCurrency: { USD: 500 } });
  assert.deepEqual(by.apostille.verifiedRevenueByCurrency, { EUR: 500 }, "currencies are never converted");
  assert.equal(by.witness.verifiedSettled, 0, "flag-only confirmation is not revenue");
  assert.equal(by.not_captured.matters, 1, "missing intent is not guessed");
  assert.equal(by.counsel.matters, 0);
});

test("intent analytics reuse the existing taxonomy and every intake event carries the intent", () => {
  assert.ok(INTAKE_ANALYTICS_EVENTS.includes("service_intent_selected"));
  assert.ok(INTAKE_ANALYTICS_EVENTS.includes("lead_fallback_opened"));
  const wizard = readFileSync("components/intake/smart-intake-sop-wizard.tsx", "utf8");
  assert.match(wizard, /buildIntakeAnalyticsPayload\(event, \{ intent, \.\.\.metadata \}/);
  assert.match(wizard, /track\("service_intent_selected"/);
});

test("lead fallback reuses the governed Get Pricing request (sales_leads), carrying the intent", () => {
  const wizard = readFileSync("components/intake/smart-intake-sop-wizard.tsx", "utf8");
  assert.match(wizard, /commercialHref\("get_pricing", \{ serviceIntent: toConciergeServiceIntent\(intent\), source: `intake-\$\{intent\}` \}\)/);
  assert.match(wizard, /data-testid="intake-lead-fallback"/);
  assert.doesNotMatch(wizard, /from\("sales_leads"\)/, "no second lead store in the browser");
});

test("attribution report is read-only, paginated by rows received, and never shows guessed figures", () => {
  const source = readFileSync("components/acquisition/ServiceIntentAttribution.tsx", "utf8");
  assert.match(source, /readAllKeyset/);
  assert.match(source, /\.gt\("id", cursor\.id\)/);
  assert.doesNotMatch(source, /\.insert\(|\.update\(|\.delete\(|select\("\*"\)/);
  assert.match(source, /No figures are shown rather than guessed/);
});
