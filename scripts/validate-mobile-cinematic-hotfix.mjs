import fs from "node:fs";
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

assertIncludes("app/pricing/page.tsx", [
  "Signature Execution",
  "24-72 Hours",
  "Priority Execution",
  "Same Day-48 Hours",
  "Executive Execution",
  "Immediate Project Coordination",
  "Coordination timelines describe Milano Seal review",
]);

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
  "useReducedMotion",
  "rotate: 360",
]);

assertIncludes("components/landing/destination-intelligence-card.tsx", [
  "w-[calc(100vw-32px)]",
  "mb-[calc(env(safe-area-inset-bottom)+7rem)]",
  "min-[480px]:grid-cols-2",
  "Mobile notarization review",
  "Florida authentication review",
  "U.S. Department of State review",
  "UAE embassy or consular review",
  "Courier delivery",
  "Consular Legalization Review",
]);

assertIncludes("components/assistant/MilanoOrbAssistant.tsx", [
  "calc(env(safe-area-inset-bottom) + 86px)",
  "right: \"16px\"",
  "width: 52",
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
const protectedChanges = changed.filter((file) => protectedPatterns.some((pattern) => pattern.test(file)));
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
