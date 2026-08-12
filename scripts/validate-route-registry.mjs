import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const registryPath = path.join(root, "lib/routes/routeRegistry.ts");
const docsPath = path.join(root, "docs/architecture/ROUTE_REGISTRY.md");

if (!fs.existsSync(registryPath)) failures.push("Missing lib/routes/routeRegistry.ts");
if (!fs.existsSync(docsPath)) failures.push("Missing docs/architecture/ROUTE_REGISTRY.md");

const registry = fs.existsSync(registryPath) ? fs.readFileSync(registryPath, "utf8") : "";
const docs = fs.existsSync(docsPath) ? fs.readFileSync(docsPath, "utf8") : "";

for (const phrase of ["PUBLIC_LIVE_ROUTES", "INTERNAL_DASHBOARD_ROUTES", "STAGED_AUTHORITY_ROUTES", "FUTURE_PROGRAMMATIC_ENGINE", 'status: "staged_only"', "targetPageCount: 2400"]) {
  if (!registry.includes(phrase)) failures.push(`Route registry missing: ${phrase}`);
}
if (!/function isProgrammaticAllowed\(\): boolean \{\s*return false;\s*\}/m.test(registry)) failures.push("isProgrammaticAllowed must return false");

const publicRoutes = [
  "/",
  "/pricing",
  "/secure-portal",
  "/intake",
  "/intake/confirmation",
  "/map",
  "/apostille/italy",
  "/apostille/brazil",
  "/international-affidavits",
  "/international-affidavit",
  "/power-of-attorney-international",
  "/affidavit-name-discrepancy",
  "/affidavit-one-and-the-same",
  "/affidavit-non-existence-record",
  "/affidavit-translation-accuracy",
];
const internalRoutes = ["/dashboard", "/dashboard/command-center", "/dashboard/discounts", "/dashboard/referrals", "/dashboard/seo-authority", "/dashboard/compliance-atlas", "/dashboard/operator-terminal", "/dashboard/invoices", "/dashboard/intelligence/sales-lab"];
const stagedRoutes = ["/fbi-apostille", "/international-notary", "/remote-online-notary"];

for (const route of publicRoutes) {
  if (!registry.includes(`"${route}"`)) failures.push(`Missing public live route: ${route}`);
}
for (const route of [...internalRoutes, ...stagedRoutes]) {
  if (!registry.includes(`"${route}"`)) failures.push(`Missing noindex route: ${route}`);
}
if (!registry.includes("return [...PUBLIC_LIVE_ROUTES]")) failures.push("Sitemap does not return only public live routes");
if (!registry.includes("return [...INTERNAL_DASHBOARD_ROUTES, ...STAGED_AUTHORITY_ROUTES]")) failures.push("Noindex routes do not include internal + staged routes");

for (const phrase of ["Live public routes", "Internal dashboard routes", "Staged authority routes", "Future programmatic SEO rules", "Sitemap logic", "Noindex rules", "Do not create 2400 pages", "International Affidavit Library"]) {
  if (!docs.includes(phrase)) failures.push(`Route registry docs missing: ${phrase}`);
}

const code = collectFiles(["app", "components", "lib", "scripts"]).filter((file) => !file.endsWith("scripts/validate-route-registry.mjs") && !file.endsWith("lib/routes/routeRegistry.ts") && !file.endsWith("lib/seo/phaseAuthority.ts") && !file.endsWith("lib/canonical/milanoLocks.ts") && !file.endsWith("scripts/validate-canonical-locks.mjs") && !file.endsWith("scripts/validate-seo-phase-authority.mjs")).map((file) => fs.readFileSync(file, "utf8")).join("\n");
if (/generateStaticParams[\s\S]{0,160}2400|targetPageCount[\s:=]+2400(?!,)|Array\.from\(\{ length: 2400 \}/.test(code)) failures.push("Code appears to generate 2400 routes");

const changed = getChangedFiles();
const blocked = [/^supabase\//, /^lib\/wise/, /^app\/api\/webhooks\/wise/, /^app\/api\/webhook\/wise/, /^app\/api\/deals\/.*payment/, /^app\/api\/deals\/.*release/, /^src\/features\/payments\//, /^src\/features\/release\//, /^src\/features\/ledger\//, /custody/i];
for (const file of changed) {
  if (blocked.some((pattern) => pattern.test(file))) failures.push(`Blocked scope file changed: ${file}`);
}

if (failures.length) {
  console.error("Route registry validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Route registry validation passed.");

function collectFiles(targets) {
  const files = [];
  for (const target of targets) {
    const abs = path.join(root, target);
    if (!fs.existsSync(abs)) continue;
    if (fs.statSync(abs).isDirectory()) files.push(...walk(abs));
    else files.push(abs);
  }
  return files.filter((file) => /\.(tsx|ts|jsx|js|mjs)$/.test(file));
}
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
