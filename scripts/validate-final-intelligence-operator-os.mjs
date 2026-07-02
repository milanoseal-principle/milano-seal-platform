import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
const root = process.cwd();
const required = [
  "lib/operator-spine/types.ts", "lib/operator-spine/operatorSpineRegistry.ts", "app/dashboard/operator-spine/page.tsx", "components/operator-spine/OperatorSpineShell.tsx",
  "lib/packaging-delivery/types.ts", "lib/packaging-delivery/finalPacketOrder.ts", "lib/packaging-delivery/printSpecs.ts", "lib/packaging-delivery/dhlReleaseChecklist.ts", "lib/packaging-delivery/packagingDeliverySafety.ts", "lib/packaging-delivery/packagingDeliveryRegistry.ts",
  "app/dashboard/packaging-delivery/page.tsx", "components/packaging-delivery/PackagingDeliveryShell.tsx", "components/packaging-delivery/FinalPacketOrderPanel.tsx", "components/packaging-delivery/PrintSpecPanel.tsx", "components/packaging-delivery/DhlReleaseChecklistPanel.tsx", "components/packaging-delivery/PackagingSafetyPanel.tsx",
  "lib/website-alignment/publicCopyGuard.ts", "lib/website-alignment/claimSafety.ts", "lib/website-alignment/ctaPolicy.ts", "lib/website-alignment/pricingVisibilityPolicy.ts", "lib/website-alignment/websiteAlignmentRegistry.ts",
  "docs/architecture/FINAL_INTELLIGENCE_OPERATOR_OS.md", "docs/audits/FINAL_INTELLIGENCE_OPERATOR_OS_EXTRACTION_AUDIT.md"
];
const failures = [];
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
for (const file of required) if (!fs.existsSync(path.join(root, file))) failures.push(`Missing required file: ${file}`);
const operatorPage = read("app/dashboard/operator-spine/page.tsx");
const packagePage = read("app/dashboard/packaging-delivery/page.tsx");
if (!operatorPage.includes("index: false")) failures.push("Operator spine route must be noindex.");
if (!packagePage.includes("index: false")) failures.push("Packaging delivery route must be noindex.");
if (!read("lib/packaging-delivery/finalPacketOrder.ts").includes("gold_slip")) failures.push("Packet order missing gold slip.");
if (!read("lib/packaging-delivery/printSpecs.ts").includes("100_percent")) failures.push("Print specs missing 100 percent scale lock.");
if (!read("lib/packaging-delivery/dhlReleaseChecklist.ts").includes("drop-before-cutoff")) failures.push("DHL release checklist missing cutoff step.");
if (!read("components/operator-spine/CinematicSpineBackground.tsx").includes("motion-safe")) failures.push("Reduced motion guard missing from operator cinematic background.");
const uiFiles = files("app/dashboard/operator-spine", /\.tsx$/).concat(files("components/operator-spine", /\.tsx$/), files("app/dashboard/packaging-delivery", /\.tsx$/), files("components/packaging-delivery", /\.tsx$/));
for (const file of uiFiles) {
  const text = read(file);
  if (/fake revenue|fake matter|fake client|System Live|SEO 21 LIVE|Hague compliant|guaranteed acceptance|live GPS/i.test(text)) failures.push(`Unsafe UI language in ${file}`);
}
const publicFiles = files("app", /\.(tsx?|md)$/).filter((file) => !file.startsWith("app/dashboard/") && !file.startsWith("app/api/") && !file.startsWith("app/portal/") && !file.startsWith("app/va/"));
for (const file of publicFiles) {
  const text = read(file);
  if (/operator-spine|packaging-delivery|PackagingDeliveryShell|OperatorSpineShell/i.test(text)) failures.push(`Public route references internal module: ${file}`);
}
const pkg = JSON.parse(read("package.json"));
if (pkg.dependencies?.mapbox || pkg.dependencies?.["mapbox-gl"]) failures.push("Mapbox dependency was added.");
for (const script of ["validate:final-intelligence-operator-os", "validate:public-copy-safety"]) if (!pkg.scripts?.[script]) failures.push(`Missing package script: ${script}`);
const changed = changedFiles();
const forbidden = [/^package-lock\.json$/, /^pnpm-lock\.yaml$/, /^supabase\/migrations\//, /^lib\/wise\//, /^lib\/custody\//, /^lib\/bluenotary\//, /^lib\/shippo\//, /^app\/api\/webhooks?\/wise\//, /^app\/api\/webhook\/wise\//, /^app\/api\/deals\/.*payment/, /^app\/api\/deals\/.*release/];
for (const file of changed) if (forbidden.some((pattern) => pattern.test(file))) failures.push(`Forbidden file changed: ${file}`);
if (failures.length) { console.error("Final Intelligence Operator OS validation failed:"); failures.forEach((failure) => console.error(`- ${failure}`)); process.exit(1); }
console.log("Final Intelligence Operator OS validation passed.");
function files(dir, pattern) { const full = path.join(root, dir); if (!fs.existsSync(full)) return []; return fs.readdirSync(full, { withFileTypes: true }).flatMap((entry) => { const rel = path.join(dir, entry.name).replaceAll(path.sep, "/"); return entry.isDirectory() ? files(rel, pattern) : pattern.test(rel) ? [rel] : []; }); }
function changedFiles() { try { return execSync("git diff --name-only HEAD -- .", { encoding: "utf8" }).split("\n").filter(Boolean); } catch { return []; } }
