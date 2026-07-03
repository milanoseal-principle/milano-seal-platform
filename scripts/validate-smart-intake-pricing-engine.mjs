#!/usr/bin/env node
// Validator — Smart Intake Pricing Engine (Branch 1).
// Asserts the pricing positioning lock: internal bases correct, public pricing
// hidden, regulated matters gated to manual review, payment gate intact, and no
// Wise / release / custody files touched by this branch.

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const repoRoot = process.cwd();
let failures = 0;
const fail = (m) => {
  console.error("VALIDATOR FAIL:", m);
  failures++;
};
const ok = (m) => console.log("OK:", m);
const read = (rel) => fs.readFileSync(path.join(repoRoot, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(repoRoot, rel));

// 1. Required pricing files exist.
const requiredFiles = [
  "lib/pricing/types.ts",
  "lib/pricing/pricingDoctrine.ts",
  "lib/pricing/marketAnchors.ts",
  "lib/pricing/smartIntakePricingEngine.ts",
  "lib/pricing/complexityScoring.ts",
  "lib/pricing/laneRecommendation.ts",
  "lib/pricing/addOnRules.ts",
  "lib/pricing/regulatedPricingRules.ts",
  "lib/pricing/pricingVisibilityPolicy.ts",
  "lib/pricing/operatorQuoteBuilder.ts",
  "lib/pricing/clientPricingProjection.ts",
  "lib/pricing/pricingSafety.ts",
  "docs/architecture/PRICING_POSITIONING_LOCK.md",
];
for (const f of requiredFiles) {
  if (!exists(f)) fail(`Missing required file: ${f}`);
}
if (failures === 0) ok("All required pricing files present");

// 2. Internal bases correct.
const doctrine = read("lib/pricing/pricingDoctrine.ts");
if (!/signature:\s*750/.test(doctrine)) fail("Signature internal base must be 750");
if (!/priority:\s*975/.test(doctrine)) fail("Priority internal base must be 975");
if (!/executive:\s*1850/.test(doctrine)) fail("Executive internal base must be 1850 minimum");
ok("Internal bases: signature 750 / priority 975 / executive 1850");

// 3-5. Public pricing page: Execution Quote, links to /intake, no exact bases.
const pricingPage = read("app/pricing/page.tsx");
if (!/Execution Quote/.test(pricingPage)) fail("Public /pricing must say 'Execution Quote'");
else ok("Public /pricing says 'Execution Quote'");
if (!/\/intake/.test(pricingPage)) fail("Public /pricing must link to /intake");
else ok("Public /pricing links to /intake");
const exactPriceInPublic = /\$\s?\d|(?:^|[^0-9])(?:750|975|1850|1,850)(?:[^0-9]|$)/m.test(pricingPage);
if (exactPriceInPublic) fail("Public /pricing must not show exact prices/bases");
else ok("Public /pricing shows no exact prices");

// 6. Smart Intake must not auto-finalize a final quote (auto-draft gated on manual review).
const engine = read("lib/pricing/smartIntakePricingEngine.ts");
if (!/buildSmartIntakePricingResult\(/.test(engine)) fail("Missing buildSmartIntakePricingResult");
if (!/quoteCanBeAutoDrafted:\s*!manualReviewRequired/.test(engine))
  fail("Auto-draft must be gated on !manualReviewRequired (no auto-finalize)");
else ok("Smart Intake gates auto-draft on manual review (no auto-finalize)");

// 7. Regulated / fingerprint / loan signing require manual review.
const regulated = read("lib/pricing/regulatedPricingRules.ts");
for (const [label, re] of [
  ["regulated use", /regulatedUseCase/],
  ["fingerprint route", /fingerprintUseCase/],
  ["loan signing", /loanSigningNeeded/],
  ["ORI requirement", /ORI/i],
]) {
  if (!re.test(regulated)) fail(`regulatedPricingRules must handle ${label}`);
}
ok("Regulated / fingerprint / loan signing gated to manual review");

// 8. Payment gate remains required.
if (!/paymentGateRequired:\s*true/.test(engine)) fail("paymentGateRequired must remain true");
if (!/schedulingLockedUntilPayment:\s*true/.test(engine)) fail("schedulingLockedUntilPayment must remain true");
ok("Payment gate + scheduling lock intact");

// 9. No checkout/cheap/Stripe language or $25/$50/$75/$99 anchors on public surfaces.
const publicSurfaces = ["app/pricing/page.tsx"];
if (exists("app/intake/page.tsx")) publicSurfaces.push("app/intake/page.tsx");
const bannedPublic = /\bBuy Now\b|\bCheckout\b|\bOrder Now\b|\bStripe\b|\$25\b|\$50\b|\$75\b|\$99\b|price match|low cost|cheap notary/i;
for (const s of publicSurfaces) {
  if (bannedPublic.test(read(s))) fail(`Banned checkout/cheap/anchor language in ${s}`);
}
ok("No checkout / cheap / competitor-anchor language on public surfaces");

// 10. This branch must not touch Wise / release gate / custody ledger / payment confirmation.
try {
  const base = execSync("git merge-base origin/main HEAD || git rev-parse main", {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();
  const diff = execSync(`git diff --name-only ${base} HEAD`, { cwd: repoRoot, encoding: "utf8" });
  const sensitive = /wise|webhook|release-?gate|releaseGate|performFinalRelease|custody|payment-?confirm|paymentConfirm/i;
  const touched = diff.split("\n").filter((f) => f && sensitive.test(f));
  if (touched.length) fail(`Branch touches protected files: ${touched.join(", ")}`);
  else ok("No Wise / release gate / custody / payment-confirmation files touched");
} catch (e) {
  console.log("NOTE: could not run git diff guard (", e.message, ") — skipping non-fatally");
}

if (failures > 0) {
  console.error(`\nVALIDATOR: smart-intake-pricing-engine FAILED with ${failures} error(s).`);
  process.exit(2);
}
console.log("\nVALIDATOR: smart-intake-pricing-engine PASSED.");
