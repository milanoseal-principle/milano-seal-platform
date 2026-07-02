import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  "lib/internal/moduleRegistry.ts",
  "lib/internal/moduleHealth.ts",
  "components/dashboard/InternalModuleGrid.tsx",
];
const requiredHrefs = [
  "/dashboard/command-center",
  "/dashboard/discounts",
  "/dashboard/referrals",
  "/dashboard/seo-authority",
  "/dashboard/compliance-atlas",
  "/dashboard/operator-terminal",
  "/dashboard/invoices",
  "/dashboard/intelligence/sales-lab",
];
const failures = [];
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing required file: ${file}`);
}

const registry = read("lib/internal/moduleRegistry.ts");
const health = read("lib/internal/moduleHealth.ts");
const shell = read("components/dashboard/milano-shell.tsx");
const dashboard = read("app/dashboard/page.tsx");

for (const href of requiredHrefs) {
  if (!registry.includes(`href: "${href}"`)) failures.push(`Registry missing href: ${href}`);
  if (!shell.includes(href) && !dashboard.includes(href)) failures.push(`Dashboard nav or home missing href: ${href}`);
}

if (!registry.includes('id: "motion_preview"') || !registry.includes('status: "staged_only"')) failures.push("Motion preview is not staged_only");
for (const label of ["Discount Control", "Invoice Studio"]) {
  const labelIndex = registry.indexOf(`label: "${label}"`);
  if (labelIndex === -1) {
    failures.push(`Missing payment-sensitive module: ${label}`);
    continue;
  }
  const block = registry.slice(labelIndex, registry.indexOf("},", labelIndex) + 2);
  if (!block.includes('riskLevel: "payment_sensitive"')) failures.push(`${label} is not marked payment_sensitive`);
}

for (const fn of ["getInternalModules", "getModulesBySection", "getVisibleInternalModules", "getStagedModules", "getModuleByHref", "getModuleStatusLabel", "getModuleRiskLabel"]) {
  if (!health.includes(`function ${fn}`)) failures.push(`Missing module health helper: ${fn}`);
}

const publicRoots = ["app/(public)", "app/about", "app/alliance", "app/apostille", "app/founder", "app/intake", "app/map", "app/page.tsx", "app/pricing", "app/services", "components/landing", "components/conversion", "components/portal"];
for (const rootPath of publicRoots) {
  const abs = path.join(root, rootPath);
  if (!fs.existsSync(abs)) continue;
  const files = fs.statSync(abs).isDirectory() ? walk(abs) : [abs];
  for (const file of files) {
    if (!/\.(tsx|ts|jsx|js)$/.test(file)) continue;
    const rel = path.relative(root, file);
    const content = fs.readFileSync(file, "utf8");
    if (content.includes("@/lib/internal/moduleRegistry") || content.includes("@/lib/internal/moduleHealth") || content.includes("lib/internal/moduleRegistry") || content.includes("lib/internal/moduleHealth")) {
      failures.push(`Public route imports internal registry: ${rel}`);
    }
  }
}

const changed = getChangedFiles();
const blocked = [
  /^supabase\//,
  /^lib\/wise/,
  /^app\/api\/webhooks\/wise/,
  /^app\/api\/webhook\/wise/,
  /^app\/api\/admin\/matters\/.*confirm-payment/,
  /^app\/api\/deals\/.*payment/,
  /^app\/api\/deals\/.*release/,
  /^src\/features\/release\//,
  /^src\/features\/payments\//,
  /^src\/features\/ledger\//,
  /custody/i,
];
for (const file of changed) {
  if (blocked.some((pattern) => pattern.test(file))) failures.push(`Blocked scope file changed: ${file}`);
}

if (failures.length) {
  console.error("Internal module registry validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Internal module registry validation passed.");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return full;
  });
}

function getChangedFiles() {
  const env = process.env.VALIDATE_CHANGED_FILES;
  if (env) return env.split("\n").filter(Boolean);
  return [];
}
