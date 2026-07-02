import fs from "node:fs";

const requiredFiles = [
  "lib/access/gateMatrix.ts",
  "docs/audits/CROSS_SYSTEM_GATE_CONFIRMATION.md",
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);
}

const matrix = fs.readFileSync("lib/access/gateMatrix.ts", "utf8");
const doc = fs.readFileSync("docs/audits/CROSS_SYSTEM_GATE_CONFIRMATION.md", "utf8");

const requiredTerms = [
  "EXECUTION_CHAIN",
  "CROSS_SYSTEM_GATES",
  "Intake Gate",
  "Quote Gate",
  "Payment Gate",
  "Scheduling Gate",
  "BlueNotary / RON Gate",
  "Mobile Notary Gate",
  "Apostille Gate",
  "Courier / Custody Gate",
  "Paid & Released Gate",
  "Review Request Gate",
  "payment_confirmed",
  "paid_comped",
  "BlueNotary completion does not auto-release packet",
  "No fake reviews or stars",
];

for (const term of requiredTerms) {
  if (!matrix.includes(term) && !doc.includes(term)) throw new Error(`Missing gate term: ${term}`);
}

if (!matrix.includes("canSchedule") || !matrix.includes("canRenderPaidAndReleased")) {
  throw new Error("Missing gate helper functions");
}

console.log("Cross-system gate validator passed.");
