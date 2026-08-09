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
  containsAll(discountMigration, [
    "create table if not exists public.discount_codes",
    "create table if not exists public.discount_redemptions",
    "discount_codes_code_upper_uidx",
    "discount_redemptions_code_matter_redeemed_uidx",
  ]),
);

check(
  "discount redemption is atomic and server restricted",
  containsAll(discountMigration, [
    "create or replace function public.redeem_discount_for_matter",
    "for update",
    "revoke all on function public.redeem_discount_for_matter",
    "grant execute on function public.redeem_discount_for_matter",
    "to service_role",
  ]),
);

check(
  "discount tables use row-level security",
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
