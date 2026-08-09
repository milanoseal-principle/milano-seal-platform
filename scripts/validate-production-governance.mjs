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
const wiseWebhook = source("app/api/webhooks/wise/route.ts");
const schedulingRoute = source("app/api/deals/[id]/schedule/route.ts");
const damianiPage = source("app/professional/damiani/page.tsx");
const damianiClient = source("app/professional/damiani/DamianiReentry.tsx");
const intakeRoute = source("app/api/intake/route.ts");

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

// Canonical Matter lifecycle must remain independent from payment state.
// Every new deal row begins at intake_received; payment stays unpaid; the
// legacy deal_status value is compatibility metadata only.
const canonicalInsertCount =
  intakeRoute.match(/status:\s*["']intake_received["']/g)?.length ?? 0;
const unpaidCount =
  intakeRoute.match(/payment_status:\s*["']unpaid["']/g)?.length ?? 0;
const legacyAwaitingPaymentCount =
  intakeRoute.match(/deal_status:\s*["']awaiting_payment["']/g)?.length ?? 0;

check(
  "all Smart Intake insert paths seed canonical intake_received state",
  canonicalInsertCount >= 4,
);

check(
  "Smart Intake keeps payment status separate and unpaid at creation",
  unpaidCount >= 4,
);

check(
  "legacy deal_status remains awaiting_payment compatibility metadata",
  legacyAwaitingPaymentCount >= 3,
);

check(
  "deal engine handoff starts from canonical intake_received",
  /runDealEngine\(\{[\s\S]*?status:\s*["']intake_received["'][\s\S]*?payment_status:\s*["']unpaid["']/.test(
    intakeRoute,
  ),
);

check(
  "Smart Intake does not hand the engine awaiting_payment as canonical status",
  !/runDealEngine\(\{[\s\S]*?status:\s*["']awaiting_payment["']/.test(
    intakeRoute,
  ),
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
