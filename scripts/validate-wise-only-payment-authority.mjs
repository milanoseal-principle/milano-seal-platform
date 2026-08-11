import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
if (packageJson.dependencies?.stripe || packageJson.devDependencies?.stripe) {
  throw new Error("Prohibited payment processor dependency found");
}

const activeFiles = [
  "lib/email.ts",
  "app/api/deals/[id]/route.ts",
  "app/api/deals/[id]/payment/route.ts",
  "components/dashboard/deal-detail-actions.tsx",
  "app/api/health/webhooks/route.ts",
  "app/dashboard/invoices/page.tsx",
  "app/dashboard/admin/validate/page.jsx",
  "components/dashboard/modules/credentials.tsx",
  "components/dashboard/modules/ideas.tsx",
  "scripts/002_os_migration.sql",
];
for (const file of activeFiles) {
  const text = readFileSync(file, "utf8");
  if (/stripe/i.test(text)) throw new Error(`Prohibited active payment reference: ${file}`);
}

const paymentRoute = readFileSync("app/api/deals/[id]/payment/route.ts", "utf8");
if (!paymentRoute.includes('const VALID_METHODS = ["wise"]')) {
  throw new Error("Deal payment endpoint must accept Wise only");
}

const tombstone = readFileSync("app/api/webhook/stripe/route.ts", "utf8");
for (const required of ["status: 410", "permanently retired", "performs no mutation"]) {
  if (!tombstone.includes(required)) throw new Error(`Retired webhook tombstone missing: ${required}`);
}
if (/re-introduce|fallback|payment confirmation logic/i.test(tombstone)) {
  throw new Error("Retired webhook suggests a future or fallback payment path");
}

const doctrine = readFileSync("docs/architecture/WISE_ONLY_PAYMENT_AUTHORITY.md", "utf8");
for (const required of ["Wise is the sole payment authority", "There is no alternate processor", "does not create a payment"]) {
  if (!doctrine.includes(required)) throw new Error(`Payment doctrine missing: ${required}`);
}

console.log("Wise-only payment authority validation passed.");
