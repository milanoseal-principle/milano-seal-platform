import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const ACTIVE_OPERATIONAL_DOCS = [
  "DEPLOY_CHECKLIST.md",
  "PRINCE_HANDOFF.md",
  "docs/vercel-env-production.md",
  "docs/ops/ENVIRONMENT_WIRING_AUDIT.md",
  "docs/FINAL_PRODUCTION_CERTIFICATION.md",
  "docs/CI_BILLING_INDEPENDENT_GATE.md",
];

const SUPERSEDED_OPERATIONAL_DOCS = [
  "docs/v2026-production-build-directive.md",
];

const PROHIBITED_ACTIVE_ARCHITECTURE = [
  { label: "Stripe secret-key environment variable", pattern: /\bSTRIPE_SECRET_KEY\b/i },
  { label: "Stripe webhook-secret environment variable", pattern: /\bSTRIPE_WEBHOOK_SECRET\b/i },
  { label: "Stripe publishable-key environment variable", pattern: /\bNEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY\b/i },
  { label: "Stripe payment webhook route", pattern: /\/api\/webhooks?\/stripe\b/i },
  { label: "Stripe checkout-session event", pattern: /\bcheckout\.session\.completed\b/i },
  { label: "active Stripe checkout instruction", pattern: /\bstripe\s+(?:checkout|webhook|payment|session)\b/i },
];

for (const file of ACTIVE_OPERATIONAL_DOCS) {
  assert.ok(existsSync(file), `Active operational documentation missing: ${file}`);
  const content = readFileSync(file, "utf8");

  for (const prohibited of PROHIBITED_ACTIVE_ARCHITECTURE) {
    assert.ok(!prohibited.pattern.test(content), `${file} contains prohibited ${prohibited.label}`);
  }
}

for (const file of SUPERSEDED_OPERATIONAL_DOCS) {
  assert.ok(existsSync(file), `Superseded operational documentation missing: ${file}`);
  const content = readFileSync(file, "utf8");
  assert.ok(
    content.includes("HISTORICAL / SUPERSEDED"),
    `${file} must be explicitly marked historical/superseded so it cannot override live architecture`,
  );
}

const deploy = readFileSync("DEPLOY_CHECKLIST.md", "utf8");
const requiredDeployTruth = [
  "Wise Business only",
  "/api/webhooks/wise",
  "WISE_ENV=production",
  "WISE_API_TOKEN",
  "WISE_PROFILE_ID",
  "WISE_WEBHOOK_ALLOWED_TEST=false",
  "TIFFTEST99",
  "DAMIANI50",
  "GO / NO-GO",
  "node scripts/generate-route-map.mjs --check",
  "Milano Operator Intelligence",
];

for (const required of requiredDeployTruth) {
  assert.ok(
    deploy.includes(required),
    `DEPLOY_CHECKLIST.md missing canonical production truth: ${required}`,
  );
}

assert.ok(
  !/manual payment confirmation/i.test(deploy),
  "DEPLOY_CHECKLIST.md must not authorize manual payment confirmation",
);

assert.ok(
  deploy.includes("A successful build does not transaction-certify production."),
  "Deployment documentation must preserve the live acceptance boundary",
);

const envDoc = readFileSync("docs/vercel-env-production.md", "utf8");
assert.ok(envDoc.includes("WISE_ENV=production"), "Vercel env doc must declare Wise production mode");
assert.ok(envDoc.includes("WISE_WEBHOOK_ALLOWED_TEST=false"), "Vercel env doc must block Wise test notifications in production");
assert.ok(!/^WISE_WEBHOOK_SECRET=/m.test(envDoc), "Wise shared secret must not be documented as a required production variable");

console.log(
  `PASS Wise-only active operational documentation (${ACTIVE_OPERATIONAL_DOCS.length} files)`,
);
