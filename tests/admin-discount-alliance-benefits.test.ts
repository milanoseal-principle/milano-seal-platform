import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("admin discount + Alliance benefits governance validator passes", () => {
  assert.doesNotThrow(() =>
    execFileSync(process.execPath, ["scripts/validate-admin-discount-alliance-benefits.mjs"], {
      stdio: "pipe",
    }),
  );
});

test("discount manager cannot directly mutate canonical Matter monetary truth", () => {
  const api = read("app/api/dashboard/discounts/route.ts");
  for (const forbidden of [
    "total_price:",
    "final_total:",
    "invoice_retainer:",
    "invoice_balance:",
    "amount_due:",
    "payment_confirmed:",
  ]) {
    assert.equal(api.includes(forbidden), false, `${forbidden} must not be written by discount-code administration`);
  }
  assert.match(api, /status:\s*"inactive"/);
  assert.match(api, /stackable:\s*false/);
});

test("Alliance benefits are read-only and referral attribution is authenticated-account derived", () => {
  const benefits = read("app/alliance/benefits/page.tsx");
  const card = read("components/alliance/AllianceBenefitsCard.tsx");
  const referralPage = read("app/alliance/referrals/new/page.tsx");
  const referralEngine = read("components/alliance/AllianceReferralEngine.tsx");

  assert.match(benefits, /\.eq\("user_id", user\.id\)/);
  assert.match(benefits, /alliance_member_id/);
  assert.match(card, /Read-only benefits/);
  assert.equal(/method:\s*"(?:POST|PATCH|DELETE)"/.test(card), false);
  assert.match(referralPage, /referralCode/);
  assert.match(referralEngine, /referral_code/);
});

test("governed reporting does not misstate adjusted Matter value as paid revenue", () => {
  const report = read("app/api/dashboard/discounts/report/route.ts");
  assert.match(report, /conversion_rate:\s*null/);
  assert.match(report, /No governed code-impression denominator is stored/);
  assert.match(report, /Wise reconciliation remains authoritative for paid revenue/);
});
