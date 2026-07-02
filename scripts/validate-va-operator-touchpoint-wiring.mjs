import fs from "node:fs";

const requiredFiles = [
  "lib/access/operatorAccessPolicy.ts",
  "docs/audits/VA_OPERATOR_TOUCHPOINT_WIRING_AUDIT.md",
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);
}

const policy = fs.readFileSync("lib/access/operatorAccessPolicy.ts", "utf8");
const audit = fs.readFileSync("docs/audits/VA_OPERATOR_TOUCHPOINT_WIRING_AUDIT.md", "utf8");

const requiredPolicyTerms = [
  "VA_ALLOWED_ACTIONS",
  "VA_BLOCKED_ACTIONS",
  "FOUNDER_ADMIN_ONLY_ACTIONS",
  "confirm_payment",
  "mark_paid",
  "approve_release",
  "wise_reconciliation",
  "edit_payment_webhook",
  "edit_supabase_policies",
  "manage_environment_variables",
  "partial",
];

for (const term of requiredPolicyTerms) {
  if (!policy.includes(term)) throw new Error(`Missing policy term: ${term}`);
}

for (const term of ["Status: PARTIAL", "without rewriting auth", "VA blocked actions", "Founder/admin only actions"]) {
  if (!audit.includes(term)) throw new Error(`Missing audit term: ${term}`);
}

console.log("VA/operator touchpoint wiring validator passed.");
