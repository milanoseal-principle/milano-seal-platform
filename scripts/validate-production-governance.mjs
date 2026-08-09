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

function between(text, start, end) {
  const startIndex = text.indexOf(start);
  if (startIndex < 0) return "";
  const endIndex = end ? text.indexOf(end, startIndex + start.length) : -1;
  return text.slice(startIndex, endIndex >= 0 ? endIndex : undefined);
}

const pkg = JSON.parse(source("package.json"));
const discountMigration = source("supabase/migrations/045_canonical_discount_system.sql");
const stateMigration = source("supabase/migrations/046_canonical_matter_state_machine.sql");
const discountReconciliation = source("supabase/migrations/048_production_discount_schema_reconciliation.sql");
function section(text, start, end) {
  const startIndex = text.indexOf(start);
  if (startIndex < 0) return "";
  const endIndex = text.indexOf(end, startIndex + start.length);
  if (endIndex < 0) return "";
  return text.slice(startIndex, endIndex);
}

function hasCanonicalIntakeState(text) {
  return containsAll(text, [
    'status: "intake_received"',
    'payment_status: "unpaid"',
    'deal_status: "awaiting_payment"',
  ]);
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
const stateMachineMigration = source(
  "supabase/migrations/046_canonical_matter_state_machine.sql",
);
const wiseWebhook = source("app/api/webhooks/wise/route.ts");
const schedulingRoute = source("app/api/deals/[id]/schedule/route.ts");
const intakeRoute = source("app/api/intake/route.ts");
const damianiPage = source("app/professional/damiani/page.tsx");
const damianiClient = source("app/professional/damiani/DamianiReentry.tsx");
function section(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  if (start === -1) return "";
  const end = text.indexOf(endMarker, start + startMarker.length);
  if (end === -1) return text.slice(start);
  return text.slice(start, end);
}

const pkg = JSON.parse(source("package.json"));
const discountMigration = source("supabase/migrations/045_canonical_discount_system.sql");
const matterStateMigration = source("supabase/migrations/046_canonical_matter_state_machine.sql");
const wiseWebhook = source("app/api/webhooks/wise/route.ts");
const schedulingRoute = source("app/api/deals/[id]/schedule/route.ts");
const intakeRoute = source("app/api/intake/route.ts");
const portalPayment = source("app/portal/payment/page.tsx");
const portalInvoice = source("app/portal/invoice/page.tsx");
const portalProjection = source("lib/portalProjection.ts");
const damianiPage = source("app/professional/damiani/page.tsx");
const damianiClient = source("app/professional/damiani/DamianiReentry.tsx");
const intakeRoute = source("app/api/intake/route.ts");

const fullInsert = section(intakeRoute, "const intakePayload = {", "let deal:");
const minimalInsert = section(intakeRoute, "const minimalPayload = {", "const { data: d2");
const bareInsert = section(intakeRoute, "const barePayload = {", "const { data: d3");
const engineHandoff = section(intakeRoute, "await runDealEngine({", "});");

check(
  "canonical governance script is wired",
  pkg.scripts?.["validate:production-governance"] ===
    "node scripts/validate-production-governance.mjs",
);

check(
  "discount schema and immutable redemption ledger exist",
  containsAll(migration, [
  containsAll(discountMigration, [
    "create table if not exists public.discount_codes",
    "create table if not exists public.discount_redemptions",
    "discount_codes_code_upper_uidx",
    "discount_redemptions_code_matter_redeemed_uidx",
  ]),
);

check(
  "discount redemption is atomic and server restricted",
  containsAll(discountReconciliation, [
  containsAll(migration, [
  containsAll(discountMigration, [
    "create or replace function public.redeem_discount_for_matter",
    "for update",
    "revoke all on function public.redeem_discount_for_matter",
    "grant execute on function public.redeem_discount_for_matter",
    "to service_role",
  ]),
);

check(
  "Wise confirmation and discount redemption share one locked transaction",
  containsAll(discountReconciliation, [
    "create or replace function public.confirm_wise_payment_for_deal",
    "select * into v_deal from public.deals where id=p_deal_id for update",
    "v_redemption_id:=public.redeem_discount_for_matter",
    "payment_confirmed=true",
  ]),
);

check(
  "discount tables use row-level security",
  containsAll(discountReconciliation, [
  containsAll(migration, [
  containsAll(discountMigration, [
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
    'supabase.rpc("confirm_wise_payment_for_deal"',
  ]),
);

check(
  "Wise test bypass cannot run in production",
  wiseWebhook.includes('if (process.env.WISE_ENV === "production") return false;'),
);

check(
  "migration 046 owns canonical Matter lifecycle and intake_received is initial",
  containsAll(stateMigration, [
    "intake_received",
    "awaiting_payment",
    "scheduled",
  ]),
);

const fullInsert = between(
  intakeRoute,
  "const intakePayload = {",
  "let deal:",
);
const minimalInsert = between(
  intakeRoute,
  "const minimalPayload = {",
  "const { data: d2",
);
const bareInsert = between(
  intakeRoute,
  "const barePayload = {",
  "const { data: d3",
);
const engineHandoff = between(
  intakeRoute,
  "await runDealEngine({",
  "});",
);

for (const [label, block] of [
  ["full intake insert", fullInsert],
  ["minimal intake fallback", minimalInsert],
  ["bare intake fallback", bareInsert],
]) {
  check(
    `${label} preserves lifecycle/payment separation`,
    containsAll(block, [
      'status: "intake_received"',
      'payment_status: "unpaid"',
      'deal_status: "awaiting_payment"',
    ]),
  );
}

check(
  "deal engine handoff starts at intake_received and unpaid",
  containsAll(engineHandoff, [
    'status: "intake_received"',
    'payment_status: "unpaid"',
  ]) && !engineHandoff.includes('status: "awaiting_payment"'),
);

check(
  "client-facing intake monetary truth uses discounted effective total",
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
  "Wise payment request is created from the discounted invoice amount",
  containsAll(intakeRoute, [
    "const invoice = generateInvoice(effectiveTotal)",
    "amount: invoice.retainer",
    "wise_invoice",
  ]),
);

check(
  "scheduling remains payment gated and advances canonical status",
  containsAll(schedulingRoute, [
    "PAYMENT_REQUIRED",
    "status: 402",
    'status: "scheduled"',
    'deal_status: "scheduled"',
  ]),
);

check(
  "portal projection exposes courtesy totals without raw courtesy code",
  containsAll(portalProjection, [
    "original_total",
    "discount_amount",
    "final_total",
    "courtesy_applied",
    "courtesy_label",
    '"discount_code"',
  ]),
);

check(
  "portal payment is automatic-courtesy and Wise-only",
  containsAll(portalPayment, [
    "Original service total",
    "Professional courtesy",
    "Final service total",
    "Amount due now",
    "Continue to Secure Wise Payment",
  ]) && !portalPayment.includes("Enter code"),
);

check(
  "portal invoice never asks Damiani to enter a discount code",
  containsAll(portalInvoice, [
    "professional courtesy attached to your Matter is applied automatically",
    "Continue to Secure Wise Payment",
  ]) && !portalInvoice.includes("Enter code"),
);

check(
  "state machine requires the canonical initial lifecycle state",
  containsAll(stateMachineMigration, [
    "when p_from is null and p_to='intake_received' then true",
    "initial status must be intake_received",
  ]),
);

const fullPayload = section(
  intakeRoute,
  "const intakePayload = {",
  "const supabase = createAdminClient();",
);
const minimalPayload = section(
  intakeRoute,
  "const minimalPayload = {",
  'const { data: d2, error: e2 }',
);
const barePayload = section(
  intakeRoute,
  "const barePayload = {",
  'const { data: d3, error: e3 }',
);
const engineHandoff = section(
  intakeRoute,
  "await runDealEngine({",
  "});",
);

check(
  "full intake insert separates lifecycle, payment, and legacy states",
  hasCanonicalIntakeState(fullPayload),
);

check(
  "minimal intake fallback separates lifecycle, payment, and legacy states",
  hasCanonicalIntakeState(minimalPayload),
);

check(
  "bare intake fallback separates lifecycle, payment, and legacy states",
  hasCanonicalIntakeState(barePayload),
);

check(
  "deal engine starts from intake_received with payment unpaid",
  "Damiani re-entry is bilingual and routes into canonical intake",
  containsAll(`${damianiPage}\n${damianiClient}`, [
    "Italiano",
    "English",
    "/intake?lane=professional&courtesy=DAMIANI50",
  ]),
);

check(
  "canonical state migration requires intake_received as the initial Matter state",
  containsAll(matterStateMigration, [
    "when p_from is null and p_to='intake_received' then true",
    "INVALID_MATTER_STATE: initial status must be intake_received",
  ]),
);

check(
  "full Smart Intake insert preserves canonical Matter/payment/legacy state separation",
  containsAll(fullInsert, [
    'status: "intake_received"',
    'payment_status: "unpaid"',
    'deal_status: "awaiting_payment"',
  ]),
);

check(
  "minimal Smart Intake fallback preserves canonical Matter/payment/legacy state separation",
  containsAll(minimalInsert, [
    'status: "intake_received" as const',
    'payment_status: "unpaid" as const',
    'deal_status: "awaiting_payment" as const',
  ]),
);

check(
  "bare Smart Intake fallback preserves canonical Matter/payment/legacy state separation",
  containsAll(bareInsert, [
    'status: "intake_received" as const',
    'payment_status: "unpaid" as const',
    'deal_status: "awaiting_payment" as const',
  ]),
);

check(
  "deal-engine handoff starts at canonical intake_received with payment still unpaid",
  containsAll(engineHandoff, [
    'status: "intake_received"',
    'payment_status: "unpaid"',
  ]) && !engineHandoff.includes('status: "awaiting_payment"'),
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
    ? "External production, provider, database, and real-device gates remain explicitly unverified."
    : `${failures.length} governance check(s) failed.`,
);

process.exitCode = failures.length === 0 ? 0 : 1;
