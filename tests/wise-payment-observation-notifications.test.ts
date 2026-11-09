import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const invoice = fs.readFileSync("app/portal/invoice/page.tsx", "utf8");
const observation = fs.readFileSync("app/api/portal/me/payment-observation/route.ts", "utf8");
const alerts = fs.readFileSync("lib/notifications/transactionalEmailAlerts.ts", "utf8");
const cron = fs.readFileSync("app/api/cron/notification-reconcile/route.ts", "utf8");
const vercel = fs.readFileSync("vercel.json", "utf8");
const discount = fs.readFileSync("app/api/portal/me/discount/route.ts", "utf8");

test("portal distinguishes submitted payment, scheduling authority, and verified settlement", () => {
  assert.match(invoice, /Payment submitted/);
  assert.match(invoice, /I completed payment in Wise/);
  assert.match(invoice, /window\.setInterval\(\(\) => void loadPaymentFlow\(\), 10_000\)/);
  assert.match(invoice, /Check Wise settlement now/);
  assert.match(invoice, /method:\s*"PUT"/);
  assert.match(invoice, /Verified Wise settlement is required before scheduling/i);
  assert.match(invoice, /Verified Wise settlement is required/i);
  assert.doesNotMatch(invoice, /Wise payment processing/);
  assert.doesNotMatch(invoice, /Refresh Wise payment status/);
});

test("client observation never authors paid state", () => {
  assert.match(observation, /begin_wise_payment_attempt/);
  assert.doesNotMatch(observation, /payment_status:\s*"paid"/);
  assert.doesNotMatch(observation, /payment_confirmed:\s*true/);
});

test("discount mutation locks once Wise submission is observed", () => {
  assert.match(discount, /payment_observed_at/);
  assert.match(discount, /Discount cannot change after Wise payment has been submitted/);
});

test("operator notification recipients include both production inboxes", () => {
  assert.match(alerts, /nicholas@themilanoseal\.com/);
  assert.match(alerts, /themilanoseal@gmail\.com/);
  assert.match(alerts, /operator_intake_alert/);
  assert.match(alerts, /operator_payment_observed/);
  assert.match(alerts, /operator_payment_confirmed/);
});

test("notification reconciler is near-real-time and cron-secret protected", () => {
  assert.match(cron, /Bearer \$\{expected\}/);
  assert.match(vercel, /\/api\/cron\/notification-reconcile/);
  assert.match(vercel, /"schedule"\s*:\s*"\* \* \* \* \*"/);
});
