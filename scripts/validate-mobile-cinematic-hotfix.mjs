import fs from "node:fs";
import { P5_PROTECTED_CHANGES } from "./governed-production-scope.mjs";
import { execSync } from "node:child_process";

const read = (file) => fs.readFileSync(file, "utf8");
const assertIncludes = (file, terms) => {
  const text = read(file);
  for (const term of terms) {
    if (!text.includes(term)) {
      console.error(`${file} missing required term: ${term}`);
      process.exit(1);
    }
  }
};

const pricing = read("app/pricing/page.tsx");
assertIncludes("app/pricing/page.tsx", ["<ExecutionTiers", "Payment-Gated Execution"]);
assertIncludes("components/landing/execution-tiers.tsx", [
  'name: "Signature"', 'name: "Priority"', 'name: "Executive"',
  "not self-selected service packages", "do not create fixed completion promises",
]);
if (/24[–-]72 hour coordination target|Same day[–-]48 hour coordination target/i.test(pricing)) {
  console.error("Public pricing must not promise fixed execution targets before governed review");
  process.exit(1);
}

assertIncludes("components/home/MiniCorridorMapPreview.tsx", [
  "Atlas Corridor Preview",
  "Open Atlas",
  "href=\"/map\"",
  "h-[170px]",
  "max-h-[210px]",
  "animateMotion",
]);

assertIncludes("components/landing/milano-trust-core.tsx", [
  "MOBILE_TRUST_PRINCIPLES",
  "International document matters require more than a signature",
  "Secure Intake",
  "Global Document Intelligence",
  "Payment-Gated Scheduling",
  "Chain-of-Custody Visibility",
  "useMilanoReducedMotion",
  "rotate: 360",
]);

assertIncludes("components/landing/destination-intelligence-card.tsx", [
  "w-[calc(100vw-32px)]",
  "mb-[calc(env(safe-area-inset-bottom)+7rem)]",
  "min-[480px]:grid-cols-2",
  "getPublicCountryExecutionIntelligence",
  "governed.publicExecutionPath",
  "ExecutionComplianceBoundary",
]);

assertIncludes("components/assistant/MilanoOrbAssistant.tsx", [
  "calc(env(safe-area-inset-bottom) + 86px)",
  "right: \"16px\"",
  "h-[72px] w-[72px]",
  'aria-label="Open Milano AI Assistant"',
  "focus-visible:ring-2",
]);

assertIncludes("components/landing/credential-ticker.tsx", [
  "ms-credential-ticker",
  "w-max",
  "overflow-hidden",
]);

assertIncludes("app/globals.css", [
  "max-width: 100%",
  "overflow-x: hidden",
  "ms-credential-ticker",
  "mask-image: linear-gradient",
  "prefers-reduced-motion",
  "ms-logo-orbital-shimmer",
]);

const packageJson = JSON.parse(read("package.json"));
if (packageJson.scripts?.["validate:mobile-cinematic-hotfix"] !== "node scripts/validate-mobile-cinematic-hotfix.mjs") {
  console.error("package.json missing validate:mobile-cinematic-hotfix script");
  process.exit(1);
}

const changed = execSync("git diff --name-only HEAD", { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
const protectedPatterns = [/wise/i, /payment/i, /release/i, /custody/i, /supabase/i, /shippo/i, /bluenotary/i, /webhook/i, /rls/i];
const protectedChanges = changed.filter((file) => !P5_PROTECTED_CHANGES.includes(file) && protectedPatterns.some((pattern) => pattern.test(file)));
if (protectedChanges.length) {
  console.error(`Protected systems changed:\n${protectedChanges.join("\n")}`);
  process.exit(1);
}

const publicFiles = [
  "app/pricing/page.tsx",
  "components/home/MiniCorridorMapPreview.tsx",
  "components/landing/milano-trust-core.tsx",
  "components/landing/destination-intelligence-card.tsx",
];
for (const file of publicFiles) {
  const text = read(file);
  if (/guaranteed acceptance/i.test(text) || /government approved/i.test(text)) {
    console.error(`Unsafe public claim found in ${file}`);
    process.exit(1);
  }
}

console.log("Mobile cinematic hotfix validation passed.");
