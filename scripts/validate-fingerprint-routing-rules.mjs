import { existsSync, readFileSync } from "node:fs";

const engine = "lib/fingerprinting/fingerprintRoutingEngine.ts";
if (!existsSync(engine)) {
  console.error(`FAIL missing ${engine}`);
  process.exit(2);
}
const src = readFileSync(engine, "utf8");

let failures = 0;
const mustInclude = [
  // ORI missing => manual review + blocked submission
  "requiresManualReview = true",
  "canTransmit = false",
  "Agency instructions / ORI required before submission",
  // FBI identity history not a substitute
  "not a substitute for an employment/licensing background check",
  // firearms + immigration disclaimers
  "does not provide firearms advice",
  "does not provide immigration advice",
];
for (const phrase of mustInclude) {
  if (!src.includes(phrase)) {
    console.error(`FAIL routing engine missing rule text: ${phrase}`);
    failures += 1;
  }
}

// unknown use case must trigger manual review
if (!(src.includes('useCase === "unknown"') && src.includes("requiresManualReview"))) {
  console.error("FAIL unknown use case must route to manual review");
  failures += 1;
}

if (failures) {
  console.error(`FAIL fingerprint-routing-rules: ${failures} issue(s)`);
  process.exit(2);
}
console.log("OK fingerprint-routing-rules");
