#!/usr/bin/env node
/**
 * check-integration-configuration — reports whether Wise, Shippo, and BlueNotary
 * are CONFIGURED, using environment-variable PRESENCE only. It never prints
 * secret values, never makes a live/destructive call, and never claims "live" —
 * only "Configured" (present) / "Missing configuration" / "Manual verification
 * required". Production activation still requires webhook + signed test events.
 */

function present(name) {
  const v = process.env[name];
  return typeof v === "string" && v.trim().length > 0;
}

const PROVIDERS = [
  {
    name: "WISE",
    required: ["NEXT_PUBLIC_WISE_HANDLE"],
    optional: ["NEXT_PUBLIC_WISE_BUSINESS_URL"],
  },
  {
    name: "SHIPPO",
    required: ["SHIPPO_API_KEY"],
    optional: ["SHIPPO_API_VERSION", "SHIPPO_DEFAULT_RETURN_COUNTRY"],
  },
  {
    name: "BLUENOTARY",
    required: ["BLUENOTARY_API_KEY", "BLUENOTARY_BASE_URL"],
    optional: ["BLUENOTARY_WEBHOOK_SECRET"],
  },
];

console.log("\nIntegration configuration check (presence only — no secrets printed)\n");

let anyMissing = false;
for (const p of PROVIDERS) {
  const missingRequired = p.required.filter((k) => !present(k));
  const optionalMissing = p.optional.filter((k) => !present(k));
  let status;
  if (missingRequired.length === 0) {
    status = optionalMissing.length ? "Configured · manual verification required (webhook/signed test event)" : "Configured · manual verification required";
  } else {
    status = "Missing configuration";
    anyMissing = true;
  }
  console.log(`  ${p.name}: ${status}`);
  if (missingRequired.length) console.log(`     missing required keys: ${missingRequired.join(", ")}`);
}

console.log(
  "\nNOTE: 'Configured' means the required environment keys are present. It does NOT mean the\n" +
  "integration is verified live. Production activation requires webhook endpoints, signature\n" +
  "verification, an approved provider-originated test event, and recorded sign-off.\n",
);

// Presence check is informational; do not fail CI purely on missing local env.
process.exit(0);
void anyMissing;
