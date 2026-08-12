import { existsSync, readFileSync } from "node:fs";

const required = [
  "lib/motion/milano-motion.ts",
  "lib/motion/use-milano-reduced-motion.ts",
  "components/motion/CinematicPageShell.tsx",
  "components/motion/SectionReveal.tsx",
  "components/ui/premium-states.tsx",
];
for (const file of required) {
  if (!existsSync(file)) throw new Error(`Missing cinematic UI file: ${file}`);
}
const tokens = readFileSync("lib/motion/milano-motion.ts", "utf8");
for (const value of ["instant", "fast", "standard", "deliberate", "cinematic", "enter", "exit"]) {
  if (!tokens.includes(value)) throw new Error(`Missing canonical motion token: ${value}`);
}
const layout = readFileSync("app/layout.tsx", "utf8");
if (!layout.includes("CinematicPageShell")) throw new Error("Canonical page transition is not connected");
const home = readFileSync("app/page.tsx", "utf8");
if (!home.includes("SectionReveal")) throw new Error("Homepage section reveals are not connected");
const css = readFileSync("app/globals.css", "utf8");
for (const rule of ["prefers-reduced-motion: reduce", "focus-visible", "min-height: 44px", "--ms-gold-primary"]) {
  if (!css.includes(rule)) throw new Error(`Missing accessibility or design rule: ${rule}`);
}
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
if (packageJson.scripts["validate:cinematic-ui-system"] !== "node scripts/validate-cinematic-ui-system.mjs") {
  throw new Error("Cinematic validator package script is invalid");
}
console.log("Cinematic UI system validation passed.");
