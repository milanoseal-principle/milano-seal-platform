import { readFileSync } from "node:fs";

// Module 2 public-facing pages (services + dashboard + locations/book).
const pages = [
  "app/services/fingerprinting-document-support/page.tsx",
  "app/services/fbi-background-check-apostille/page.tsx",
  "app/services/fingerprint-cards/page.tsx",
  "app/services/immigration-fingerprinting-documents/page.tsx",
  "app/services/mobile-fingerprinting-coordination/page.tsx",
  "app/services/apostille-authentication/page.tsx",
  "app/services/federal-apostille-authentication/page.tsx",
  "app/services/vital-record-apostille/page.tsx",
  "app/services/translation-coordination/page.tsx",
  "app/services/loan-signing-agent-services/page.tsx",
  "app/locations/page.tsx",
  "app/book/page.tsx",
  "app/dashboard/fingerprint-apostille-network/page.tsx",
  "app/dashboard/fingerprinting/page.tsx",
  "app/dashboard/apostille-rules/page.tsx",
  "app/dashboard/translations/page.tsx",
  "app/dashboard/booking-intake/page.tsx",
];

// Banned public-facing claims. Note: these are matched as whole phrases so that
// legitimate wording like "not a substitute for a background check" is unaffected.
const banned = [
  "fbi approved",
  "fdle approved",
  "official government partner",
  "government approved",
  "government-approved",
  "guaranteed acceptance",
  "guaranteed clearance",
  "guaranteed approval",
  "guarantee acceptance",
  "guarantee approval",
  "hague compliant",
  "cheap notary",
  "buy now",
  "checkout",
  "order now",
  "stripe",
];

let failures = 0;
for (const page of pages) {
  let content;
  try {
    content = readFileSync(page, "utf8").toLowerCase();
  } catch {
    console.error(`FAIL missing public page: ${page}`);
    failures += 1;
    continue;
  }
  for (const phrase of banned) {
    if (content.includes(phrase)) {
      console.error(`FAIL banned claim "${phrase}" found in ${page}`);
      failures += 1;
    }
  }
}

if (failures) {
  console.error(`FAIL regulated-public-claims: ${failures} issue(s)`);
  process.exit(2);
}
console.log("OK regulated-public-claims: no banned claims in Module 2 public pages");
