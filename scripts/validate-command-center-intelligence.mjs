import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  "lib/command-center/types.ts",
  "lib/command-center/status.ts",
  "lib/command-center/pricingIntelligence.ts",
  "lib/command-center/dealLogic.ts",
  "lib/command-center/revenueIntelligence.ts",
  "lib/command-center/clientIntelligence.ts",
  "lib/command-center/reviewFlow.ts",
  "lib/command-center/scriptLibrary.ts",
  "lib/command-center/seoSocial.ts",
  "app/dashboard/command-center/page.tsx",
];

const failures = [];
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing required file: ${file}`);
}

const nav = read("lib/dashboard-modules.ts");
if (!nav.includes('route: "command-center"')) failures.push("Dashboard nav does not include /dashboard/command-center");

const pricing = read("app/pricing/page.tsx");
const forbiddenPricePatterns = [/\$\s?(750|975|1850|150|250|400|500|750)\b/, /priceLabel/i];
for (const pattern of forbiddenPricePatterns) {
  if (pattern.test(pricing)) failures.push(`Public /pricing exposes exact internal price signal: ${pattern}`);
}

const publicFiles = [
  "app/page.tsx",
  "app/pricing/page.tsx",
  "app/services/page.tsx",
  "components/conversion/MilanoPublicCtaModule.tsx",
  "components/landing/hero.tsx",
  "components/landing/destination-intelligence-card.tsx",
  "components/landing/homepage-routing-preview.tsx",
];
const forbiddenPublic = [
  "TIFFANYTEST",
  "TIFFANY100",
  "100% off",
  "free coupon",
  "payment bypass",
  "Stripe",
  "guaranteed acceptance",
  "government approved",
  "legal advice",
];
for (const file of publicFiles) {
  if (!fs.existsSync(path.join(root, file))) continue;
  const content = read(file);
  for (const phrase of forbiddenPublic) {
    if (content.toLowerCase().includes(phrase.toLowerCase())) failures.push(`${file} exposes forbidden public phrase: ${phrase}`);
  }
}

const commandCenter = read("app/dashboard/command-center/page.tsx");
if (/live data|live metrics/i.test(commandCenter) && !/connect(ed)? to live backend|live backend records/i.test(commandCenter)) {
  failures.push("Command Center implies live metrics without a live backend qualifier");
}
if (!commandCenter.includes("Payment Gate Status") || !commandCenter.includes("ENFORCED")) failures.push("Command Center missing enforced payment gate status");
if (commandCenter.includes("Stripe")) failures.push("Command Center must not expose Stripe status");
if (!commandCenter.includes("Wise-first payment flow")) failures.push("Command Center missing Wise-first payment provider copy");

const changed = process.env.VALIDATE_CHANGED_FILES?.split("\n").filter(Boolean) ?? [];
const blocked = [
  /^supabase\//,
  /^lib\/wise/,
  /^app\/api\/webhooks\/wise/,
  /^src\/features\/release\//,
  /^src\/features\/payments\//,
  /^src\/features\/ledger\//,
  /^app\/api\/deals\/.*payment/,
  /^app\/api\/deals\/.*release/,
];
for (const file of changed) {
  if (blocked.some((pattern) => pattern.test(file))) failures.push(`Blocked file changed for command center scope: ${file}`);
}

if (failures.length) {
  console.error("Command Center intelligence validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Command Center intelligence validation passed.");
