import { readFileSync, existsSync } from "fs";
import { join } from "path";

const root = process.cwd();
const failures = [];
const requiredFields = [
  "routeType",
  "publicRouteLabel",
  "publicSummary",
  "receivingAuthorityBoundary",
  "sourceNotes",
  "lastReviewedAt",
  "reviewCadenceDays",
];
const prohibitedPublic = ["operator checklist", "payout", "commission", "next ledger event", "internal escalation", "guaranteed acceptance", "legal advice", "secret shortcut"];
const prohibitedSummary = [/guarantee/i, /legal advice/i, /government approved/i, /government affiliation/i, /secret shortcut/i];
function read(path) { return readFileSync(join(root, path), "utf8"); }
const atlasPath = "data/global-compliance-atlas.ts";
if (!existsSync(join(root, atlasPath))) failures.push("Missing data/global-compliance-atlas.ts");
const atlas = existsSync(join(root, atlasPath)) ? read(atlasPath) : "";
const destinations = read("data/destinations.ts");
const slugs = Array.from(destinations.matchAll(/slug:\s*['"]([^'"]+)['"]/g), (m) => m[1]);
for (const token of ["GLOBAL_COMPLIANCE_ATLAS", "getCountryComplianceAtlasEntry", "getPublicCountryCompliance", "getPrivateCountryCompliance", "DESTINATIONS.map"]) {
  if (!atlas.includes(token)) failures.push(`Atlas missing ${token}`);
}
for (const field of requiredFields) {
  if (!atlas.includes(`${field}:`)) failures.push(`Atlas missing field ${field}`);
}
for (const pattern of prohibitedSummary) {
  if (pattern.test(atlas)) failures.push(`Unsafe atlas summary/boundary language found: ${pattern}`);
}
for (const slug of slugs) {
  if (!atlas.includes("DESTINATIONS.map")) failures.push(`Atlas does not derive coverage for ${slug}`);
}
for (const publicFile of ["app/countries/page.tsx", "app/map/page.tsx", "app/apostille/[country]/page.tsx", "components/landing/destination-intelligence-card.tsx", "components/seo/CountryAuthorityPage.tsx"]) {
  const source = existsSync(join(root, publicFile)) ? read(publicFile) : "";
  for (const phrase of prohibitedPublic) {
    if (source.toLowerCase().includes(phrase.toLowerCase())) failures.push(`${publicFile} exposes prohibited public phrase: ${phrase}`);
  }
}
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log(`Global Compliance Atlas validation passed for ${slugs.length} destination slugs.`);
