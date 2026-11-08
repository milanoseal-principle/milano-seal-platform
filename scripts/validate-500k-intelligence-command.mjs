#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

const sources = {
  professional: read("lib/professional360/read-model.ts"),
  professionalUi: read("app/dashboard/professional360/page.tsx"),
  professionalDay: read("app/today/professional/page.tsx"),
  economics: read("lib/economics/matterEconomics.ts"),
  economicsUi: read("app/dashboard/economics/page.tsx"),
  negative: read("lib/intelligence/negative-events.ts"),
  receipt: read("lib/intelligence/decision-receipt.ts"),
  recovery: read("app/dashboard/recovery/page.tsx"),
  corridor: read("lib/corridor/scale-engine.ts"),
  corridorUi: read("app/dashboard/corridors/CorridorEngine.tsx"),
  executive: read("components/dashboard/ExecutiveIntelligenceCommand.tsx"),
  freshness: read("lib/intelligence/freshness-center.ts") + read("lib/intelligence/freshness-policy.ts"),
  freshnessUi: read("app/dashboard/intelligence/freshness/page.tsx"),
  alliance: read("lib/alliance/quality-capacity.ts") + read("lib/alliance/quality-policy.ts"),
  allianceUi: read("app/dashboard/alliance/quality/page.tsx"),
  trust: read("lib/trust/customer-trust.ts"),
  trustUi: read("app/dashboard/trust/TrustEngine.tsx"),
};

for (const [name, src] of Object.entries(sources)) {
  assert.ok(!/stripe/i.test(src), `${name}: Stripe must not be introduced`);
  assert.ok(!/liaison\s*os|provider360/i.test(src), `${name}: cross-project CRM authority must not be introduced`);
  assert.ok(!/guaranteed acceptance|guarantee(?:d)? foreign acceptance/i.test(src), `${name}: foreign acceptance must not be guaranteed`);
}

assert.match(sources.professional, /fetchCanonicalDeals/);
assert.match(sources.professionalUi, /not a second CRM/i);
assert.doesNotMatch(sources.professional, /\.insert\(|\.update\(|\.delete\(|\.upsert\(/);
assert.match(sources.professionalDay, /does not create sales tasks/i);

for (const state of ["OBSERVED", "ATTRIBUTED", "MODELED", "UNKNOWN"]) assert.match(sources.economics, new RegExp(state));
assert.match(sources.economics, /No canonical direct-cost ledger/);
assert.match(sources.economicsUi, /shadow accounting/i);
assert.doesNotMatch(sources.economics, /client_lifetime_value|LTV/i);

for (const domain of ["professional", "client", "execution", "authority", "payment", "partner"]) assert.ok(sources.negative.includes(`"${domain}"`), `missing negative-event domain ${domain}`);
for (const state of ["DECLINED", "BLOCKED", "FAILED", "LOST", "PAUSED", "REJECTED", "UNKNOWN"]) assert.ok(sources.negative.includes(`"${state}"`), `missing negative-event state ${state}`);
assert.match(sources.negative, /return STATE_ALIASES\[key\] \?\? "UNKNOWN"/);

assert.match(sources.receipt, /authority/);
assert.match(sources.receipt, /evidence/);
assert.doesNotMatch(sources.receipt, /openai|anthropic|generateText|chatCompletion/i);
assert.match(sources.recovery, /Decision Receipt/);

for (const status of ["SCALE", "WATCH", "CONSTRAINED", "DO_NOT_SCALE"]) assert.ok(sources.corridor.includes(`"${status}"`), `missing corridor state ${status}`);
for (const factor of ["Demand", "Margin", "Execution capacity", "Partner capacity", "Authority-rule freshness", "Exception rate", "Professional demand"]) assert.match(sources.corridor, new RegExp(factor));
assert.doesNotMatch(sources.corridorUi, /setCertifyStates|certifyingKey|Certifying\.\.\.|onClick=\{\(\) => certify/);
assert.match(sources.corridorUi, /not a certification/i);

for (const state of ["CURRENT", "WATCH", "STALE", "CONFLICT", "REVIEW_REQUIRED"]) assert.ok(sources.freshness.includes(`"${state}"`), `missing freshness state ${state}`);
assert.match(sources.freshness, /source_url/);
assert.match(sources.freshness, /last_verified_at/);
assert.match(sources.freshnessUi, /fails closed/i);

for (const state of ["ACTIVE", "LIMITED", "PAUSED", "SUSPENDED", "LOST", "NEEDS_REVIEW"]) assert.ok(sources.alliance.includes(`"${state}"`), `missing Alliance state ${state}`);
assert.match(sources.allianceUi, /Unknown evidence stays unknown/i);

assert.doesNotMatch(sources.trustUi, /Verified Authorities.*count:\s*0|Verified Corridors.*count:\s*0|Verified Partners.*count:\s*0/s);
assert.match(sources.trustUi, /no synthetic trust score/i);
assert.match(sources.trust, /OBSERVED/);
assert.match(sources.trust, /UNKNOWN/);

assert.match(sources.executive, /loadOperatorIntelligence/);
assert.match(sources.executive, /loadProfessional360/);
assert.match(sources.executive, /loadMatterEconomics/);
assert.match(sources.executive, /buildCorridorScaleDecisions/);

for (const src of [sources.professionalUi, sources.economicsUi, sources.recovery, sources.freshnessUi, sources.allianceUi, sources.trustUi]) {
  assert.doesNotMatch(src, /raw pricing formula|internal complexity formula|private margin/i);
}

console.log("500K Intelligence Command source contract: PASS");
