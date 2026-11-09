import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");

test("complimentary authorization preserves zero payment and zero verified revenue", () => {
  const source = read("lib/payments/complimentary-authorization.ts");
  assert.match(source, /amountPaid:\s*0/);
  assert.match(source, /verifiedRevenue:\s*0/);
  assert.match(source, /wisePaymentId:\s*null/);
  assert.match(source, /wiseTransferId:\s*null/);
  assert.match(source, /paymentConfirmedAt:\s*null/);
});

test("server authorization never marks payment paid or confirmed", () => {
  const source = read("lib/payments/complimentary-server.ts");
  assert.doesNotMatch(source, /payment_status\s*:\s*["']paid["']/);
  assert.doesNotMatch(source, /payment_confirmed\s*:\s*true/);
  assert.match(source, /amount_due:\s*0/);
  assert.match(source, /verified_revenue:\s*0/);
});

test("scheduling gate separates verified payment from complimentary authorization", () => {
  const source = read("lib/scheduling/complimentarySchedulingGate.ts");
  assert.match(source, /verified_payment/);
  assert.doesNotMatch(source, /paymentRequirementMethod:\s*["']complimentary_authorization["']/);
  assert.match(source, /not_satisfied/);
  assert.match(source, /evaluatePaymentGate/);
});

test("Named operator identity is not hardcoded", () => {
  const files = [
    "lib/payments/complimentary-policy.ts",
    "lib/payments/complimentary-server.ts",
    "app/api/matters/[matterId]/complimentary/authorize/route.ts",
  ];
  for (const file of files) {
    const source = read(file);
    assert.doesNotMatch(source, new RegExp(["tiff" + "any@", "NamedOperator.*email", "user\\.email.*NamedOperator", "hardcoded.*NamedOperator"].join("|"), "i"));
  }
});
