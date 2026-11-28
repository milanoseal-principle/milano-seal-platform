import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/webhooks/resend/route";
import { RESEND_NOTIFICATION_TAG } from "@/lib/notifications/deliveryTruth";

test("signed delivery recovers a missing acknowledgement only for the tagged notification", async (t) => {
  const secret = Buffer.from("synthetic-webhook-key");
  const env = {
    RESEND_WEBHOOK_SECRET: secret.toString("base64"),
    RESEND_API_KEY: "synthetic-resend-key",
    NEXT_PUBLIC_SUPABASE_URL: "https://webhook-fixture.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "synthetic-service-key",
  };
  const previous = Object.fromEntries(Object.keys(env).map((key) => [key, process.env[key]]));
  Object.assign(process.env, env);
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  const messageId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
  const notificationId = "11111111-2222-4333-8444-555555555555";
  const row: Record<string, unknown> = {
    id: notificationId, provider: "resend", recipient_email: "owner@example.invalid",
    provider_message_id: null, send_claim: "worker", delivery_status: "unknown",
  };
  let providerRecipient = "other@example.invalid";
  let providerReads = 0;
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    if (url.hostname === "api.resend.com") {
      assert.equal(request.method, "GET");
      assert.equal(url.pathname, `/emails/${messageId}`);
      providerReads += 1;
      return Response.json({
        id: messageId, to: [providerRecipient],
        tags: [{ name: RESEND_NOTIFICATION_TAG, value: notificationId }],
      });
    }
    assert.equal(url.hostname, "webhook-fixture.supabase.co");
    if (request.method === "GET") {
      return Response.json(row.provider_message_id === messageId ? [row] : []);
    }
    assert.equal(request.method, "PATCH");
    assert.equal(url.searchParams.get("id"), `eq.${notificationId}`);
    assert.equal(url.searchParams.get("send_claim"), "not.is.null");
    assert.equal(url.searchParams.get("provider_message_id"), "is.null");
    if (url.searchParams.get("recipient_email") !== `eq.${row.recipient_email}`) return Response.json([]);
    Object.assign(row, await request.json());
    return Response.json([{ id: notificationId }]);
  });

  const payload = JSON.stringify({ type: "email.delivered", data: { email_id: messageId } });
  const id = "signed-delivery";
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHmac("sha256", secret).update(`${id}.${timestamp}.${payload}`).digest("base64");
  const request = (value: string) => new NextRequest("https://example.invalid/api/webhooks/resend", {
    method: "POST", body: payload,
    headers: { "svix-id": id, "svix-timestamp": timestamp, "svix-signature": `v1,${value}` },
  });

  assert.equal((await POST(request("invalid"))).status, 401);
  assert.equal(providerReads, 0);
  assert.equal((await POST(request(signature))).status, 503);
  assert.equal(row.send_claim, "worker");
  assert.equal(row.provider_message_id, null);

  providerRecipient = String(row.recipient_email);
  assert.equal((await POST(request(signature))).status, 200);
  assert.equal(row.provider_message_id, messageId);
  assert.equal(row.delivery_status, "delivered");
  assert.equal(row.send_claim, null);
  assert.equal(row.delivery_evidence_ref, "resend:signed-delivery");
  assert.deepEqual(await (await POST(request(signature))).json(), { ok: true, duplicate: true });
  assert.equal(providerReads, 2);
});
