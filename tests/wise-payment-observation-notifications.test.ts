import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const invoice = fs.readFileSync("app/portal/invoice/page.tsx", "utf8");
const observation = fs.readFileSync("app/api/portal/me/payment-observation/route.ts", "utf8");
const alerts = fs.readFileSync("lib/notifications/transactionalEmailAlerts.ts", "utf8");
const cron = fs.readFileSync("app/api/cron/notification-reconcile/route.ts", "utf8");
const vercel = fs.readFileSync("vercel.json", "utf8");
const discount = fs.readFileSync("app/api/portal/me/discount/route.ts", "utf8");

test("portal distinguishes Wise processing from verified settlement", () => {
  assert.match(invoice, /Wise payment processing/);
  assert.match(invoice, /I completed payment in Wise/);
  assert.match(invoice, /checks automatically every 10 seconds/i);
  assert.match(invoice, /only verified Wise settlement can satisfy the payment gate/i);
});

test("client observation never authors paid state", () => {
  assert.match(observation, /payment_settlement_status:\s*"observed_pending"/);
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
