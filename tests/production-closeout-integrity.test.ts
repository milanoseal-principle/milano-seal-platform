import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path: string) => fs.readFileSync(path, "utf8");

test("courier webhook fails closed and uses one atomic transition", () => {
  const route = read("app/api/courier/webhook/route.ts");
  assert.match(route, /verifyShippoHmac/);
  assert.match(route, /record_courier_delivery_transition/);
  assert.doesNotMatch(route, /updates\.deal_status/);
  const outerCatch = route.slice(route.lastIndexOf("} catch"));
  assert.doesNotMatch(outerCatch, /received:\s*true/);
});

test("notarial act transition commits Matter truth and evidence in one RPC", () => {
  const route = read("app/api/dashboard/matters/[id]/execution-truth/route.ts");
  const migration = read("supabase/migrations/074_atomic_execution_courier_alliance.sql");
  assert.match(route, /confirm_matter_notarial_act/);
  assert.doesNotMatch(route, /appendMatterEvidence/);
  assert.match(migration, /NOTARIAL_ACT_CONFIRMED/);
  assert.match(migration, /for update/);
  assert.doesNotMatch(migration, /payment_status|payment_confirmed|amount_paid|wise_transaction_reference/);
});

test("Alliance success returns a durable observation identifier", () => {
  const route = read("app/api/alliance/submit/route.ts");
  assert.match(route, /alliance_observations/);
  assert.match(route, /reference: persistedId/);
  assert.doesNotMatch(route, /OBS-\$\{Date\.now/);
  assert.doesNotMatch(route, /console\.log/);
});
