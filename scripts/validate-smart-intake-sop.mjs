#!/usr/bin/env node
// Validator — Smart Intake SOP.
// Proves deterministic behavior and the ACTIVE /intake wiring. It fails closed
// on pricing drift, fixed-question regressions, duplicate Matter retry, privacy
// leaks, or payment/scheduling gate loss.

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const root = process.cwd();
let failures = 0;
const fail = (m) => { console.error("VALIDATOR FAIL:", m); failures++; };
const ok = (m) => console.log("OK:", m);
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(root, rel));

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

try {
  const raw = read("package.json");
  const pkg = JSON.parse(raw);
  const keys = Object.keys(pkg.scripts || {});
  const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
  if (dupes.length) fail(`duplicate package scripts: ${dupes.join(", ")}`);
  else ok("package.json valid, no duplicate scripts");
} catch (e) {
  fail(`package.json invalid: ${e.message}`);
}

const required = [
  "lib/intake/intakeInterpretation.ts",
  "lib/intake/smartClassification.ts",
  "lib/intake/intakeClarifications.ts",
  "lib/intake/operatorHandoff.ts",
  "lib/intake/intakeAnalytics.ts",
  "lib/pricing/milanoPricingTruth.ts",
  "lib/pricing/priceCanonicalMatter.ts",
  "lib/pricing/pricingProjections.ts",
  "components/intake/smart-intake-sop-wizard.tsx",
  "app/api/intake/analytics/route.ts",
];
for (const f of required) exists(f) ? ok(`present: ${f}`) : fail(`missing canonical module: ${f}`);

const symbolChecks = [
  ["lib/pricing/priceCanonicalMatter.ts", /export function priceCanonicalMatter/],
  ["lib/pricing/pricingProjections.ts", /export function projectClientPricing/],
  ["lib/intake/intakeClarifications.ts", /export function buildIntakeClarifications/],
  ["lib/intake/operatorHandoff.ts", /export function buildOperatorHandoff/],
  ["lib/intake/intakeAnalytics.ts", /INTAKE_ANALYTICS_EVENTS/],
  ["lib/pricing/milanoPricingTruth.ts", /paymentGateRequired/],
  ["lib/pricing/milanoPricingTruth.ts", /schedulingLockedUntilPayment/],
];
for (const [f, re] of symbolChecks) re.test(read(f)) ? ok(`wired: ${f} ${re}`) : fail(`not wired: ${f} ${re}`);

// Active route must use the SOP wizard, not the legacy fixed questionnaire.
const page = read("app/intake/page.tsx");
/SmartIntakeSOPWizard/.test(page) ? ok("active /intake uses SmartIntakeSOPWizard") : fail("active /intake is not wired to SmartIntakeSOPWizard");

const wizard = read("components/intake/smart-intake-sop-wizard.tsx");
/buildIntakeClarifications/.test(wizard) ? ok("live Step 2 consumes buildIntakeClarifications") : fail("live Step 2 does not consume dynamic clarifications");
/clarifications\.questions\.map/.test(wizard) ? ok("live Step 2 renders canonical questions only") : fail("live Step 2 does not render canonical question list");
// Pricing privacy: the canonical engine runs server-side behind
// /api/intake/quote-preview; the browser receives only the client projection.
const quoteBoundary = read("lib/pricing/intakeQuotePreview.ts");
/\/api\/intake\/quote-preview/.test(wizard) && /projectClientPricing/.test(quoteBoundary) ? ok("live Step 3 consumes the server-side client pricing projection") : fail("live Step 3 does not consume the server-side client pricing projection");
/priceSmartIntake/.test(quoteBoundary) && !/priceSmartIntake|projectClientPricing/.test(wizard) ? ok("live intake prices via canonical engine on the server only") : fail("live intake must price via the canonical engine on the server only");
/Tell Us What You Need/.test(wizard) && /We Understand/.test(wizard) ? ok("Matter-first Step 1 + WE UNDERSTAND present") : fail("Matter-first Step 1 or WE UNDERSTAND missing");
/Retry Upload/.test(wizard) && /retryFailedUploads/.test(wizard) ? ok("same-Matter retry UX present") : fail("upload retry UX missing");

// Retry function must use only upload endpoint; Matter creation POST must remain
// solely in submit().
const retryBody = wizard.match(/const retryFailedUploads = async \(\) => \{([\s\S]*?)\n  \};/)?.[1] || "";
if (/\/api\/intake["']/.test(retryBody)) fail("upload retry can POST /api/intake and duplicate a Matter");
else ok("upload retry never POSTs /api/intake");
if (!/matterId/.test(retryBody) || !/uploadFilesForMatter\(matterId/.test(retryBody)) fail("upload retry does not preserve existing Matter ID");
else ok("upload retry preserves Matter ID");
if (!/next\[key\] === "uploaded"\) continue/.test(wizard)) fail("successful files may be uploaded twice");
else ok("successful upload files are skipped on retry");

// No client-side lane arithmetic / copied pricing tables in intake UI.
const PRICE_TOKENS = /\b(975|1850|1,850)\b|lanePrices|pricingMap|calculateTotal|apostillePrice|rushPrice|signerPrice/;
for (const dir of ["components/intake", "app/intake"]) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) continue;
  for (const file of walk(abs)) {
    if (!/\.(tsx?|jsx?)$/.test(file)) continue;
    if (PRICE_TOKENS.test(fs.readFileSync(file, "utf8"))) fail(`hard-coded pricing/lane logic in intake UI: ${path.relative(root, file)}`);
  }
}
ok("no copied lane-price table / price arithmetic in intake UI");

// Analytics vocabulary + privacy contract.
const analytics = read("lib/intake/intakeAnalytics.ts");
for (const event of [
  "intake_started", "description_completed", "document_uploaded", "analysis_completed", "analysis_corrected",
  "clarification_requested", "clarification_completed", "step_1_completed", "step_2_completed", "review_viewed",
  "review_edited", "intake_submitted", "intake_abandoned", "intake_error", "upload_failed",
  "upload_retry_started", "upload_retry_completed",
]) {
  if (!analytics.includes(`"${event}"`)) fail(`analytics event missing: ${event}`);
}
ok("required Smart Intake analytics vocabulary present");
if (/rawDescription|documentText|ssn|passport|token/.test(analytics)) fail("analytics safe contract includes sensitive/raw keys");
else ok("analytics safe metadata contract excludes raw/private keys");
if (!/\.catch\(\(\) => undefined\)/.test(wizard) || !/Observational only\. Never block intake/.test(wizard)) fail("analytics is not explicitly non-blocking in live intake");
else ok("analytics is non-blocking in live intake");

// Dynamic engine guarantees <=3 questions for standard matters and conditional
// origin/signer location logic.
const clarifier = read("lib/intake/intakeClarifications.ts");
/questions\.slice\(0, 3\)/.test(clarifier) ? ok("standard clarification list capped at 3") : fail("standard clarification cap <=3 missing");
/ORIGIN_DRIVEN_FAMILIES/.test(clarifier) ? ok("document origin is conditional") : fail("origin conditional logic missing");
/executionNeedsSigner/.test(clarifier) ? ok("signer location is execution-conditional") : fail("signer-location conditional logic missing");

// Structured correction must outrank text/AI, including already-completed
// notarization resolution from live contradiction questions.
const classifier = read("lib/intake/smartClassification.ts");
/notarization\?: boolean \| "already_completed"/.test(classifier) && /s\.notarization/.test(classifier)
  ? ok("structured notarization correction has canonical precedence")
  : fail("structured notarization correction precedence missing");

for (const dir of ["lib/intake", "lib/pricing", "components/intake", "app/intake"]) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) continue;
  for (const file of walk(abs)) {
    const src = fs.readFileSync(file, "utf8");
    if (/^(<{7}|={7}|>{7})/m.test(src)) fail(`conflict markers in ${path.relative(root, file)}`);
  }
}
ok("no conflict markers in Smart Intake scope");

const testGlobs = [
  "lib/intake/__tests__/intakeInterpretation.test.ts",
  "lib/intake/__tests__/smartClassification.test.ts",
  "lib/intake/__tests__/smartClassificationStructured.test.ts",
  "lib/intake/__tests__/intakeClarifications.test.ts",
  "lib/intake/__tests__/operatorHandoff.test.ts",
  "lib/intake/__tests__/intakeAnalytics.test.ts",
  "lib/intake/__tests__/intakeCorrectness.test.ts",
  "lib/pricing/__tests__/milanoPricingTruth.test.ts",
  "lib/pricing/__tests__/priceCanonicalMatter.test.ts",
  "lib/pricing/__tests__/pricingProjections.test.ts",
].filter(exists);

try {
  execSync(`node --import tsx --test ${testGlobs.join(" ")}`, { cwd: root, stdio: "pipe" });
  ok(`behavioral fixtures passed (${testGlobs.length} suites)`);
} catch (e) {
  fail(`behavioral fixtures failed:\n${(e.stdout || e.message || "").toString().slice(-2000)}`);
}

if (failures) {
  console.error(`\nVALIDATOR: smart-intake-sop FAILED (${failures} failure${failures > 1 ? "s" : ""}).`);
  process.exit(1);
}
console.log("\nVALIDATOR: smart-intake-sop PASSED.");
