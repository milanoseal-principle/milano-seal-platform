import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const access = readFileSync("app/access/page.tsx", "utf8");
const lawyerAccess = readFileSync("app/lawyer-access/page.tsx", "utf8");
const securePortal = readFileSync("app/secure-portal/page.tsx", "utf8");
const processPage = readFileSync("app/process/page.tsx", "utf8");
const processExperience = readFileSync("components/process/ProcessExperience.tsx", "utf8");
const routingPreview = readFileSync("components/landing/homepage-routing-preview.tsx", "utf8");
const products = readFileSync("data/access-products.ts", "utf8");
const counsel = readFileSync("data/counsel-intelligence.ts", "utf8");

test("access experience separates execution, intelligence, counsel, concierge, and network lanes", () => {
  assert.match(access, /I need a document executed/);
  assert.match(access, /Milano Cross-Border Execution Intelligence Report/);
  assert.match(access, /Milano Counsel Desk/);
  assert.match(access, /Concierge International Execution/);
  assert.match(access, /Work with The Milano Seal/);
  assert.doesNotMatch(access, /ACCESS_PRODUCTS\.map/);
});

test("counsel products expose substantive deliverables rather than brochure access", () => {
  assert.match(lawyerAccess, /Executive Route Decision/);
  assert.match(lawyerAccess, /Authority Matrix/);
  assert.match(lawyerAccess, /Failure \/ Rejection Risk/);
  assert.match(lawyerAccess, /Evidence Appendix/);
  assert.match(counsel, /UNKNOWN/);
  assert.match(products, /\$149 \/ Matter/);
  assert.match(products, /\$299 \/ month/);
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

test("Atlas Corridor Intelligence is one synchronized jurisdiction module", () => {
  assert.match(routingPreview, /data-atlas-corridor-module="unified"/);
  assert.match(routingPreview, /data-active-country=\{selected\.slug\}/);
  assert.match(routingPreview, /AnimatePresence/);
  assert.match(routingPreview, /MiniAtlasPreview selected=\{selected\}/);
  assert.match(routingPreview, /DestinationIntelligenceCard destination=\{selected\}/);
  assert.match(routingPreview, /HomeShippingCorridorPanel corridor=\{corridor\}/);
  assert.match(routingPreview, /Begin \{selected\.name\} Matter/);
  assert.match(routingPreview, /View \{selected\.name\} Requirements/);
});
