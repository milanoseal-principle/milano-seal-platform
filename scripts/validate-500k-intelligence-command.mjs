#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

const professional = read("lib/professional360/read-model.ts");
const economics = read("lib/economics/matterEconomics.ts");
const negative = read("lib/intelligence/negative-events.ts");
const receipt = read("lib/intelligence/decision-receipt.ts");
const corridor = read("lib/corridor/scale-engine.ts");
const corridorUi = read("app/dashboard/corridors/CorridorEngine.tsx");
const recovery = read("app/dashboard/recovery/page.tsx");
const executive = read("components/dashboard/ExecutiveIntelligenceCommand.tsx");
const professionalUi = read("app/dashboard/professional360/page.tsx");
const economicsUi = read("app/dashboard/economics/page.tsx");

for (const [name, src] of Object.entries({ professional, economics, negative, receipt, corridor, corridorUi, recovery, executive, professionalUi, economicsUi })) {
  assert.ok(!/stripe/i.test(src), `${name}: Stripe must not be introduced`);
  assert.ok(!/liaison\s*os|provider360/i.test(src), `${name}: cross-project CRM authority must not be introduced`);
}

assert.match(professional, /fetchCanonicalDeals/);
assert.match(professionalUi, /not a second CRM/i);
assert.doesNotMatch(professional, /\.insert\(|\.update\(|\.delete\(|\.upsert\(/);

for (const state of ["OBSERVED", "ATTRIBUTED", "MODELED", "UNKNOWN"]) assert.match(economics, new RegExp(state));
assert.match(economics, /No canonical direct-cost ledger/);
assert.match(economicsUi, /shadow accounting/i);
assert.doesNotMatch(economics, /client_lifetime_value|LTV/i);

for (const domain of ["professional", "client", "execution", "authority", "payment", "partner"]) assert.match(negative, new RegExp(`\\"${domain}\\"`));
for (const state of ["DECLINED", "BLOCKED", "FAILED", "LOST", "PAUSED", "REJECTED", "UNKNOWN"]) assert.match(negative, new RegExp(`\\"${state}\\"`));
assert.match(negative, /return STATE_ALIASES\[key\] \?\? "UNKNOWN"/);

assert.match(receipt, /authority/);
assert.match(receipt, /evidence/);
assert.doesNotMatch(receipt, /openai|anthropic|generateText|chatCompletion/i);
assert.match(recovery, /Decision Receipt/);

for (const status of ["SCALE", "WATCH", "CONSTRAINED", "DO_NOT_SCALE"]) assert.match(corridor, new RegExp(`\\"${status}\\"`));
for (const factor of ["Demand", "Margin", "Execution capacity", "Partner capacity", "Authority-rule freshness", "Exception rate", "Professional demand"]) assert.match(corridor, new RegExp(factor));
assert.doesNotMatch(corridorUi, /setCertifyStates|certifyingKey|Certifying\.\.\.|onClick=\{\(\) => certify/);
assert.match(corridorUi, /not a certification/i);

assert.match(executive, /loadOperatorIntelligence/);
assert.match(executive, /loadProfessional360/);
assert.match(executive, /loadMatterEconomics/);
assert.match(executive, /buildCorridorScaleDecisions/);

console.log("500K Intelligence Command source contract: PASS");
