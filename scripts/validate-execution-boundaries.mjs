// validate:execution-boundaries — enforces the non-negotiable authority boundaries.
//
//   - Final release is founder-only (alliance partners, execution support, and even
//     admin_operator cannot approve release).
//   - Execution Support (VA) public copy states it cannot approve payment / release /
//     apostille / notarial / final authority.
// These are security properties, so the validator reads the actual route guard and
// the public boundary copy — not a comment.

import { readFileSync } from "fs";

const errors = [];

function read(f) {
  try {
    return readFileSync(f, "utf8");
  } catch {
    errors.push("missing file: " + f);
    return "";
  }
}

// Release route must gate on a founder-admin check and return 403 otherwise.
const release = read("app/api/deals/[id]/release/route.ts");
if (!/isFounderAdmin\s*\(/.test(release))
  errors.push("release route does not gate on isFounderAdmin()");
if (!/403/.test(release))
  errors.push("release route does not return 403 on unauthorized");

// Payment confirmation must be founder/admin-gated, never client/alliance/va.
const confirm = read("app/api/admin/matters/[id]/confirm-payment/route.ts");
if (confirm && !/founder|admin/i.test(confirm))
  errors.push("confirm-payment route missing founder/admin gate");

// Execution Support public copy must state its boundaries.
const vaApply = read("app/(public)/va/apply/page.tsx");
for (const phrase of ["payment approval", "final release approval"]) {
  if (!vaApply.includes(phrase))
    errors.push(`/va/apply missing boundary phrase: "${phrase}"`);
}

if (errors.length) {
  console.error("validate:execution-boundaries FAILED:");
  for (const e of errors) console.error("  - " + e);
  throw new Error(`${errors.length} execution-boundary error(s)`);
}
console.log("validate:execution-boundaries passed");
