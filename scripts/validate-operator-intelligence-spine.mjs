import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  "lib/operator-spine/types.ts",
  "lib/operator-spine/todayExecutionMode.ts",
  "lib/operator-spine/weeklyExecutionPlanner.ts",
  "lib/operator-spine/matterActivityLedger.ts",
  "lib/operator-spine/executionRoutePlans.ts",
  "lib/operator-spine/revenueLedger.ts",
  "lib/operator-spine/privateRelationshipIntel.ts",
  "lib/operator-spine/partnerMemory.ts",
  "lib/operator-spine/executionHeatmap.ts",
  "lib/operator-spine/aiWeeklyPlanner.ts",
  "lib/operator-spine/endOfDayCloseout.ts",
  "lib/operator-spine/operatorVoiceNotes.ts",
  "lib/operator-spine/operatorSpineRegistry.ts",
  "lib/operator-spine/operatorSpineSafety.ts",
  "app/dashboard/operator-spine/page.tsx",
  "docs/architecture/OPERATOR_INTELLIGENCE_SPINE.md",
  "docs/audits/OPERATOR_INTELLIGENCE_SPINE_EXTRACTION_AUDIT.md",
];
const allowedBlockedTermFiles = new Set([
  "docs/audits/OPERATOR_INTELLIGENCE_SPINE_EXTRACTION_AUDIT.md",
  "lib/operator-spine/operatorSpineSafety.ts",
  "scripts/validate-operator-intelligence-spine.mjs",
]);
const blockedTerms = ["PIP", "Demesmin", "Dover", "claimant", "carrier", "DOL", "provider BD", "personal injury", "accident attorney", "medical-legal"];
const forbiddenImplementationPaths = [/^app\/api\/webhooks?\/wise\//, /^app\/api\/webhook\/wise\//, /^app\/api\/deals\/.*payment/, /^app\/api\/deals\/.*release/, /^lib\/wise\//, /^lib\/custody\//, /^supabase\/migrations\//, /^lib\/bluenotary\//, /^lib\/shippo\//];
const failures = [];
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing required file: ${file}`);
}

const page = read("app/dashboard/operator-spine/page.tsx");
if (!page.includes("OperatorSpineShell")) failures.push("Dashboard route does not render OperatorSpineShell.");
if (!page.includes("index: false")) failures.push("Dashboard route must be noindex/internal-only.");

const shell = read("components/operator-spine/OperatorSpineShell.tsx");
if (!shell.includes("pb-[calc(2rem+env(safe-area-inset-bottom))]")) failures.push("Mobile safe-area padding is missing.");
const background = read("components/operator-spine/CinematicSpineBackground.tsx");
if (!background.includes("motion-safe")) failures.push("Reduced motion guard is missing from cinematic background.");

const fakePatterns = [/fake live data/i, /fake revenue totals/i, /fake matter counts/i];
const uiFiles = listFiles("app/dashboard/operator-spine", /\.tsx$/).concat(listFiles("components/operator-spine", /\.tsx$/));
for (const file of uiFiles) {
  const text = read(file);
  for (const term of blockedTerms) {
    if (new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(text)) failures.push(`Blocked source term appears in UI: ${term} in ${file}`);
  }
  if (/live GPS/i.test(text)) failures.push(`Forbidden live GPS language in ${file}`);
}

const publicFiles = listFiles("app", /\.(tsx?|md)$/).filter((file) => !file.startsWith("app/dashboard/") && !file.startsWith("app/api/") && !file.startsWith("app/va/") && !file.startsWith("app/portal/"));
for (const file of publicFiles) {
  const text = read(file);
  if (/operator-spine|operatorSpine/i.test(text)) failures.push(`Public route imports or references operator spine: ${file}`);
  for (const term of ["Demesmin", "Dover", "provider BD", "personal injury", "accident attorney", "medical-legal", "claimant"]) {
    if (new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(text)) failures.push(`Blocked source term appears in public route: ${term} in ${file}`);
  }
}

const packageJson = JSON.parse(read("package.json"));
const packageText = read("package.json");
if (packageText.toLowerCase().includes("liaison")) failures.push("package.json contains forbidden source-system dependency text.");
if (packageJson.scripts?.["validate:operator-intelligence-spine"] !== "node scripts/validate-operator-intelligence-spine.mjs") failures.push("package.json is missing validate:operator-intelligence-spine script.");

const operatorSourceFiles = [
  ...listFiles("lib/operator-spine", /\.(ts|tsx)$/),
  ...listFiles("components/operator-spine", /\.(ts|tsx)$/),
  ...listFiles("app/dashboard/operator-spine", /\.(ts|tsx)$/),
];

for (const file of operatorSourceFiles) {
  const text = read(file);
  for (const pattern of forbiddenImplementationPaths) {
    const sourcePrefix = pattern.source
      .replace(/^\^/, "")
      .replace(/\\\//g, "/")
      .replace(/\.\*/g, "")
      .replace(/\$/, "");
    if (!sourcePrefix) continue;

    const importPattern = new RegExp(
      String.raw`(?:from\s+["']@?/?${sourcePrefix}|import\s*\(["']@?/?${sourcePrefix}|require\s*\(["']@?/?${sourcePrefix})`,
      "i",
    );
    if (importPattern.test(text)) {
      failures.push(`Operator Spine must not import forbidden implementation area: ${file} → ${sourcePrefix}`);
    }
  }
}

if (failures.length) {
  console.error("Operator Intelligence Spine validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Operator Intelligence Spine validation passed.");

function listFiles(dir, pattern) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) return [];
  const out = [];
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name).replaceAll(path.sep, "/");
    if (entry.isDirectory()) out.push(...listFiles(rel, pattern));
    else if (pattern.test(rel)) out.push(rel);
  }
  return out;
}
