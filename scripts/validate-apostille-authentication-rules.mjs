import { existsSync, readFileSync } from "node:fs";

const engine = "lib/apostille-rules/apostilleRoutingEngine.ts";
const maxRules = "lib/apostille-rules/maxDocumentSubmissionRules.ts";
for (const f of [engine, maxRules]) {
  if (!existsSync(f)) {
    console.error(`FAIL missing ${f}`);
    process.exit(2);
  }
}

const src = readFileSync(engine, "utf8");
const maxSrc = readFileSync(maxRules, "utf8");

let failures = 0;

// federal documents route to federal authentication
if (!src.includes("federal_authentication")) {
  console.error("FAIL federal documents must route to federal_authentication");
  failures += 1;
}

// unknown => manual_review
if (!(src.includes('documentAuthority === "unknown"') && src.includes("manual_review"))) {
  console.error("FAIL unknown authority must route to manual_review");
  failures += 1;
}
if (!src.includes("requiresManualReview = true")) {
  console.error("FAIL routing engine must set manual review for unknowns");
  failures += 1;
}

// no max submission limit without sourceUrl
if (!(maxSrc.includes("sourceUrl") && maxSrc.includes("manualReviewRequired"))) {
  console.error("FAIL max submission rules must gate on sourceUrl -> manual review");
  failures += 1;
}
if (!/MAX_SUBMISSION_RULES[^=]*=\s*\[\s*\]/.test(maxSrc)) {
  console.error("FAIL max submission seed must be empty (no fabricated limits)");
  failures += 1;
}

if (failures) {
  console.error(`FAIL apostille-authentication-rules: ${failures} issue(s)`);
  process.exit(2);
}
console.log("OK apostille-authentication-rules");
