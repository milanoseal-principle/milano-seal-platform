import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

const home = read("app/page.tsx");
const services = read("components/landing/services.tsx");
const close = read("components/landing/high-trust-close.tsx");
const terms = read("app/terms/page.tsx");
const apostille = read("app/services/apostille/page.tsx");
const learning = read("app/learn/hague-vs-non-hague-countries/page.tsx");
const legacyLookup = read("components/landing/jurisdiction-compliance-lookup.tsx");
const mapLayout = read("app/map/layout.tsx");

assert.doesNotMatch(home, /<ClientTypes\s*\/>/, "Homepage must not restore duplicate audience-routing section");
assert.doesNotMatch(home, /<TrustProof\s*\/>/, "Homepage must not restore duplicate trust-proof section");
assert.match(home, /<PersonaRouting\s*\/>/, "Homepage must preserve canonical persona routing");
assert.match(home, /<HighTrustClose\s*\/>/, "Homepage must preserve canonical trust close");
assert.match(home, /<FinalCTA\s*\/>/, "Homepage must preserve final intake gate");

const publicCopy = [services, close, terms, apostille, learning, legacyLookup, mapLayout].join("\n");
for (const stale of [
  "Certified Florida Notary Public",
  "Executed properly the first time",
  "Hague Convention members accept apostilles directly",
  "U.S. documents for use in these countries require apostille authentication via the Florida Department of State",
  "Direct submission and coordination with the Florida Secretary of State apostille division",
  "The UAE acceded to the Hague Convention in 2021",
]) {
  assert.ok(!publicCopy.includes(stale), `Stale or overbroad public claim must remain removed: ${stale}`);
}

assert.match(terms, /commissioned Florida Notary Public/);
assert.match(terms, /Payments are processed through Wise/);
assert.match(terms, /remaining\s+balance must be verified before final international release/);
assert.match(terms, /Final acceptance remains subject to the\s+receiving authority/);

assert.match(apostille, /Competent Authority Routing/);
assert.match(apostille, /document origin and Matter facts/);
assert.match(apostille, /receiving-authority/);

assert.match(learning, /governed route intelligence/);
assert.match(legacyLookup, /Florida state apostille route applies only to eligible Florida-origin documents/);
assert.match(close, /Controlled international/);

for (const path of [
  "scripts/run-rendered-production-acceptance.mjs",
  ".github/workflows/rendered-production-acceptance.yml",
]) {
  assert.ok(existsSync(path), `Rendered production acceptance artifact missing: ${path}`);
}

const rendered = read("scripts/run-rendered-production-acceptance.mjs");
for (const route of [
  "/",
  "/intake",
  "/global-document-intelligence",
  "/professional/damiani",
  "/secure-portal",
  "/services/apostille",
]) {
  assert.ok(rendered.includes(`path: "${route}"`), `Rendered QA must cover ${route}`);
}
for (const width of ["390", "430", "768", "1440"]) {
  assert.ok(rendered.includes(`width: ${width}`), `Rendered QA must cover viewport width ${width}`);
}
assert.match(rendered, /scrollWidth/);
assert.match(rendered, /pageerror/);
assert.match(rendered, /requestfailed/);
assert.match(rendered, /screenshot/);

console.log("PASS final public polish + rendered-device QA governance");
