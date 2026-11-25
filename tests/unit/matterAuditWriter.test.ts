import assert from "node:assert/strict";
import { test } from "node:test";
import { writeMatterAuditEvent } from "@/src/features/audit/eventLedgerService";

test("discount audit writer targets the canonical Matter timeline", async (t) => {
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

test("a guarded discount refusal writes a private event on the same canonical deal", async (t) => {
  const { applyDiscountToMatter } = await import("@/src/features/discounts/discountService");
  for (const [name, value] of Object.entries({
    NEXT_PUBLIC_SUPABASE_URL: "https://matter-audit-fixture.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "synthetic-service-role-key",
  })) {
    const previous = process.env[name];
    process.env[name] = value;
    t.after(() => {
      if (previous === undefined) delete process.env[name];
      else process.env[name] = previous;
    });
  }

  const matterId = "00000000-0000-4000-8000-000000000002";
  const paths: string[] = [];
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    paths.push(`${request.method} ${url.pathname}`);
    if (url.pathname === "/rest/v1/deals") {
      assert.equal(url.searchParams.get("id"), `eq.${matterId}`);
      return Response.json({ id: matterId, payment_status: "paid" });
    }
    assert.equal(url.pathname, "/rest/v1/matter_events");
    const body = await request.json();
    assert.equal(body.matter_id, matterId);
    assert.equal(body.event_type, "DISCOUNT_REJECTED");
    assert.equal(body.actor, "operator@example.invalid");
    assert.equal(body.client_visible, false);
    return Response.json({ id: matterId }, { status: 201 });
  });

  await assert.rejects(
    applyDiscountToMatter(matterId, "TEST", "operator@example.invalid"),
    /Discount cannot be applied after payment has started/,
  );
  assert.deepEqual(paths, ["GET /rest/v1/deals", "POST /rest/v1/matter_events"]);
});
