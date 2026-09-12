import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const homepage = readFileSync("app/page.tsx", "utf8");
const access = readFileSync("app/access/page.tsx", "utf8");
const lawyerAccess = readFileSync("app/lawyer-access/page.tsx", "utf8");
const pricing = readFileSync("app/pricing/page.tsx", "utf8");
const securePortal = readFileSync("app/secure-portal/page.tsx", "utf8");
const processPage = readFileSync("app/process/page.tsx", "utf8");
const processExperience = readFileSync("components/process/ProcessExperience.tsx", "utf8");
const routingPreview = readFileSync("components/landing/homepage-routing-preview.tsx", "utf8");
const counsel = readFileSync("data/counsel-intelligence.ts", "utf8");

test("access experience separates execution, intelligence, counsel, concierge, and network lanes", () => {
  assert.match(access, /I need a document executed/);
  assert.match(access, /COUNSEL_INTELLIGENCE_REPORT\.name/);
  assert.match(access, /COUNSEL_DESK\.name/);
  assert.match(access, /Concierge International Execution/);
  assert.match(access, /Work with The Milano Seal/);
  assert.match(counsel, /Milano Cross-Border Execution Intelligence Report/);
  assert.match(counsel, /Milano Counsel Desk/);
  assert.doesNotMatch(access, /ACCESS_PRODUCTS\.map/);
});

test("counsel products expose substantive deliverables rather than brochure access", () => {
  assert.match(lawyerAccess, /Executive Route Decision/);
  assert.match(lawyerAccess, /Authority Matrix/);
  assert.match(lawyerAccess, /Failure \/ Rejection Risk/);
  assert.match(lawyerAccess, /Evidence Appendix/);
  assert.match(counsel, /UNKNOWN/);
});

test("public commercial surfaces do not disclose numeric pricing", () => {
  for (const [label, source] of [["access", access], ["lawyer-access", lawyerAccess], ["pricing", pricing]] as const) {
    assert.doesNotMatch(source, /\$\s?\d[\d,]*(?:\.\d{2})?/i, `${label} exposes a public dollar amount`);
    assert.doesNotMatch(source, /\.priceLabel\b/i, `${label} renders an internal price label`);
  }
  assert.match(access, /Matter-specific quote after review/);
  assert.match(lawyerAccess, /Scope reviewed before engagement/);
  assert.match(lawyerAccess, /Professional access by review/);
});

test("secure portal public preview is a Matter command center and does not replace authenticated portal truth", () => {
  assert.match(securePortal, /Secure Matter Command Center/);
  assert.match(securePortal, /Matter Truth/);
  assert.match(securePortal, /Transaction/);
  assert.match(securePortal, /Document Vault/);
  assert.match(securePortal, /Chain of Custody/);
  assert.match(securePortal, /Next required action/);
  assert.match(securePortal, /illustrative only/);
});

test("process route uses one cinematic execution experience instead of duplicate tutorial stacks", () => {
  assert.match(processPage, /ProcessExperience/);
  assert.doesNotMatch(processPage, /const stages/);
  assert.match(processExperience, /Payment-Gated Execution/);
  assert.match(processExperience, /Chain-of-Custody Visibility/);
  assert.match(processExperience, /Structured International Release/);
});

test("homepage exposes one document plus corridor intelligence workspace instead of separate islands", () => {
  assert.match(homepage, /HomepageRoutingPreview/);
  assert.doesNotMatch(homepage, /<DocumentIntelligence\s*\/>/);
  assert.match(routingPreview, /DOCUMENTS/);
  assert.match(routingPreview, /data-atlas-corridor-module="unified"/);
  assert.match(routingPreview, /data-active-country=\{selected\.slug\}/);
  assert.match(routingPreview, /data-active-document=\{document\.id\}/);
  assert.match(routingPreview, /selectDocument/);
  assert.match(routingPreview, /relevantDestinations/);
  assert.match(routingPreview, /MiniAtlasPreview selected=\{selected\}/);
  assert.match(routingPreview, /autoCycle=\{false\}/);
  assert.match(routingPreview, /DestinationIntelligenceCard destination=\{selected\}/);
  assert.match(routingPreview, /HomeShippingCorridorPanel corridor=\{corridor\}/);
  assert.match(routingPreview, /Begin \{selected\.name\} Matter/);
  assert.match(routingPreview, /View \{selected\.name\} Requirements/);
});
