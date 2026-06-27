import { readFileSync } from "fs";
import { join } from "path";

const root = process.cwd();
const failures = [];

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

const destinationsSource = read("data/destinations.ts");
const intelligenceSource = read("data/country-execution-intelligence.ts");
const cardSource = read("components/landing/destination-intelligence-card.tsx");

const destinationSlugs = Array.from(
  destinationsSource.matchAll(/slug:\s*['"]([^'"]+)['"]/g),
  (match) => match[1],
);

if (destinationSlugs.length === 0) {
  failures.push("No destination slugs found in data/destinations.ts.");
}

for (const slug of destinationSlugs) {
  const entryPattern = new RegExp(`${JSON.stringify(slug)}\\s*:\\s*{([\\s\\S]*?)\\n\\s*},`);
  const match = intelligenceSource.match(entryPattern);

  if (!match) {
    failures.push(`Missing country execution intelligence entry for ${slug}.`);
    continue;
  }

  const entry = match[1];
  for (const field of ["routeLabel", "authoritySummary", "executionFlags", "executionPath", "trustLine"]) {
    if (!entry.includes(`${field}:`)) {
      failures.push(`Missing ${field} for ${slug}.`);
    }
  }
}

const weakPatterns = [
  /support for documents/i,
  /Destination Review/i,
  /Hague Apostille Route(?![A-Z ]*EXECUTION ROUTE)/,
  /Start Secure Intake/i,
  /Explore Full Map/i,
  /Verify document type/i,
  /Confirm destination requirements/i,
  /Prepare secure intake pathway/i,
];

for (const pattern of weakPatterns) {
  if (pattern.test(intelligenceSource) || pattern.test(cardSource)) {
    failures.push(`Weak or legacy country card copy found: ${pattern}`);
  }
}

if (!cardSource.includes("data-critical-card")) {
  failures.push("DestinationIntelligenceCard must preserve data-critical-card.");
}

for (const slug of ["italy", "brazil", "uae", "spain", "portugal", "greece", "mexico", "united-kingdom", "canada"]) {
  if (!intelligenceSource.includes(`${JSON.stringify(slug)}:`)) {
    failures.push(`Priority country ${slug} is not explicitly represented.`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Milano country execution intelligence validation passed for ${destinationSlugs.length} countries.`);
