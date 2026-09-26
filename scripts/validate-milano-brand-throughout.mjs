import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const BRAND_NAME = "The Milano Seal™";
const TAGLINE = "SEALING TRUST IN EVERY SIGNATURE";
const POSITIONING = "International Document Execution & Apostille Coordination";
const BRAND_PROMISE = "Sealing Trust in Every Signature";
const ORB = "/brand/milano-seal-orb-v2.png";

const requiredFiles = [
  "app/theme/milanoBrand.ts",
  "app/styles/milano-theme.css",
  "components/landing/header.tsx",
  "components/landing/footer.tsx",
  "components/os/MilanoOSShell.tsx",
  "components/dashboard/OperatorShell.tsx",
  "components/portal/portal-shell.tsx",
  "components/va/VAWorkspaceShell.tsx",
  "components/alliance/AllianceShell.tsx",
  "scripts/validate-milano-os-isolation.mjs",
  "scripts/validate-milano-os-surface-unification.mjs",
].filter((file) => existsSync(file));

for (const file of requiredFiles) {
  assert.ok(existsSync(file), `Missing required Milano brand surface file: ${file}`);
}

const brand = readFileSync("app/theme/milanoBrand.ts", "utf8");
const theme = readFileSync("app/styles/milano-theme.css", "utf8");
const header = readFileSync("components/landing/header.tsx", "utf8");
const footer = readFileSync("components/landing/footer.tsx", "utf8");
const shell = readFileSync("components/os/MilanoOSShell.tsx", "utf8");
const operator = readFileSync("components/dashboard/OperatorShell.tsx", "utf8");
const portal = readFileSync("components/portal/portal-shell.tsx", "utf8");
const va = readFileSync("components/va/VAWorkspaceShell.tsx", "utf8");
const alliance = readFileSync("components/alliance/AllianceShell.tsx", "utf8");
const mergeGate = readFileSync("scripts/run-vercel-merge-gate.mjs", "utf8");

assert.ok(brand.includes(`name: \"${BRAND_NAME}\"`), "Canonical brand name drifted");
assert.ok(brand.includes(`tagline: \"${TAGLINE}\"`), "Canonical tagline drifted");
assert.ok(brand.includes(`positioning: \"${POSITIONING}\"`), "Canonical positioning drifted");
assert.ok(brand.includes(`brandPromise: \"${BRAND_PROMISE}\"`), "Canonical brand promise drifted");
assert.ok(brand.includes('milanoGold: "#C6A65B"'), "Canonical Milano Gold drifted");
assert.ok(brand.includes('matteBlack: "#0A0A0A"'), "Canonical Archive Black drifted");
assert.ok(brand.includes('ivoryParchment: "#F6F1E6"'), "Canonical Embassy Parchment drifted");

for (const [label, source] of [["header", header], ["footer", footer]]) {
  assert.ok(source.includes('MILANO_BRAND'), `${label} must bind to canonical MILANO_BRAND tokens`);
  assert.ok(source.includes(ORB), `${label} must use the canonical Milano Seal orb asset`);
  assert.ok(source.includes('var(--ms-gold)'), `${label} must use canonical Milano gold CSS token`);
}

assert.ok(/(?:(?:sm|md|lg|xl|2xl):hidden|min-\[\d+px\]:hidden)/.test(header), "Public header must retain responsive mobile navigation behavior");
assert.ok(header.includes('isMobileMenuOpen'), "Public header must retain mobile menu state");
assert.ok(header.includes('aria-controls="milano-mobile-navigation"'), "Public header must retain accessible mobile menu control wiring");
assert.ok(header.includes('id="milano-mobile-navigation"'), "Public header must retain the mobile navigation target");
assert.ok(header.includes('t.header.intake'), "Public header must bind primary CTA to canonical public translation dictionary");
const publicDictionary = readFileSync("lib/i18n/public-dictionary.ts", "utf8");
assert.ok(publicDictionary.includes('intake: "Begin Secure Intake"'), "Canonical English intake CTA must remain defined in public dictionary");
assert.ok(header.includes('CredentialTicker'), "Public header must retain trust ticker");

assert.ok(footer.includes('MILANO_BRAND.positioning'), "Footer must render canonical positioning from brand source");
assert.ok(footer.includes('MILANO_BRAND.brandPromise'), "Footer must render canonical brand promise from brand source");
assert.ok(!/Sealing trust with\s+every signature/i.test(footer), "Legacy footer tagline wording is prohibited");
assert.ok(footer.includes('t.footer.disclaimer'), "Footer must bind legal/compliance boundary to governed public dictionary");
assert.ok(
  publicDictionary.includes('The Milano Seal is not a law firm and does not provide legal advice or legal representation.'),
  "Canonical English non-law-firm and legal-advice boundary must remain defined in governed public dictionary",
);
assert.ok(footer.includes('flex flex-col md:flex-row'), "Footer must retain responsive mobile/desktop layout");

for (const mode of ["operator", "client", "va", "alliance"]) {
  assert.ok(shell.includes(`\"${mode}\"`), `Authenticated Milano OS shell missing ${mode} mode`);
}
assert.ok(shell.includes(BRAND_NAME), "Authenticated shell must visibly identify The Milano Seal™");
assert.ok(shell.includes('ms-os-mobile-drawer'), "Authenticated shell must retain mobile drawer");
assert.ok(shell.includes('lg:hidden'), "Authenticated shell must retain responsive mobile controls");
assert.ok(shell.includes('useReducedMotion'), "Authenticated shell must retain accessibility motion behavior");

for (const [label, source] of [
  ["operator", operator],
  ["client", portal],
  ["va", va],
  ["alliance", alliance],
]) {
  assert.ok(source.includes('@/components/os/MilanoOSShell'), `${label} route family must use shared Milano OS shell`);
}

assert.ok(theme.includes('--ms-milano-gold'), "Canonical theme must expose Milano gold token");
assert.ok(theme.includes('--ms-matte-black'), "Canonical theme must expose Archive Black token");

const roots = ["app", "components", "styles"];
const activeFiles = [];
function walk(root) {
  if (!existsSync(root)) return;
  for (const name of readdirSync(root)) {
    const path = join(root, name);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (["node_modules", ".next", "coverage"].includes(name)) continue;
      walk(path);
    } else if (/\.(tsx?|jsx?|css)$/.test(name)) {
      activeFiles.push(path);
    }
  }
}
roots.forEach(walk);

const reducedMotionSources = activeFiles
  .map((file) => readFileSync(file, "utf8"))
  .filter((source) => source.includes("prefers-reduced-motion: reduce"));
assert.ok(
  shell.includes("useReducedMotion") && reducedMotionSources.length > 0,
  "Canonical visual system must retain both component and CSS reduced-motion safety",
);

const foreignBrandPatterns = [
  /\bLiaison\s+OS\b/i,
  /\bEnsureProtect\b/i,
  /\bDemesmin\s*(?:&|and)\s*Dover\b/i,
];

for (const file of activeFiles) {
  const source = readFileSync(file, "utf8");
  for (const pattern of foreignBrandPatterns) {
    assert.ok(!pattern.test(source), `Foreign brand contamination in active UI: ${relative(process.cwd(), file)}`);
  }
}

for (const requiredGate of [
  "validate-milano-os-isolation.mjs",
  "validate-milano-os-surface-unification.mjs",
  "validate:cinematic-route-coverage",
  "validate:responsive-safety",
  "validate:final-mobile-cosmetic-pass",
]) {
  assert.ok(mergeGate.includes(requiredGate), `Production merge gate lost required route/mobile brand dependency: ${requiredGate}`);
}

console.log(
  `PASS Milano brand throughout: public header/footer, canonical identity/tokens, all authenticated shells, mobile behavior, active UI isolation, route coverage and responsive gates are locked to ${BRAND_NAME}`,
);
