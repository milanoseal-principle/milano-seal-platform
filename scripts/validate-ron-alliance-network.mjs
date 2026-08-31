import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "lib/alliance/ron/types.ts",
  "lib/alliance/ron/ronStateRegistry.ts",
  "lib/alliance/ron/ronPartnerVerification.ts",
  "lib/alliance/ron/ronDispatchRules.ts",
  "lib/alliance/ron/ronCoverageScoring.ts",
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
].filter((file) => fs.existsSync(path.join(root, file)));

for (const file of publicFiles) {
  const text = fs.readFileSync(path.join(root, file), "utf8");
  for (const pattern of forbidden) {
    if (pattern.test(text)) failures.push(`${file} contains prohibited claim: ${pattern}`);
  }
}

const joinPath = path.join(root, "app/notary/join/page.tsx");
if (fs.existsSync(joinPath)) {
  const text = fs.readFileSync(joinPath, "utf8");
  if (/RON certified/i.test(text)) failures.push("Legacy /notary/join still uses unsafe 'RON certified' wording");
}

if (failures.length) {
  console.error("RON Alliance validation failed:\n" + failures.map((f) => `- ${f}`).join("\n"));
  process.exit(1);
}

console.log("RON Alliance validation passed.");
