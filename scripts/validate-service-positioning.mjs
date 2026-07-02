import { readFileSync } from "node:fs";

const services = readFileSync("app/services/page.tsx", "utf8");
const required = [
  "International Document Execution",
  "U.S.-Based Apostille Coordination",
  "Remote Online Notarization",
  "Florida Mobile Notary Coordination",
  "Witness Coordination",
  "Secure Final Packet Release",
  "Built for international document control, not commodity notarization",
  "Begin Secure Intake",
  "receiving-authority review",
];

let failures = 0;
for (const phrase of required) {
  if (!services.includes(phrase)) {
    console.error(`✗ services page missing: ${phrase}`);
    failures += 1;
  }
}
if (services.includes("redirect(")) {
  console.error("✗ /services still redirects instead of rendering hierarchy page");
  failures += 1;
}
if (failures) process.exit(1);
console.log("✓ Service positioning validation passed");
