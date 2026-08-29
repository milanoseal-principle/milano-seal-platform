// Offline production-governance gate for the release-critical Milano Seal flow.
// Source-only: this script never reads secrets, contacts Wise, queries production,
// or claims that live external systems have been certified.

import { readFileSync } from "node:fs";

const checks = [];
const source = (path) => readFileSync(path, "utf8");
const check = (label, condition) => checks.push({ label, ok: Boolean(condition) });
const containsAll = (text, values) => values.every((value) => text.includes(value));

function section(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  if (start === -1) return "";
  const end = endMarker ? text.indexOf(endMarker, start + startMarker.length) : -1;
  return text.slice(start, end === -1 ? undefined : end);
}

const pkg = JSON.parse(source("package.json"));
const discountMigration = source("supabase/migrations/045_canonical_discount_system.sql");
const matterStateMigration = source("supabase/migrations/046_canonical_matter_state_machine.sql");
const wiseDiscountMigration = source("supabase/migrations/047_discount_wise_deal_wiring.sql");
const reconciliationMigration = source("supabase/migrations/048_production_discount_schema_reconciliation.sql");
const intakeRoute = `${source("app/api/intake/route.ts")}\n${source(
  "app/api/intake/core.ts",
)}`;
const wiseWebhook = source("app/api/webhooks/wise/route.ts");
const schedulingRoute = source("app/api/deals/[id]/schedule/route.ts");
const signupRoute = source("app/api/auth/signup/route.ts");
const discountService = source("src/features/discounts/discountService.ts");
const portalPayment = source("app/portal/payment/page.tsx");
const securePaymentCard = source("components/payments/SecurePaymentCard.tsx");
const portalInvoice = source("app/portal/invoice/page.tsx");
const portalProjection = source("lib/portalProjection.ts");
const damianiPage = source("app/professional/damiani/page.tsx");
const damianiClient = source("app/professional/damiani/DamianiReentry.tsx");

const fullInsert = section(intakeRoute, "const intakePayload = {", "let deal:");
const reviewInsert = section(
  intakeRoute,
  "const reviewPayload = {",
  "const { data: reviewDeal",
);
const engineHandoff = section(intakeRoute, "await runDealEngine({", "});");

check(
  "production governance script is wired",
  pkg.scripts?.["validate:production-governance"] === "node scripts/validate-production-governance.mjs",
);

check(
  "canonical discount schema and immutable redemption ledger exist",
  containsAll(discountMigration, [
    "create table if not exists public.discount_codes",
    "create table if not exists public.discount_redemptions",
    "discount_codes_code_upper_uidx",
    "discount_redemptions_code_matter_redeemed_uidx",
  ]),
);

check(
  "discount tables remain protected by RLS",
  containsAll(discountMigration, [
    "alter table public.discount_codes enable row level security",
    "alter table public.discount_redemptions enable row level security",
  ]),
);

check(
  "discount redemption is atomic and service-role restricted",
  containsAll(wiseDiscountMigration + reconciliationMigration, [
    "redeem_discount_for_matter",
    "for update",
    "service_role",
  ]),
);

check(
  "Wise confirmation and discount redemption share one locked transaction",
  containsAll(reconciliationMigration, [
    "create or replace function public.confirm_wise_payment_for_deal",
    "for update",
    "redeem_discount_for_matter",
    "payment_confirmed=true",
  ]),
);

check(
  "atomic confirmation validates amount currency and payment reference",
  containsAll(reconciliationMigration, [
    "payment_amount_mismatch",
    "payment_currency_mismatch",
    "payment_reference_mismatch",
  ]),
);

check(
  "duplicate settlement cannot double redeem",
  containsAll(reconciliationMigration + discountMigration, [
    "already_confirmed",
    "discount_redemptions_code_matter_redeemed_uidx",
  ]),
);

check(
  "canonical Matter lifecycle starts at intake_received",
  containsAll(matterStateMigration, [
    "when p_from is null and p_to='intake_received' then true",
    "initial status must be intake_received",
    "awaiting_payment",
    "scheduled",
  ]),
);

for (const [label, block] of [
  ["canonical intake insert", fullInsert],
  ["review-required intake capture", reviewInsert],
]) {
  check(
    `${label} separates lifecycle payment and legacy states`,
    containsAll(block, [
      'status: "intake_received"',
      'payment_status: "unpaid"',
      'deal_status: "awaiting_payment"',
    ]),
  );
}

check(
  "review-required intake capture creates no invoice or Wise amount",
  !reviewInsert.includes("amount_due:") &&
    !reviewInsert.includes("invoice_retainer:") &&
    !reviewInsert.includes("payment_link"),
);

check(
  "deal engine handoff starts intake_received and unpaid",
  containsAll(engineHandoff, [
    'status: "intake_received"',
    'payment_status: "unpaid"',
  ]) && !engineHandoff.includes('status: "awaiting_payment"'),
);

check(
  "Damiani dedicated route is deterministic Italian-first and server-verified",
  containsAll(damianiClient, [
    "/intake?lane=professional&courtesy=DAMIANI50&source=damiani-reentry",
    "Bentornata, Avv. Damiani",
    "verified and applied before payment",
    "verificato e applicato prima del pagamento",
  ]) && containsAll(damianiPage, ["params.lang === \"en\" ? \"en\" : \"it\"", "index: false", "follow: false"]),
);

check(
  "Damiani courtesy is only requested client-side never redeemed client-side",
  !damianiClient.includes("redeem_discount_for_matter") &&
    !damianiClient.includes("confirm_wise_payment_for_deal") &&
    !damianiClient.includes("discountAmount") &&
    !damianiClient.includes("amount_due"),
);

check(
  "intake validates courtesy server-side and does not redeem during preview",
  containsAll(intakeRoute, [
    'from("discount_codes")',
    'redemption_status: "not_redeemed"',
    "eligible_subtotal:",
    "discount_amount:",
    "original_total:",
    "final_total:",
  ]) && !intakeRoute.includes("redeem_discount_for_matter"),
);

check(
  "canonical discount service requires explicit eligible subtotal and non-discountable total",
  containsAll(discountService, [
    "eligibleSubtotalForMatter",
    "non_discountable_total",
    "computeDiscountAmount",
    "DISCOUNT_REVIEW_REQUIRED",
  ]),
);

check(
  "intake preserves the eligible-subtotal boundary instead of discounting pass-through charges",
  containsAll(intakeRoute, [
    "non_discountable_total",
    "eligibleSubtotal",
    "nonDiscountableTotal",
  ]) && !intakeRoute.includes("const eligibleSubtotalCents = Math.round(Number(pricing.total) * 100)"),
);

check(
  "client monetary truth uses discounted effective total",
  containsAll(intakeRoute, [
    "estimated_value: effectiveTotal",
    "original_total: pricing.total",
    "discount_amount: courtesyAdjustment?.amount ?? 0",
    "final_total: effectiveTotal",
    "amount_due: invoice.retainer",
    "total: effectiveTotal",
  ]),
);

check(
  "Wise payment request derives from discounted invoice amount",
  containsAll(intakeRoute, [
    "const invoice = generateInvoice(effectiveTotal)",
    "amount: invoice.retainer",
    "const payment_reference = deal_id",
  ]),
);

check(
  "Wise webhook verifies signature and deduplicates deliveries",
  containsAll(wiseWebhook, [
    "verifyWiseSignature",
    'req.headers.get("X-Delivery-Id")',
    "idempotency_hash",
    "duplicate: true",
  ]),
);

check(
  "Wise webhook fails closed on amount currency and reference reconciliation",
  containsAll(wiseWebhook, [
    "no_reference",
    "no_matching_deal",
    "missing_or_invalid_amount",
    "missing_or_invalid_currency",
    "underpayment",
    "overpayment",
    "currency_mismatch",
    "confirm_wise_payment_for_deal",
  ]),
);

check(
  "Wise test bypass cannot operate in production",
  wiseWebhook.includes('if (process.env.WISE_ENV === "production") return false;'),
);

check(
  "scheduling is state, execution-truth, and payment gated before an optimistic canonical transition",
  containsAll(schedulingRoute, [
    'canTransition(currentStatus, "scheduled")',
    "validateExecutionTruth(executionTruth)",
    "EXECUTION_REVIEW_REQUIRED",
    "evaluateSchedulingGate({ matter: deal })",
    "PAYMENT_REQUIRED",
    "status: 402",
    'status: "scheduled"',
    'deal_status: "scheduled"',
    'eq("status", deal.status)',
    "STALE_MATTER_STATE",
  ]),
);

check(
  "portal projection exposes client-safe courtesy money fields",
  containsAll(portalProjection, [
    "original_total",
    "discount_amount",
    "final_total",
    "courtesy_applied",
    "courtesy_label",
  ]),
);

check(
  "portal payment surface uses shared Wise-only SecurePaymentCard and explicit server-validated courtesy entry",
  containsAll(portalPayment, [
    'import { SecurePaymentCard } from "@/components/payments/SecurePaymentCard"',
    "Partner or courtesy codes are validated by the server",
    "<SecurePaymentCard",
  ]) && containsAll(securePaymentCard, [
    "Partner or Courtesy Code",
    "Enter code",
    "/apply-discount",
    'paymentType: "retainer"',
    "Complete Secure Payment",
    "Powered by Wise Business",
  ]),
);

check(
  "portal invoice separates Wise processing scheduling authority from verified paid truth",
  containsAll(portalInvoice, [
    "Complimentary Service Authorization",
    "No payment is due for this Matter",
    "Complimentary authorization remains separate from Wise paid-state authority",
    "Wise reference:",
    "Refresh Wise payment status",
    "A recorded submission may satisfy scheduling authority",
    "verified Wise settlement remains the authority for paid state",
    "signer-link release",
  ]) &&
    portalInvoice.includes("window.setInterval(() => void loadPaymentFlow(), 10_000)") &&
    !/complimentaryAuthorized[\s\S]{0,2000}(paymentConfirmed\s*=\s*true|paymentStatus\s*=\s*["']paid["'])/.test(portalInvoice),
);

check(
  "client signup requires confirmation posture and client role",
  containsAll(signupRoute, ["signUp", "client", "confirmation"]),
);

const failed = checks.filter((item) => !item.ok);
for (const item of checks) {
  console.log(`${item.ok ? "PASS" : "FAIL"} ${item.label}`);
}
console.log(`Production governance: ${checks.length - failed.length}/${checks.length} passed`);
console.log("External live certification: UNVERIFIED by this source-only validator");

if (failed.length) process.exit(1);
