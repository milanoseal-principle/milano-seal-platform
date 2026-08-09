// Offline production-governance gate for the release-critical Damiani flow.
//
// This validator inspects repository source only. It does not read environment
// values, contact providers, query production data, or claim that an external
// system has been verified.

import { readFileSync } from "node:fs";

const checks = [];

function source(path) {
  return readFileSync(path, "utf8");
}

function check(label, condition) {
  checks.push({ label, ok: Boolean(condition) });
}

function containsAll(text, values) {
  return values.every((value) => text.includes(value));
}

const pkg = JSON.parse(source("package.json"));
const migration = source("supabase/migrations/045_canonical_discount_system.sql");
const reconciliationMigration = source(
  "supabase/migrations/048_production_discount_schema_reconciliation.sql",
);
const intakeRoute = source("app/api/intake/route.ts");
const wiseWebhook = source("app/api/webhooks/wise/route.ts");
const schedulingRoute = source("app/api/deals/[id]/schedule/route.ts");
const signupRoute = source("app/api/auth/signup/route.ts");
const damianiPage = source("app/professional/damiani/page.tsx");
const damianiClient = source("app/professional/damiani/DamianiReentry.tsx");

check(
  "canonical governance script is wired",
  pkg.scripts?.["validate:production-governance"] ===
    "node scripts/validate-production-governance.mjs",
);

check(
  "discount schema and immutable redemption ledger exist",
  containsAll(migration, [
    "create table if not exists public.discount_codes",
    "create table if not exists public.discount_redemptions",
    "discount_codes_code_upper_uidx",
    "discount_redemptions_code_matter_redeemed_uidx",
  ]),
);

check(
  "discount redemption is atomic and server restricted",
  containsAll(migration, [
    "create or replace function public.redeem_discount_for_matter",
    "for update",
    "revoke all on function public.redeem_discount_for_matter",
    "grant execute on function public.redeem_discount_for_matter",
    "to service_role",
  ]),
);

check(
  "discount tables use row-level security",
  containsAll(migration, [
    "alter table public.discount_codes enable row level security",
    "alter table public.discount_redemptions enable row level security",
  ]),
);

check(
  "Wise endpoint verifies, deduplicates, and reconciles money",
  containsAll(wiseWebhook, [
    "verifyWiseSignature",
    'req.headers.get("X-Delivery-Id")',
    "idempotency_hash",
    "extractAmount",
    "extractCurrency",
    "underpayment",
    "overpayment",
    "currency_mismatch",
  ]),
);

check(
  "Wise test bypass cannot run in production",
  wiseWebhook.includes('if (process.env.WISE_ENV === "production") return false;'),
);

check(
  "scheduling remains payment gated",
  containsAll(schedulingRoute, ["PAYMENT_REQUIRED", "status: 402"]),
);

check(
  "Damiani re-entry is bilingual and routes into canonical intake",
  containsAll(`${damianiPage}\n${damianiClient}`, [
    "Italiano",
    "English",
    "/intake?lane=professional&courtesy=DAMIANI50",
  ]),
);

check(
  "intake validates the courtesy code server-side and stores canonical money fields",
  containsAll(intakeRoute, [
    'from("discount_codes")',
    "eligible_subtotal:",
    "discount_amount:",
    "final_total:",
    "original_total:",
  ]),
);

check(
  "intake starts the Matter canonically (intake_received / unpaid)",
  containsAll(intakeRoute, [
    'status: "intake_received"',
    'payment_status: "unpaid"',
    'deal_status: "awaiting_payment"',
  ]),
);

check(
  "intake derives the Wise amount from the DISCOUNTED effective total",
  containsAll(intakeRoute, [
    "generateInvoice(effectiveTotal)",
    "amount: invoice.retainer",
    "amount_due: invoice.retainer",
  ]),
);

check(
  "intake previews the courtesy without redeeming it",
  intakeRoute.includes('redemption_status: "not_redeemed"') &&
    !intakeRoute.includes("redeem_discount_for_matter"),
);

check(
  "runDealEngine receives canonical intake state, never awaiting_payment",
  (() => {
    const start = intakeRoute.indexOf("await runDealEngine({");
    if (start === -1) return false;
    const block = intakeRoute.slice(start, intakeRoute.indexOf("});", start));
    return (
      block.includes('status: "intake_received"') &&
      block.includes('payment_status: "unpaid"') &&
      !block.includes('"awaiting_payment"')
    );
  })(),
);

check(
  "atomic redemption + payment confirmation reconcile exact amount and currency",
  containsAll(reconciliationMigration, [
    "create or replace function public.confirm_wise_payment_for_deal",
    "redeem_discount_for_matter",
    "payment_amount_mismatch",
    "payment_currency_mismatch",
    "payment_reference_mismatch",
    "payment_confirmed=true",
  ]),
);

check(
  "duplicate confirmed settlement is idempotent (no double redemption)",
  containsAll(reconciliationMigration, [
    "already_confirmed",
    "status='redeemed'",
    "discount_redemptions_code_matter_redeemed_uidx",
  ]),
);

check(
  "Wise webhook redeems atomically only on confirmed settlement",
  containsAll(wiseWebhook, [
    "confirm_wise_payment_for_deal",
    '"payment_confirmed"',
    "duplicate",
  ]),
);

check(
  "client signup enforces email confirmation and the client role, failing closed",
  containsAll(signupRoute, [
    "signUp",
    "emailRedirectTo",
    "email_confirmed_at",
    'role: "client"',
    "autoConfirmed",
  ]),
);

// Live external certification is never asserted by this offline gate. This flag
// keeps that explicit: no production data, Wise settlement, DNS, Vercel deploy,
// or real-device journey has been verified by running this validator.
const LIVE_EXTERNAL_CERTIFICATION_VERIFIED = false;
check(
  "validator makes no live-certification claim",
  LIVE_EXTERNAL_CERTIFICATION_VERIFIED === false,
);

const failures = checks.filter(({ ok }) => !ok);
console.log("Production governance (offline source evidence)");
for (const { label, ok } of checks) {
  console.log(`  ${ok ? "PASS" : "FAIL"} ${label}`);
}
console.log(
  failures.length === 0
    ? "External production and real-device gates remain explicitly unverified."
    : `${failures.length} governance check(s) failed.`,
);

process.exitCode = failures.length === 0 ? 0 : 1;
