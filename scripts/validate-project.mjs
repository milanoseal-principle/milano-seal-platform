import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const root = process.cwd();
const failures = [];

function requireFile(path) {
  if (!existsSync(join(root, path))) failures.push(`Missing required file: ${path}`);
}

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

requireFile("package.json");
requireFile("tsconfig.json");
requireFile("app/layout.tsx");
requireFile("app/page.tsx");
requireFile("docs/sop/MILANO_SEAL_OS_FULL_SYSTEM_FLOW_SOP.md");
requireFile("src/features/pricing/pricingEngine.ts");
requireFile("src/features/payments/paymentGateService.ts");
requireFile("supabase/migrations/034_milano_os_operating_spine.sql");

const productionRoots = ["app", "components", "lib", "src"].filter((path) => existsSync(join(root, path))).join(" ");
const forbiddenStrings = ["Survisure", "HVAC", "appliance", "service-contract", "service contract"];
for (const forbidden of forbiddenStrings) {
  try {
    execSync(`rg -n --fixed-strings ${JSON.stringify(forbidden)} ${productionRoots}`, { stdio: "pipe" });
    failures.push(`Forbidden production string found: ${forbidden}`);
  } catch {
    // rg exits non-zero when no matches are found.
  }
}

try {
  execSync("rg -n \"checkout\\.sessions|promotion_code|promotion_codes\" app components lib src", { stdio: "pipe" });
  failures.push("Stripe Checkout or promotion-code implementation found in production code.");
} catch {
  // Expected when no checkout/promotion code usage exists.
}

try {
  execSync("rg -n \"process\.env\.(SUPABASE_SERVICE_ROLE_KEY|WISE_API_KEY|WISE_WEBHOOK_SECRET|RESEND_API_KEY|TWILIO_AUTH_TOKEN|ANTHROPIC_API_KEY)\" components --glob '!**/*.md'", { stdio: "pipe" });
  failures.push("Server-only environment variable value referenced in client component tree.");
} catch {
  // Expected.
}

const packageJson = JSON.parse(read("package.json"));
if (!packageJson.scripts?.["validate:project"]) failures.push("Missing validate:project package script.");
if (!packageJson.scripts?.typecheck) failures.push("Missing typecheck package script.");
if (!packageJson.scripts?.["validate:intelligence"]) failures.push("Missing validate:intelligence package script.");
if (!packageJson.scripts?.["smoke:responsive"]) failures.push("Missing smoke:responsive package script.");

if (failures.length === 0) {
  try {
    execSync("node scripts/validate-country-intelligence.mjs", { stdio: "inherit" });
  } catch {
    failures.push("Country execution intelligence validation failed.");
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Milano Seal project validation passed.");
