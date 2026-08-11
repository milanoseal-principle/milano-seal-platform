import { existsSync, readFileSync } from "node:fs";

const required = [
  "lib/canonical/milanoLocks.ts",
  "lib/motion/milano-motion.ts",
  "lib/motion/use-milano-reduced-motion.ts",
  "components/motion/CinematicPageShell.tsx",
  "components/motion/SectionReveal.tsx",
  "components/founder/FounderCommandCenter.tsx",
  "components/portal/portal-context.tsx",
  "scripts/run-tests.mjs",
];
for (const file of required) {
  if (!existsSync(file)) throw new Error(`Missing canonical foundation file: ${file}`);
}

const layout = readFileSync("app/layout.tsx", "utf8");
if (!layout.includes("CinematicPageShell")) throw new Error("Root cinematic shell is disconnected");

const motion = readFileSync("lib/motion/milano-motion.ts", "utf8");
for (const token of ["instant", "fast", "standard", "deliberate", "cinematic"]) {
  if (!motion.includes(token)) throw new Error(`Missing motion token: ${token}`);
}

const founderMatches = [...new Set([
  "components/founder/FounderCommandCenter.tsx",
].filter(existsSync))];
if (founderMatches.length !== 1) throw new Error("Founder Command must have one canonical component");

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
for (const script of ["test", "validate:canonical-locks", "validate:production-governance"]) {
  if (!packageJson.scripts?.[script]) throw new Error(`Missing canonical package script: ${script}`);
}

console.log("Canonical foundation validation passed.");
