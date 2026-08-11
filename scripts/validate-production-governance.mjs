import { existsSync, readFileSync } from "node:fs";

const read = (file) => readFileSync(file, "utf8");
const required = [
  "lib/payments/complimentary-server.ts",
  "lib/scheduling/complimentarySchedulingGate.ts",
  "app/api/deals/[id]/payment/route.ts",
  "app/api/webhook/wise/route.ts",
  "app/api/webhook/stripe/route.ts",
  "supabase/migrations/043_complimentary_matter_authorizations.sql",
];
for (const file of required) {
  if (!existsSync(file)) throw new Error(`Missing governed production file: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
if (packageJson.dependencies?.stripe || packageJson.devDependencies?.stripe) {
  throw new Error("Retired payment dependency is prohibited");
}

const paymentRoute = read("app/api/deals/[id]/payment/route.ts");
if (!paymentRoute.includes('const VALID_METHODS = ["wise"]')) {
  throw new Error("Normal payment route must remain Wise-only");
}

const compServer = read("lib/payments/complimentary-server.ts");
if (/meta\.role|meta\.permissions/.test(compServer)) {
  throw new Error("User-editable metadata cannot grant complimentary authority");
}
for (const invariant of [
  "amount_paid: 0",
  "verified_revenue: 0",
  "wise_payment_id: null",
  "wise_transfer_id: null",
  "payment_confirmed_at: null",
]) {
  if (!compServer.includes(invariant)) throw new Error(`Missing complimentary invariant: ${invariant}`);
}

const scheduling = read("lib/scheduling/complimentarySchedulingGate.ts");
for (const method of ["verified_payment", "complimentary_authorization", "not_satisfied"]) {
  if (!scheduling.includes(method)) throw new Error(`Missing scheduling method: ${method}`);
}

const tombstone = read("app/api/webhook/stripe/route.ts");
if (!tombstone.includes("status: 410") || !tombstone.includes("performs no mutation")) {
  throw new Error("Retired webhook must remain a non-mutating 410 tombstone");
}

console.log("Production governance validation passed.");
