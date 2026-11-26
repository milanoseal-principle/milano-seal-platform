import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { recordDiscountAuditEvent } from "@/lib/discounts/audit";
import { retiredCompClearResponse } from "@/lib/discounts/compClear";
import { readFileSync } from "node:fs";

const DEAL_ID = "00000000-0000-4000-8000-0000000000d1";
const CODE_ID = "00000000-0000-4000-8000-0000000000c1";

type Call = { path: string; method: string; query: string; body: unknown };

function supabaseFixture(t: TestContext, opts: { dealIdForRef?: Record<string, string>; failEvents?: boolean; paymentConfirmed?: boolean } = {}) {
  const env = { NEXT_PUBLIC_SUPABASE_URL: "https://discount-audit-fixture.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "synthetic-service-role-key" };
  const saved = Object.fromEntries(Object.keys(env).map((k) => [k, process.env[k]]));
  Object.assign(process.env, env);
  t.after(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });
  const calls: Call[] = [];
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    const text = request.method === "GET" || request.method === "HEAD" ? "" : await request.text();
    calls.push({ path: url.pathname, method: request.method, query: url.search, body: text ? JSON.parse(text) : null });
    const wantsObject = (request.headers.get("accept") ?? "").includes("vnd.pgrst.object");
    const one = (row: unknown) => (wantsObject ? Response.json(row) : Response.json(row ? [row] : []));
    switch (url.pathname) {
      case "/rest/v1/deals": {
        if (request.method === "PATCH") return Response.json([], { status: 200 });
        const byId = url.searchParams.get("id")?.replace(/^eq\./, "");
        const byRef = url.searchParams.get("deal_id")?.replace(/^eq\./, "");
        const id = byId === DEAL_ID ? DEAL_ID : byRef ? opts.dealIdForRef?.[byRef] : undefined;
        if (!id) return wantsObject ? Response.json({ code: "PGRST116", message: "0 rows" }, { status: 406 }) : Response.json([]);
        return one({ id, client_id: null, amount_due: 250, payment_confirmed: opts.paymentConfirmed ?? false, payment_status: "unpaid" });
      }
      case "/rest/v1/discount_codes":
        if (request.method === "PATCH") return Response.json([], { status: 200 });
        return one({ id: CODE_ID, code: "COMP100", discount_type: "percentage", discount_value: 100, status: "ACTIVE", usage_count: 0 });
      case "/rest/v1/discount_redemptions":
        return Response.json([], { status: 201 });
      case "/rest/v1/matter_events":
        if (opts.failEvents) return Response.json({ code: "23503", message: "violates foreign key" }, { status: 409 });
        return one({ id: "00000000-0000-4000-8000-0000000000e1" });
      default:
        return Response.json({ code: "42P01", message: "relation does not exist" }, { status: 404 });
    }
  });
  return calls;
}

const eventWrites = (calls: Call[]) => calls.filter((c) => c.path === "/rest/v1/matter_events" && c.method === "POST");

test("discount request audit resolves the Matter to its canonical deals.id (UUID and human reference)", async (t) => {
  const calls = supabaseFixture(t, { dealIdForRef: { "MS-2026-0001": DEAL_ID } });
  for (const matterId of [DEAL_ID, "MS-2026-0001"]) {
    const result = await recordDiscountAuditEvent({ eventType: "DISCOUNT_REQUEST_CREATED", matterId, actorEmail: "ops@example.invalid" });
    assert.ok("data" in result, matterId);
  }
  const writes = eventWrites(calls);
  assert.equal(writes.length, 2);
  for (const w of writes) {
    const row = w.body as { matter_id: string; event_type: string; metadata: { matter_reference: string } };
    assert.equal(row.matter_id, DEAL_ID, "always the verified deals.id");
    assert.equal(row.event_type, "DISCOUNT_REQUEST_CREATED");
  }
  assert.equal((writes[1].body as { metadata: { matter_reference: string } }).metadata.matter_reference, "MS-2026-0001");
  assert.ok(!calls.some((c) => c.path === "/rest/v1/event_ledger"), "the legacy ledger is never written");
});

test("an unresolved Matter reference is never written and fails explicitly", async (t) => {
  const calls = supabaseFixture(t);
  const original = console.error;
  const logged: unknown[] = [];
  console.error = (...args: unknown[]) => void logged.push(args);
  try {
    const result = await recordDiscountAuditEvent({ eventType: "DISCOUNT_REQUEST_APPROVED", matterId: "MS-2099-9999" });
    assert.deepEqual(result, { error: "MATTER_IDENTITY_UNRESOLVED" });
  } finally {
    console.error = original;
  }
  assert.equal(eventWrites(calls).length, 0);
  assert.ok(JSON.stringify(logged).includes("MATTER_IDENTITY_UNRESOLVED"), "observable");
});

test("a canonical write failure is reported, never treated as persisted", async (t) => {
  supabaseFixture(t, { failEvents: true });
  const original = console.error;
  console.error = () => undefined;
  try {
    const result = await recordDiscountAuditEvent({ eventType: "DISCOUNT_REQUEST_DENIED", matterId: DEAL_ID });
    assert.deepEqual(result, { error: "AUDIT_EVENT_NOT_PERSISTED" });
  } finally {
    console.error = original;
  }
});

test("retired comp clear is access-gated and does not call downstream services", async (t) => {
  const previous = process.env.DISCOUNT_ALLOW_OPERATOR_COMP;
  process.env.DISCOUNT_ALLOW_OPERATOR_COMP = "true";
  t.after(() => {
    if (previous === undefined) delete process.env.DISCOUNT_ALLOW_OPERATOR_COMP;
    else process.env.DISCOUNT_ALLOW_OPERATOR_COMP = previous;
  });
  const fetch = t.mock.method(globalThis, "fetch", () => { throw Error("unexpected downstream call"); });
  assert.equal(retiredCompClearResponse(null).status, 401);
  assert.equal(retiredCompClearResponse({ app_metadata: { role: "client" } }).status, 403);
  const retired = retiredCompClearResponse({ app_metadata: { role: "founder" } });
  assert.equal(retired.status, 410);
  assert.equal(retired.headers.get("cache-control"), "no-store");
  assert.equal((await retired.json()).code, "USE_GOVERNED_COMPLIMENTARY_AUTHORIZATION");
  assert.equal(fetch.mock.callCount(), 0);
  const route = readFileSync("app/api/admin/discounts/comp-clear/route.ts", "utf8");
  assert.match(route, /auth\.getUser\(\)/);
  assert.match(route, /return retiredCompClearResponse\(user\)/);
  assert.doesNotMatch(route, /createAdminClient|\.from\(|\.rpc\(|request\.(json|text)|recordSecurityEvent/);
  const control = readFileSync("components/dashboard/OperatorCompClearControl.tsx", "utf8");
  assert.doesNotMatch(control, /comp-clear|fetch\(/);
});
