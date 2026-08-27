import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

const api = read("app/api/dashboard/discounts/route.ts");
const manager = read("app/dashboard/payments/discounts/page.tsx");
const reportApi = read("app/api/dashboard/discounts/report/route.ts");
const reportPage = read("app/dashboard/payments/discounts/report/page.tsx");
const operatorShell = read("components/dashboard/OperatorShell.tsx");
const dashboardAuth = read("lib/dashboardAuth.ts");
const roleRedirect = read("lib/auth/roleRedirect.ts");
const allianceSidebar = read("components/alliance/AllianceSidebar.tsx");
const allianceBenefitsPage = read("app/alliance/benefits/page.tsx");
const allianceBenefitsCard = read("components/alliance/AllianceBenefitsCard.tsx");
const referralEngine = read("components/alliance/AllianceReferralEngine.tsx");
const referralPage = read("app/alliance/referrals/new/page.tsx");
const discountService = read("src/features/discounts/discountService.ts");
const intake = read("app/api/intake/core.ts");

assert.match(api, /founder_admin/);
assert.match(api, /admin_operator/);
assert.match(api, /internal_reason/);
assert.match(api, /metadata/);
assert.match(api, /alliance_member_id/);
assert.match(api, /eligible_service_scope/);
assert.match(api, /stackable:\s*false/);
assert.match(api, /status:\s*"inactive"/);
assert.match(api, /applies_to:\s*body\.applies_to\s*\?\?\s*"eligible_subtotal"/);
assert.doesNotMatch(api, /total_price\s*:/);
assert.doesNotMatch(api, /invoice_retainer\s*:/);
assert.doesNotMatch(api, /payment_confirmed\s*:/);

assert.match(manager, /Discount Code Manager/);
assert.match(manager, /Create inactive code/);
assert.match(manager, /Alliance member restriction/);
assert.match(manager, /Eligible service scope/);
assert.match(manager, /internal_reason/);
assert.doesNotMatch(manager, /DAMIANI50/);
assert.doesNotMatch(manager, /TIFFTEST50/);

assert.match(operatorShell, /\/dashboard\/payments/);
assert.match(operatorShell, /\/dashboard\/payments\/discounts/);
assert.match(operatorShell, /\/dashboard\/payments\/discounts\/report/);

assert.match(dashboardAuth, /normalizeUserRole/);
assert.match(dashboardAuth, /"operator"/);
assert.match(dashboardAuth, /"admin"/);
assert.match(dashboardAuth, /"owner"/);
assert.doesNotMatch(dashboardAuth, /"virtual_assistant"/);
for (const alias of ["finance", "finance_operator"]) {
  assert.match(roleRedirect, new RegExp(`"${alias}"`));
}

assert.match(allianceSidebar, /\/alliance\/benefits/);
assert.match(allianceBenefitsPage, /alliance_member_id/);
assert.match(allianceBenefitsPage, /\.contains\("metadata"/);
assert.match(allianceBenefitsCard, /Read-only benefits/);
assert.match(allianceBenefitsCard, /Pricing authority remains server controlled/);
assert.doesNotMatch(allianceBenefitsCard, /fetch\([^)]*discounts/);

assert.match(referralEngine, /referral_code/);
assert.match(referralEngine, /Referral attribution locked to this Alliance account/);
assert.match(referralPage, /referralCode/);
assert.match(referralPage, /partnerEmail/);

assert.match(reportApi, /finance_operator/);
assert.match(reportApi, /discount_redemptions/);
assert.match(reportApi, /referral_ledger/);
assert.match(reportApi, /conversion_rate:\s*null/);
assert.match(reportApi, /monetary_totals/);
assert.match(reportApi, /new Set\(rows\.map\(\(row\) => row\.alliance_member_id\)/);
assert.match(reportApi, /deals identity projection/);
assert.match(reportApi, /Wise reconciliation remains authoritative for paid revenue/);
assert.match(reportPage, /Courtesy Program Intelligence/);
assert.match(reportPage, /monetarySummary/);
assert.match(reportPage, /Monetary totals stay separated by original currency/);

assert.match(intake, /client_id,matter_id,metadata/);
assert.match(intake, /Courtesy code is not eligible for this client/);
assert.match(intake, /Courtesy code is restricted to a specific Matter/);
assert.match(intake, /Courtesy code is not assigned to this Alliance account/);
assert.match(intake, /Courtesy code is not eligible for this service scope/);

assert.match(discountService, /redeemDiscountAfterWiseReconciliation/);
assert.match(discountService, /Discount code is not eligible for this client/);
assert.match(discountService, /Discount code is not assigned to this Alliance account/);
assert.match(discountService, /Discount code is not eligible for this service scope/);
assert.match(discountService, /eligible subtotal is not explicitly stored/);

for (const source of [api, manager, reportApi, reportPage, allianceBenefitsPage, allianceBenefitsCard, referralEngine, referralPage]) {
  assert.doesNotMatch(source, /stripe/i);
}

console.log("Admin discount control + Alliance benefits governance validation passed.");
