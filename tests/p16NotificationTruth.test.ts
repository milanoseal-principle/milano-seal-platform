import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { mapProviderEvent, notificationIdempotencyKey, verifySvixSignature } from "../lib/notifications/deliveryTruth";

const read = (path: string) => readFileSync(path, "utf8");
const migration = read("supabase/migrations/20261108130000_p16_notification_truth.sql");
const alerts = read("lib/notifications/transactionalEmailAlerts.ts");
const webhook = read("app/api/webhooks/resend/route.ts");

const secret = Buffer.from("test-secret-bytes").toString("base64");
function sign(id: string, ts: string, body: string) {
  return `v1,${createHmac("sha256", Buffer.from(secret, "base64")).update(`${id}.${ts}.${body}`).digest("base64")}`;
}

test("P16 provider accepted is not delivered", () => {
  assert.match(alerts, /delivery_status: input\.status === "sent" \? "provider_accepted" : "failed"/);
  assert.doesNotMatch(alerts, /delivery_status:\s*"delivered"/);
  assert.doesNotMatch(alerts, /delivered_at:/);
  assert.equal(mapProviderEvent("email.sent", "2026-11-08T00:00:00Z"), null);
  assert.equal(mapProviderEvent("email.delivery_delayed", "2026-11-08T00:00:00Z"), null);
  assert.deepEqual(mapProviderEvent("email.delivered", "t"), { delivery_status: "delivered", delivered_at: "t" });
  assert.match(migration, /delivery_status <> 'delivered' or \(delivered_at is not null and nullif\(btrim\(delivery_evidence_ref\), ''\) is not null\)/);
});

test("P16 duplicate retry is deduplicated", () => {
  assert.equal(notificationIdempotencyKey("m", "T", " A@B.com "), "m:T:a@b.com");
  assert.match(migration, /notifications_idempotency_key_uidx/);
  assert.match(migration, /notifications_provider_event_uidx/);
  assert.match(alerts, /error\?\.code !== "23505"/);
  assert.match(alerts, /SETTLED_DELIVERY\.has/);
  assert.match(webhook, /row\.provider_event_id === id/);
});

test("P16 failed delivery, bounce and suppression are distinct evidence states", () => {
  assert.equal(mapProviderEvent("email.bounced", "t")?.delivery_status, "bounced");
  assert.equal(mapProviderEvent("email.complained", "t")?.delivery_status, "suppressed");
  assert.equal(mapProviderEvent("email.suppressed", "t")?.delivery_status, "suppressed");
  assert.equal(mapProviderEvent("email.failed", "t")?.delivery_status, "failed");
  assert.match(migration, /NOTIFICATION_TERMINAL_STATE_IMMUTABLE/);
  assert.match(alerts, /errorClassification: "transport_error"/);
});

test("P16 webhook authenticity fails closed", () => {
  const body = '{"type":"email.delivered"}';
  const ts = "1800000000";
  assert.equal(verifySvixSignature({ secret, id: "msg_1", timestamp: ts, signatureHeader: sign("msg_1", ts, body), body, nowSeconds: 1800000000 }), true);
  assert.equal(verifySvixSignature({ secret, id: "msg_1", timestamp: ts, signatureHeader: sign("msg_1", ts, body), body: body + " ", nowSeconds: 1800000000 }), false);
  assert.equal(verifySvixSignature({ secret, id: "msg_1", timestamp: ts, signatureHeader: sign("msg_1", ts, body), body, nowSeconds: 1800001000 }), false);
  assert.equal(verifySvixSignature({ secret: undefined, id: "msg_1", timestamp: ts, signatureHeader: "v1,x", body }), false);
  assert.match(webhook, /UNVERIFIED_WEBHOOK/);
});

test("P16 no sensitive document payload leaks into notification evidence", () => {
  assert.match(alerts, /message: `\$\{input\.type\} for \$\{input\.matterReference\}`/);
  assert.doesNotMatch(alerts, /base64_content|signed_storage_path|storage_path/);
});
