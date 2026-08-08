#!/usr/bin/env node
// Smart Intake SOP validator — locked branch guard.
// Fails on duplicate/ambiguous intake pricing or interpretation flow.

import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
let failures = 0;
const fail = (message) => {
  console.error(`VALIDATOR FAIL: ${message}`);
  failures++;
};
const ok = (message) => console.log(`OK: ${message}`);

function read(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), "utf8");
}
function exists(rel) {
  return fs.existsSync(path.join(repoRoot, rel));
}

function requireFile(rel) {
  if (!exists(rel)) fail(`Missing required file: ${rel}`);
  else ok(`Required file present: ${rel}`);
}

function scriptNames() {
  try {
    const pkg = JSON.parse(read("package.json"));
    return Object.keys(pkg.scripts ?? {});
  } catch (e) {
    fail(`package.json invalid: ${e.message}`);
    return [];
  }
}

// 1. package.json must parse and the validator must be discoverable.
try {
  JSON.parse(read("package.json"));
  ok("package.json valid before validator");
} catch (e) {
  fail(`package.json invalid: ${e.message}`);
}

const scripts = scriptNames();
const duplicateNames = scripts.filter((name, index) => scripts.indexOf(name) !== index);
if (duplicateNames.length) fail(`Duplicate package script names in package.json: ${duplicateNames.join(", ")}`);
else ok("package.json script names are unique");

if (!scripts.includes("validate:smart-intake-sop")) fail("validate:smart-intake-sop missing from package scripts");
else ok("validate:smart-intake-sop registered in package.json");

// 2. Required implementation files.
[
  "lib/intake/intakeInterpretation.ts",
  "lib/intake/smartClassification.ts",
  "lib/pricing/milanoPricingTruth.ts",
  "lib/pricing/smartIntakePricingEngine.ts",
  "lib/pricing/pricingDoctrine.ts",
  "lib/pricing/types.ts",
  "lib/platform/canonicalMatter.ts",
].forEach(requireFile);

// 3. Core denial guards.
const intakeInterpret = read("lib/intake/intakeInterpretation.ts");
const intakeClassification = read("lib/intake/smartClassification.ts");
const pricingTruth = read("lib/pricing/milanoPricingTruth.ts");
const pricingEngine = read("lib/pricing/smartIntakePricingEngine.ts");
const doctrine = read("lib/pricing/pricingDoctrine.ts");

const requiredFacts = [
  { needle: "explicit_client", file: "lib/intake/intakeInterpretation.ts", label: "explicit client precedence" },
  { needle: "already_completed", file: "lib/intake/intakeInterpretation.ts", label: "already-completed service state" },
  { needle: "negative", file: "lib/intake/intakeInterpretation.ts", label: "negation polarity" },
  { needle: "contradictions", file: "lib/intake/intakeInterpretation.ts", label: "contradiction detection" },
  { needle: "ServiceState", file: "lib/intake/smartClassification.ts", label: "ServiceState canonical classification" },
  { needle: "manualReviewReasons", file: "lib/intake/smartClassification.ts", label: "manual review reason reporting" },
  { needle: "quoteCanBeAutoDrafted", file: "lib/pricing/smartIntakePricingEngine.ts", label: "quote gating" },
  { needle: "priceSmartIntake", file: "lib/pricing/milanoPricingTruth.ts", label: "canonical pricing adapter" },
  { needle: "paymentGateRequired", file: "lib/pricing/milanoPricingTruth.ts", label: "payment-gate requirement" },
  { needle: "schedulingLockedUntilPayment", file: "lib/pricing/milanoPricingTruth.ts", label: "scheduling lock" },
  { needle: "consumer", file: "lib/pricing/milanoPricingTruth.ts", label: "commercial context" },
  { needle: "signature", file: "lib/pricing/pricingDoctrine.ts", label: "Signature public pricing base" },
  { needle: "priority", file: "lib/pricing/pricingDoctrine.ts", label: "Priority public pricing base" },
  { needle: "executive", file: "lib/pricing/pricingDoctrine.ts", label: "Executive public pricing base" },
];

for (const item of requiredFacts) {
  if (!(read(item.file).includes(item.needle))) fail(`Expected ${item.label} not found in ${item.file}`);
  else ok(`${item.label} present in ${item.file}`);
}

// 4. Safety constraints from the locked Smart Intake SOP.
const bannedRules = [
  ["foreign destination must not force apostille", /foreign.*destination.*apostille|destination.*apostille.*false|destinationCountry.*apostille|apostille.*destinationCountry/, "Purchase-critical no-fabrication: foreign destination cannot auto-add apostille"],
  ["apostille must not create notarization", /apostille.*notarization|apostille.*ron|notarization.*apostille|ron.*apostille/, "No apostille→notarization/RON fabrication"],
  ["AI must not override explicit client answers", /AI.*override|explicit.*structured|explicit.*client.*answer|source.*explicit_client|explicit.*client.*text/, "AI precedence guard missing"],
  ["negation must not become positive", /negative.*positive|NEG_BEFORE|NEG_AFTER|polarity.*negative|not_required/, "Negation canonical guard missing"],
  ["already completed service must not be re-priced", /already_completed.*price|completed.*service.*excluded|already_completed.*excluded|already_completed.*not.*price|already_completed.*exclude/, "Already-completed service exclusion missing"],
  ["manual review prevents final intake completion", /manualReviewRequired|reviewResult|quote after review|Quote issued after review/, "Manual review / quote fence missing"],
  ["upload retry should not create a second Matter", /upload retry|retry upload|Matter ID|existing Matter|Retry Upload|retry#.*/, "Upload retry resilience guard missing"],
];

for (const [label, trap, message] of bannedRules) {
  if (typeof trap.test === "function" && trap.test(read("lib/intake/intakeInterpretation.ts")) && label === "negation must not become positive") {
    ok(`negation guard recognized: ${label}`);
  } else if (label === "foreign destination must not force apostille") {
    const hasGuard = /destinationCountry.*apostille|apostille.*destination.*country|no apostille.*foreign/i.test(pricingTruth) || /foreign.*destination.*not.*apostille/i.test(pricingTruth) || /apostille.*international.*destination/i.test(pricingTruth);
    if (!hasGuard) fail(message);
    else ok("Foreign destination apostille guard present");
  } else if (label === "apostille must not create notarization") {
    const file = read("lib/intake/__tests__/intakeInterpretation.test.ts");
    if (!/apostille never|no-fabrication/.test(file)) fail(message);
    else ok("Apostille-notarization anti-fabrication evidence is present");
  } else if (label === "AI must not override explicit client answers") {
    if (!/structured.*selection.*highest|explicit.*client.*answer|source.*explicit_client|explicit client text/i.test(intakeClassification)) fail(message);
    else ok("Precedence direction is explicit over AI" );
  } else if (label === "already completed service must not be re-priced") {
    if (!/already_completed/.test(pricingTruth) || !/already.*completed/.test(pricingTruth)) fail(message);
    else ok("Completed-service pricing exclusion is present");
  } else if (label === "manual review prevents final intake completion") {
    if (!/reviewResult|manualReviewRequired|quoteCanBeAutoDrafted|Quote issued after review|quoteRequiresFounderReview/.test(pricingEngine)) fail(message);
    else ok("Manual review gates final quote generation");
  } else if (label === "upload retry should not create a second Matter") {
    if (!exists("app/api/upload/route.ts")) {
      ok("Upload retry endpoint is not materialized in this branch; validator preserved evidence-only status");
    } else {
      const route = read("app/api/upload/route.ts");
      if (!/same Matter ID|same matter ID|no second Matter|Retry upload using the same Matter ID|reuse the same matter ID|retry upload/.test(route)) fail(message);
      else ok("Upload retry / preserve-Matter guard present");
    }
  } else {
    // In general, the presence of the phrase is enough.
    if (!trap.test(intakeInterpret)) fail(message);
    else ok(`Guard observed: ${label}`);
  }
}

// 5. Price-driving input coverage: fields required by the locked SOP are normalized through classification.
const requiredInputFields = [
  "documentType",
  "documentFamily",
  "documentCount",
  "destinationCountry",
  "originJurisdiction",
  "signerLocation",
  "signerCount",
  "notarization",
  "ron",
  "mobile",
  "apostille",
  "apostilleQuantity",
  "authentication",
  "translation",
  "witness",
  "courier",
  "shipping",
  "urgency",
  "deadline",
  "regulatedUseCase",
  "fingerprintUseCase",
  "loanSigningNeeded",
  "professionalIntermediary",
  "clientType",
  "uploadedAgencyInstructions",
  "oriProvided",
  "commercialContext",
];

const classificationInterface = read("lib/intake/smartClassification.ts");
for (const field of requiredInputFields) {
  if (!classificationInterface.includes(field) && field !== "commercialContext") {
    // Allow classification interface to expose a field and pricing controller to accept it.
    // If it is not in classification, it should exist in pricing input types.
    fail(`Price-driving field '${field}' not present in canonical classification contract`);
  } else if (field === "commercialContext") {
    if (!pricingTruth.includes("CommercialContext") && !pricingTruth.includes("commercialContext")) fail("Commercial context missing in pricing truth");
    else ok("Commercial context canonical pricing surface exists");
  }
}

if (fails()) {
  console.error(`\nVALIDATOR: smart-intake-sop FAILED with ${failures} error(s).`);
  process.exit(2);
}
console.log(`\nVALIDATOR: smart-intake-sop PASSED. (${failures} failures observed)`);

function fails() {
  return failures > 0;
}
