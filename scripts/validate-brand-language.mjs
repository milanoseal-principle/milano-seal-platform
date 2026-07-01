import { readFileSync } from "node:fs";

const publicFiles = [
  "app/page.tsx",
  "components/landing/hero.tsx",
  "components/landing/milano-trust-core.tsx",
  "components/landing/homepage-routing-preview.tsx",
  "components/landing/destination-intelligence-card.tsx",
  "components/conversion/MilanoPublicCtaModule.tsx",
  "app/services/page.tsx",
];

let failures = 0;
const read = (file) => readFileSync(file, "utf8");
const combined = publicFiles.map((file) => `${file}\n${read(file)}`).join("\n");

const forbidden = [
  "International Notary, Apostille & Document Execution",
  "Notarize From Anywhere",
  "Notarize from Anywhere",
  "Start Controlled Intake",
];

for (const phrase of forbidden) {
  if (combined.includes(phrase)) {
    console.error(`✗ forbidden public copy remains: ${phrase}`);
    failures += 1;
  }
}

const page = read("app/page.tsx");
if (!page.includes("The Milano Seal™ | International Document Execution & Apostille Coordination")) {
  console.error("✗ homepage metadata title is not brand-aligned");
  failures += 1;
}
if (!page.includes("International Document Execution, Apostille Coordination, Remote Online Notarization")) {
  console.error("✗ homepage metadata description is missing required positioning");
  failures += 1;
}

const hero = read("components/landing/hero.tsx");
if (!hero.includes("Remote Online\\nNotarization")) {
  console.error("✗ hero RON label missing eligible RON language");
  failures += 1;
}
if (!hero.includes("RON availability depends on document type, signer location, jurisdiction, and receiving-authority requirements.")) {
  console.error("✗ hero RON support boundary missing");
  failures += 1;
}

const trust = read("components/landing/milano-trust-core.tsx");
const trustCoreCount = (trust.match(/Milano Trust Core/g) ?? []).length;
if (trustCoreCount !== 1) {
  console.error(`✗ expected one Milano Trust Core label, found ${trustCoreCount}`);
  failures += 1;
}
if (/font-serif[^>]*>\s*M\s*</s.test(trust) || />\s*M\s*</.test(trust)) {
  console.error("✗ plain text M remains in Trust Core medallion");
  failures += 1;
}
if (!trust.includes("/milano-seal-core-brain-feather.png")) {
  console.error("✗ Trust Core medallion asset not used");
  failures += 1;
}

if (failures) process.exit(1);
console.log("✓ Brand language validation passed");
