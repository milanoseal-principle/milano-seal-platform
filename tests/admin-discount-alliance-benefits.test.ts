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

test("intake and Matter discount application enforce governed restrictions", () => {
  const intake = read("app/api/intake/core.ts");
  const discountService = read("src/features/discounts/discountService.ts");

  assert.match(intake, /client_id,matter_id,metadata/);
  assert.match(intake, /Courtesy code is not eligible for this client/);
  assert.match(intake, /Courtesy code is restricted to a specific Matter/);
  assert.match(intake, /Courtesy code is not assigned to this Alliance account/);
  assert.match(intake, /Courtesy code is not eligible for this service scope/);

  assert.match(discountService, /Discount code is not eligible for this client/);
  assert.match(discountService, /Discount code is not assigned to this Alliance account/);
  assert.match(discountService, /Discount code is not eligible for this service scope/);
  assert.match(discountService, /redeemDiscountAfterWiseReconciliation/);
});

test("governed reporting preserves currency boundaries and unique partner attribution", () => {
  const report = read("app/api/dashboard/discounts/report/route.ts");
  const reportPage = read("app/dashboard/payments/discounts/report/page.tsx");
  const dashboardAuth = read("lib/dashboardAuth.ts");
  const roleRedirect = read("lib/auth/roleRedirect.ts");

  assert.match(report, /monetary_totals/);
  assert.match(report, /normalizeCurrency/);
  assert.match(report, /new Set\(rows\.map\(\(row\) => row\.alliance_member_id\)/);
  assert.match(report, /deals identity projection/);
  assert.match(reportPage, /monetarySummary/);
  assert.match(reportPage, /Monetary totals stay separated by original currency/);
  assert.match(dashboardAuth, /normalizeUserRole/);
  assert.doesNotMatch(dashboardAuth, /"virtual_assistant"/);
  assert.match(roleRedirect, /"finance"/);
  assert.match(roleRedirect, /"finance_operator"/);
});

test("governed reporting does not misstate adjusted Matter value as paid revenue", () => {
  const report = read("app/api/dashboard/discounts/report/route.ts");
  assert.match(report, /conversion_rate:\s*null/);
  assert.match(report, /No governed code-impression denominator is stored/);
  assert.match(report, /Wise reconciliation remains authoritative for paid revenue/);
});
