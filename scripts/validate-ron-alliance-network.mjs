import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "lib/alliance/ron/types.ts",
  "lib/alliance/ron/ronStateRegistry.ts",
  "lib/alliance/ron/ronPartnerVerification.ts",
  "lib/alliance/ron/ronDispatchRules.ts",
  "lib/alliance/ron/ronCoverageScoring.ts",
  "lib/alliance/ron/ronPartnerSafety.ts",
  "app/partners/ron-notary-alliance/page.tsx",
  "app/partners/ron-notary-alliance/apply/page.tsx",
  "app/dashboard/alliance/ron-coverage/page.tsx",
  "components/dashboard/alliance/RONCoverageMap.tsx",
  "components/dashboard/alliance/RONStateCoverageBoard.tsx",
  "components/dashboard/alliance/RONPartnerVerificationQueue.tsx",
  "components/dashboard/alliance/RONPartnerRegistry.tsx",
  "components/dashboard/alliance/RONDispatchReadiness.tsx",
  "docs/alliance/RON_ALLIANCE_COVERAGE_NETWORK.md",
  "docs/alliance/RON_PARTNER_VERIFICATION_SOP.md",
  "docs/alliance/RON_PARTNER_OUTREACH_SCRIPT.md",
  "tests/ron-alliance-network.test.ts",
];

const forbidden = [
  /federally certified RON/i,
  /nationally certified RON/i,
  /TSA certified/i,
  /guaranteed (foreign )?acceptance/i,
  /guaranteed (dispatch|income|assignments?)/i,
];

const failures = [];
for (const file of required) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) failures.push(`Missing required file: ${file}`);
}

const publicFiles = [
  "app/partners/ron-notary-alliance/page.tsx",
  "app/partners/ron-notary-alliance/apply/page.tsx",
  "app/notary/join/page.tsx",
].filter((file) => fs.existsSync(path.join(root, file)));

for (const file of publicFiles) {
  const text = fs.readFileSync(path.join(root, file), "utf8");
  for (const pattern of forbidden) {
    if (pattern.test(text)) failures.push(`${file} contains prohibited claim: ${pattern}`);
  }
  if (/RON certified/i.test(text)) failures.push(`${file} uses unsafe 'RON certified' wording`);
}

const stateRegistry = path.join(root, "lib/alliance/ron/ronStateRegistry.ts");
if (fs.existsSync(stateRegistry)) {
  const text = fs.readFileSync(stateRegistry, "utf8");
  if (!text.includes('coverageStatus: "REVIEW_REQUIRED"')) {
    failures.push("State registry must fail closed until official authority review");
  }
}

const dispatchRules = path.join(root, "lib/alliance/ron/ronDispatchRules.ts");
if (fs.existsSync(dispatchRules)) {
  const text = fs.readFileSync(dispatchRules, "utf8");
  for (const requiredGate of ["VERIFIED_AVAILABLE", "receivingAuthorityRonAccepted", "wetInkRequired", "ronAuthorized"]) {
    if (!text.includes(requiredGate)) failures.push(`Dispatch rules missing gate: ${requiredGate}`);
  }
}

const intakeApi = path.join(root, "app/api/notary/apply/route.ts");
if (fs.existsSync(intakeApi)) {
  const text = fs.readFileSync(intakeApi, "utf8");
  for (const requiredGuard of ["MAX_BODY_BYTES", "obviousSpam", "remote_online_notary_certification: false", "APPLICATION_RECEIVED"]) {
    if (!text.includes(requiredGuard)) failures.push(`Notary application API missing guard: ${requiredGuard}`);
  }
}

const operatorShell = path.join(root, "components/dashboard/OperatorShell.tsx");
if (fs.existsSync(operatorShell)) {
  const text = fs.readFileSync(operatorShell, "utf8");
  if (!text.includes("/dashboard/alliance/ron-coverage")) failures.push("Operator navigation does not expose RON Coverage command");
}

if (failures.length) {
  console.error("RON Alliance validation failed:\n" + failures.map((f) => `- ${f}`).join("\n"));
  process.exit(1);
}

console.log("RON Alliance validation passed.");
