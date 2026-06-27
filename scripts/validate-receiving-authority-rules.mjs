import { readFileSync, existsSync } from "fs";
import { join } from "path";
const root = process.cwd();
const failures = [];
function read(path) { return readFileSync(join(root, path), "utf8"); }
const path = "data/receiving-authority-requirements.ts";
if (!existsSync(join(root, path))) failures.push("Missing receiving-authority requirements registry.");
const source = existsSync(join(root, path)) ? read(path) : "";
const requiredAuthorityTypes = [
  "foreign_court", "civil_registry", "comune", "bank", "university", "immigration_authority", "customs_authority", "corporate_registry", "real_estate_registry", "maritime_registry", "equine_registry", "gemstone_lab", "auction_house", "insurance_carrier", "consulate", "private_buyer", "private_seller", "foreign_counsel", "unknown",
];
for (const authorityType of requiredAuthorityTypes) {
  if (!source.includes(`"${authorityType}"`)) failures.push(`Missing authority type: ${authorityType}`);
}
for (const field of ["publicSummary", "questionsToAskClient", "ronAcceptanceRisk", "wetInkRisk", "translationRisk"]) {
  if (!source.includes(`${field}:`)) failures.push(`Missing receiving-authority field: ${field}`);
}
if (!source.includes("RECEIVING_AUTHORITY_REQUIREMENTS")) failures.push("Missing RECEIVING_AUTHORITY_REQUIREMENTS export.");
if (!source.includes("DESTINATIONS.flatMap")) failures.push("Receiving authority requirements must derive from canonical destinations.");
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log("Receiving-authority rules validation passed.");
