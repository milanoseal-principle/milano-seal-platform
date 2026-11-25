import assert from "node:assert/strict";
import { test } from "node:test";
import { writeMatterAuditEvent } from "@/src/features/audit/eventLedgerService";

test("discount audit events reach the hosted canonical Matter timeline", async (t) => {
  const urlName = "NEXT_PUBLIC_SUPABASE_URL";
  const keyName = "SUPABASE_SERVICE_ROLE_KEY";
  const originalUrl = process.env[urlName];
  const originalKey = process.env[keyName];
  process.env[urlName] = "https://matter-audit-fixture.supabase.co";
  process.env[keyName] = "synthetic-service-role-key";
  t.after(() => {
    if (originalUrl === undefined) delete process.env[urlName];
    else process.env[urlName] = originalUrl;
    if (originalKey === undefined) delete process.env[keyName];
    else process.env[keyName] = originalKey;
  });

  const eventId = "00000000-0000-4000-8000-000000000001";
  const matterId = "00000000-0000-4000-8000-000000000002";
  const actorId = "00000000-0000-4000-8000-000000000003";
  const requests: { path: string; method: string; body: unknown }[] = [];
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    const path = new URL(request.url).pathname;
    requests.push({ path, method: request.method, body: await request.json() });
    if (path !== "/rest/v1/matter_events") {
      return Response.json({ code: "42P01", message: "Relation does not exist" }, { status: 404 });
    }
    return Response.json({ id: eventId }, { status: 201 });
  });

  const result = await writeMatterAuditEvent({
    matterId,
    actorUserId: actorId,
    actorEmail: "qa@example.invalid",
    eventType: "DISCOUNT_APPLIED",
    statusBefore: "quoted",
    statusAfter: "awaiting_payment",
    message: "Discount applied",
    metadata: { discountAmount: 10 },
  });

  assert.deepEqual(result, { data: { id: eventId } });
  assert.deepEqual(requests, [{
    path: "/rest/v1/matter_events",
    method: "POST",
    body: {
      matter_id: matterId,
      event_type: "DISCOUNT_APPLIED",
      actor: "qa@example.invalid",
      notes: "Discount applied",
      client_visible: false,
      metadata: {
        discountAmount: 10,
        actor_user_id: actorId,
        status_before: "quoted",
        status_after: "awaiting_payment",
      },
    },
  }]);
});
