import fs from "node:fs";

const failures = [];
const doc = fs.readFileSync("docs/ops/ENVIRONMENT_WIRING_AUDIT.md", "utf8");

for (const text of [
  "DEPLOYMENT_WIRING = INJECTED",
  "PAYMENT_WIRING = WISE_ONLY",
  "OPERATOR_INTELLIGENCE = READ_ONLY",
  "TRANSACTION_CERTIFICATION = LIVE_ACCEPTANCE_REQUIRED",
  "Production branch: `main`",
  "Generated production-critical route registry",
  "WISE_ENV=production",
  "WISE_API_TOKEN",
  "WISE_PROFILE_ID",
  "WISE_WEBHOOK_ALLOWED_TEST=false",
  "/api/webhooks/wise",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "Scheduling remains payment-gated",
  "TIFF real 15-step client-to-close acceptance",
  "Damiani production dry-run with no payment",
  "GO / NO-GO",
]) {
  if (!doc.includes(text)) failures.push(`audit missing ${text}`);
}

for (const file of [
  "package.json",
  "lib/routes/routeRegistry.ts",
  "lib/canonical/milanoLocks.ts",
  "app/api/webhooks/bluenotary/route.ts",
  "app/api/webhooks/wise/route.ts",
  "lib/operator-intelligence/read-model.ts",
  "app/api/dashboard/operator-intelligence/route.ts",
]) {
  if (!fs.existsSync(file)) failures.push(`missing ${file}`);
}

if (/\bSTRIPE_(?:SECRET_KEY|WEBHOOK_SECRET)\b/i.test(doc)) {
  failures.push("active environment audit contains retired payment-provider variables");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Final wiring confirmation validation passed.");
