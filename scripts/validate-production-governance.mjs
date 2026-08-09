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
const stateMachineMigration = source(
  "supabase/migrations/046_canonical_matter_state_machine.sql",
);
const wiseWebhook = source("app/api/webhooks/wise/route.ts");
const schedulingRoute = source("app/api/deals/[id]/schedule/route.ts");
const intakeRoute = source("app/api/intake/route.ts");
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
