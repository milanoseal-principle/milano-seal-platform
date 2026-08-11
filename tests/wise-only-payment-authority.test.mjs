import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("production dependencies exclude the retired processor", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(packageJson.dependencies?.stripe, undefined);
  assert.equal(packageJson.devDependencies?.stripe, undefined);
});

test("deal payment endpoints accept Wise only", () => {
  const paymentRoute = readFileSync("app/api/deals/[id]/payment/route.ts", "utf8");
  const dealRoute = readFileSync("app/api/deals/[id]/route.ts", "utf8");
  assert.match(paymentRoute, /const VALID_METHODS = \["wise"\]/);
  assert.match(dealRoute, /const validPaymentMethods = \["wise"\]/);
});

test("retired webhook is a non-mutating permanent tombstone", () => {
  const tombstone = readFileSync("app/api/webhook/stripe/route.ts", "utf8");
  assert.match(tombstone, /permanent HTTP 410 tombstone/);
  assert.match(tombstone, /performs no mutation/);
  assert.doesNotMatch(tombstone, /re-introduce|fallback|payment confirmation logic/i);
});
