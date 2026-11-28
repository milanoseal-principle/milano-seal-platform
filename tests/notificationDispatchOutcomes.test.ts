import assert from "node:assert/strict";
import test from "node:test";
import { reconcileCanonicalNotifications, sendPaymentClearedAlerts } from "@/lib/notifications/transactionalEmailAlerts";

test("notification dispatch preserves uncertainty and fences concurrent retries", async (t) => {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: "https://notification-fixture.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "synthetic-service-key",
    RESEND_API_KEY: "synthetic-resend-key",
  };
  const previous = Object.fromEntries(Object.keys(env).map((key) => [key, process.env[key]]));
  Object.assign(process.env, env);
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  type Row = Record<string, unknown>;
  const rows = new Map<string, Row>();
  const sends = new Map<string, number>();
  const outcomes = new Map<string, number | "network" | "missing">();
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    if (url.hostname === "api.resend.com") {
      const recipient = (await request.json()).to as string;
      sends.set(recipient, (sends.get(recipient) ?? 0) + 1);
      const outcome = outcomes.get(recipient) ?? 200;
      if (outcome === "network") throw new TypeError("synthetic network interruption");
      if (outcome === "missing") return Response.json({});
      if (outcome === 200) return Response.json({ id: "synthetic-provider-id" });
      return Response.json({ name: "application_error", message: "synthetic provider response", statusCode: outcome }, { status: outcome });
    }
    assert.equal(url.hostname, "notification-fixture.supabase.co");
    if (url.pathname.endsWith("/rpc/pending_matter_notification_events")) return Response.json([]);
    assert.ok(url.pathname.endsWith("/notifications"));
    if (request.method === "POST") {
      const row = await request.json() as Row;
      const key = String(row.idempotency_key);
      if (rows.has(key)) return Response.json({ code: "23505" }, { status: 409 });
      rows.set(key, { ...row, id: key, next_send_at: "2000-01-01", send_claim: null });
      return new Response(null, { status: 201 });
    }
    const filters = [...url.searchParams].filter(([name]) => !["select", "order", "limit"].includes(name));
    const matches = (row: Row) => filters.every(([field, value]) => {
      const actual = row[field];
      if (value === "is.null") return actual == null;
      if (value === "not.is.null") return actual != null;
      if (value.startsWith("in.(")) return value.slice(4, -1).split(",").includes(String(actual));
      if (value.startsWith("lt.")) return typeof actual === "number"
        ? actual < Number(value.slice(3)) : typeof actual === "string" && actual < value.slice(3);
      if (value.startsWith("lte.")) return String(actual) <= value.slice(4);
      assert.ok(value.startsWith("eq."), value);
      return String(actual) === value.slice(3);
    });
    // Parse the body before filtering so a competing PATCH cannot use a stale row snapshot.
    const patch = request.method === "PATCH" ? await request.json() : null;
    const selected = [...rows.values()].filter(matches);
    if (patch) for (const row of selected) Object.assign(row, patch);
    return Response.json(selected);
  });

  for (const [i, outcome] of ["network", "missing", 408, 409, 500, 429, 422, 200].entries()) {
    const clientEmail = `client-${i}@example.invalid`;
    outcomes.set(clientEmail, outcome as number | "network" | "missing");
    const input = { matterId: `fixture-${i}`, matterReference: "Fixture", clientEmail, amountPaid: 1 };
    await Promise.all([sendPaymentClearedAlerts(input), sendPaymentClearedAlerts(input)]);
    const row = rows.get(`${input.matterId}:client_payment_confirmed:${clientEmail}`);
    assert.ok(row);
    assert.equal(sends.get(clientEmail), 1);
    if (outcome === 200) {
      assert.equal(row.delivery_status, "provider_accepted");
      assert.equal(row.provider_message_id, "synthetic-provider-id");
    } else if (outcome === 429 || outcome === 422) {
      assert.equal(row.delivery_status, "failed");
      assert.equal(row.send_claim, null);
      row.next_send_at = "2000-01-01";
      await sendPaymentClearedAlerts(input);
      assert.equal(sends.get(clientEmail), 2);
    } else {
      assert.equal(row.delivery_status, "unknown");
      assert.ok(row.send_claim);
      await sendPaymentClearedAlerts(input);
      assert.equal(sends.get(clientEmail), 1);
    }
  }

  rows.set("interrupted", {
    id: "interrupted", delivery_status: "pending", send_claim: "prior-worker",
    send_claimed_at: "2000-01-01", provider_message_id: null,
  });
  const reconciled = await reconcileCanonicalNotifications();
  assert.equal(reconciled.newly_uncertain, 1);
  assert.equal(rows.get("interrupted")?.delivery_status, "unknown");
  assert.equal(rows.get("interrupted")?.send_claim, "prior-worker");
  assert.equal(rows.get("interrupted")?.error_classification, "send_outcome_unrecorded");
  assert.equal((await reconcileCanonicalNotifications()).newly_uncertain, 0);
});
