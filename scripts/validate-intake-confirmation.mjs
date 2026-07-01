// validate:intake-confirmation — Phase 1 deterministic handoff guard.
//
// Asserts the post-intake confirmation page renders a deterministic handoff
// block (Matter ID, status, next step, response window, payment/scheduling gate)
// with the required copy, invents no fake matter ID, and carries no banned
// phrases. Also asserts no payment/Wise/release/auth/DB/custody files changed
// (checked at the git level in CI; here we assert the page does not embed a
// hardcoded fake demo ID and keeps the payment-gate wording intact).

import { readFileSync, existsSync } from "fs";

const errors = [];

const PAGE = "app/intake/confirmation/page.tsx";
if (!existsSync(PAGE)) {
  errors.push(`${PAGE} does not exist`);
}
const src = existsSync(PAGE) ? readFileSync(PAGE, "utf8") : "";

const REQUIRED = [
  "Matter Received",
  "Matter ID",
  "Under Review",
  "Compliance + execution review",
  "One business day",
  "Not scheduled until payment is complete",
];
for (const phrase of REQUIRED) {
  if (!src.includes(phrase)) errors.push(`${PAGE} is missing required copy: "${phrase}"`);
}

// Matter-ID-pending fallback must exist (no invented IDs).
if (!src.includes("Matter ID pending")) {
  errors.push(`${PAGE} is missing the "Matter ID pending" fallback`);
}

// No hardcoded fake demo matter ID presented as a real ID.
// A real ID is only ever derived from the query param — a literal like
// "MS-2026-0001" baked into the page would be a fake.
const FAKE_ID = /["'`]MS-20\d{2}-\d{3,4}["'`]/;
if (FAKE_ID.test(src)) {
  errors.push(`${PAGE} embeds a hardcoded fake MS-YYYY-NNNN demo ID as a real ID`);
}

// Banned phrases on this public surface.
const BANNED = [
  /\bStripe\b/,
  /guaranteed accept/i,
  /government approved/i,
  /legal advice/i,
  /instant approval/i,
  /AI-?approved/i,
  /AI-?certified/i,
  /Notarize From Anywhere/i,
  /Start Controlled Intake/i,
];
for (const re of BANNED) {
  if (re.test(src)) errors.push(`${PAGE} contains banned phrase: ${re}`);
}

if (errors.length) {
  console.error("validate:intake-confirmation FAILED:");
  for (const e of errors) console.error("  - " + e);
  throw new Error(`${errors.length} intake-confirmation error(s)`);
}
console.log(
  "validate:intake-confirmation passed (deterministic Matter Received handoff present; matter-ID-pending fallback; no fake IDs; no banned phrases)",
);
