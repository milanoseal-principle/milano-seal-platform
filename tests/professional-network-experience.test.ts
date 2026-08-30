import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const network = readFileSync("data/professional-network.ts", "utf8");
const networkExperience = readFileSync("components/professional-network/ProfessionalNetworkExperience.tsx", "utf8");
const counsel = readFileSync("app/lawyer-access/page.tsx", "utf8");
const alliance = readFileSync("app/alliance/dashboard/page.tsx", "utf8");
const operations = readFileSync("app/va/dashboard/page.tsx", "utf8");

test("professional network exposes distinct governed professional lanes", () => {
  assert.match(network, /Milano Counsel Network/);
  assert.match(network, /Milano Verified Execution Partner/);
  assert.match(network, /Milano Execution Coordinator/);
  assert.match(network, /One canonical Matter record/);
  assert.match(network, /No parallel execution state machine/);
});

test("counsel experience keeps the legal and execution responsibilities separate", () => {
  assert.match(counsel, /Counsel controls/);
  assert.match(counsel, /Milano controls/);
  assert.match(counsel, /does not create an attorney-client relationship/);
  assert.match(counsel, /does not provide legal advice|COUNSEL_REPORT_BOUNDARY/);
  assert.match(counsel, /does not create[\s\S]*legal representation by Milano/i);
  assert.doesNotMatch(counsel, /Milano attorney/i);
  assert.doesNotMatch(counsel, /Milano provides legal representation/i);
  assert.doesNotMatch(counsel, /Milano serves as legal counsel/i);
});

test("verified execution partner designation remains evidence-gated", () => {
  assert.match(alliance, /toolbelt_completed/);
  assert.match(alliance, /compliance_verified/);
  assert.match(alliance, /security_attested/);
  assert.match(alliance, /routing_eligible/);
  assert.match(alliance, /Milano Verified Execution Partner/);
  assert.match(alliance, /do not replace commissions, licenses, governmental credentials/);
});

test("execution coordinator designation does not create licensed authority", () => {
  assert.match(operations, /Milano Execution Coordinator/);
  assert.match(operations, /no legal or notarial authority is created/);
});

test("professional network presentation cannot mutate canonical transaction truth", () => {
  for (const source of [networkExperience, counsel]) {
    assert.doesNotMatch(source, /\.update\(/);
    assert.doesNotMatch(source, /\.insert\(/);
    assert.doesNotMatch(source, /payment_confirmed\s*:/);
  }
});
