// validate:discount-engine — Block 4 (Option A: extend, do not fork).
//
// Asserts the additive discount-request/approval layer is present and wired,
// that it did NOT fork the existing engine or collide with the existing schema,
// and that the payment/release hard-locks hold (no unaudited payment_status
// write, no duplicate discount_codes table, no public coupon language, no
// static TIFFANY100 public code, comp gated by owner/operator permission).

import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

const errors = [];
const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "");

// 1. Existing engine preserved (source of truth — do not rebuild).
const PRESERVE = [
  "supabase/migrations/035_discount_codes.sql",
  "src/features/discounts/discountService.ts",
  "lib/discountCodes.ts",
  "app/api/deals/[id]/apply-discount/route.ts",
];
for (const p of PRESERVE) {
  if (!existsSync(p)) errors.push(`existing engine file missing (must be preserved): ${p}`);
}

// 2. Additive request layer present.
const ADDITIVE = [
  "supabase/migrations/042_discount_requests.sql",
  "lib/discounts/env.ts",
  "lib/discounts/permissions.ts",
  "lib/discounts/requests.ts",
  "lib/discounts/audit.ts",
  "lib/discounts/types.ts",
  "app/api/alliance/discounts/request/route.ts",
  "app/api/admin/discounts/requests/route.ts",
  "app/api/admin/discounts/requests/[id]/approve/route.ts",
  "lib/discounts/compClear.ts",
  "app/api/admin/discounts/comp-clear/route.ts",
];

// The comp-clear path is the ONLY additive code allowed to write payment state,
// and only through an audited redemption. Everything else must not.
const COMP_CLEAR_FILES = new Set([
  "lib/discounts/compClear.ts",
  "app/api/admin/discounts/comp-clear/route.ts",
]);
for (const p of ADDITIVE) {
  if (!existsSync(p)) errors.push(`additive discount-engine file missing: ${p}`);
}

// 3. No schema collision — migration 042 must NOT (re)create the existing tables.
const mig042 = read("supabase/migrations/042_discount_requests.sql");
// Anchor the table name directly after `create table [if not exists] [public.]`
// so comment mentions of the existing tables don't false-positive.
const createTable = (name) =>
  new RegExp(`create\\s+table\\s+(if\\s+not\\s+exists\\s+)?(public\\.)?${name}\\b`, "i");
if (createTable("discount_codes").test(mig042)) {
  errors.push("042 recreates discount_codes (schema collision) — must only add discount_requests");
}
if (createTable("discount_redemptions").test(mig042)) {
  errors.push("042 recreates discount_redemptions (schema collision)");
}
if (!createTable("discount_requests").test(mig042)) {
  errors.push("042 does not create the new discount_requests table");
}

// 4. Engine gate + comp permission wired.
if (!/DISCOUNT_ENGINE_ENABLED/.test(read("lib/discounts/env.ts"))) {
  errors.push("DISCOUNT_ENGINE_ENABLED is not referenced in lib/discounts/env.ts");
}
if (!/canApproveComp/.test(read("app/api/admin/discounts/requests/[id]/approve/route.ts"))) {
  errors.push("comp approval route does not enforce canApproveComp (owner/operator gate)");
}
// amount clamp (>= 0) preserved in the existing service.
if (!/Math\.max\(0/.test(read("src/features/discounts/discountService.ts"))) {
  errors.push("discountService no longer clamps amounts to >= 0");
}

// 5. Payment hard-locks.
//    (a) Only the comp-clear path may write payment state; everything else must not.
//    (b) No file may introduce a `paid_comped` status (we reuse the existing
//        'confirmed' clear — no new status, no CHECK-constraint migration).
for (const p of ADDITIVE.filter((f) => f.startsWith("lib/discounts") || f.startsWith("app/api"))) {
  const src = read(p);
  if (!COMP_CLEAR_FILES.has(p) && /payment_status\s*[:=]/.test(src)) {
    errors.push(`non-comp-clear additive file writes payment_status: ${p}`);
  }
  if (/paid_comped/.test(src)) {
    errors.push(`additive file introduces paid_comped (must reuse existing 'confirmed' clear): ${p}`);
  }
}

// 5b. Comp-clear must be audited + backed by a redemption, and reuse 'confirmed'.
const compClear = read("lib/discounts/compClear.ts");
if (compClear) {
  for (const ev of ["PAYMENT_COMPED", "PAYMENT_BALANCE_UPDATED", "SCHEDULING_UNLOCKED"]) {
    if (!compClear.includes(ev)) errors.push(`compClear.ts does not write the ${ev} audit event`);
  }
  if (!/discount_redemptions/.test(compClear)) {
    errors.push("compClear.ts does not record an audited discount_redemptions row");
  }
  if (!/["']confirmed["']/.test(compClear)) {
    errors.push("compClear.ts does not reuse the existing 'confirmed' payment status");
  }
  if (!/Math\.max\(0/.test(compClear)) {
    errors.push("compClear.ts does not clamp the final amount to >= 0");
  }
}
if (!/canApproveComp/.test(read("app/api/admin/discounts/comp-clear/route.ts"))) {
  errors.push("comp-clear route does not enforce canApproveComp (owner/operator gate)");
}

// Release gate must be untouched by this branch (no paid_comped, no comp edits).
const releaseGate = read("lib/release/performFinalRelease.ts");
if (/paid_comped/.test(releaseGate)) {
  errors.push("performFinalRelease.ts references paid_comped — must reuse existing confirmed clear");
}

// 6. Public-surface guards: no TIFFANY100 static code, no "100% off" coupon copy.
const PUBLIC_DIRS = ["components/landing", "components/conversion", "components/payment"];
const PUBLIC_FILES = ["app/pricing/page.tsx", "app/secure-portal/page.tsx", "app/page.tsx"];
function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.tsx?$/.test(n)) out.push(p);
  }
  return out;
}
const publicFiles = [...PUBLIC_DIRS.flatMap(walk), ...PUBLIC_FILES.filter(existsSync)];
for (const f of publicFiles) {
  const src = read(f);
  if (/TIFFANY100/i.test(src)) errors.push(`static TIFFANY100 code exposed in public surface: ${f}`);
  if (/100%\s*off/i.test(src)) errors.push(`public "100% off" coupon copy in: ${f}`);
}

if (errors.length) {
  console.error("validate:discount-engine FAILED:");
  for (const e of errors) console.error("  - " + e);
  throw new Error(`${errors.length} discount-engine error(s)`);
}
console.log(
  "validate:discount-engine passed (existing engine preserved; additive request/approval layer wired; no schema collision; no unaudited payment write; comp owner/operator-gated; no public coupon language)",
);
