import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  MAX_SALES_CAPTURE_BODY_BYTES,
  SALES_CAPTURE_LIMIT,
  receiveSalesCapture,
} from "@/lib/acquisition/salesCapture";
import { enforcePublicRequestLimit, type RequestLimitDecision } from "@/lib/security/publicRequestLimit";

const ORIGIN = "https://www.themilanoseal.com";

function fakeAdmin(limit: () => Promise<RequestLimitDecision> = async () => ({ allowed: true })) {
  const state = { inserted: [] as Record<string, unknown>[], limited: 0, reads: 0 };
  const admin = {
    from(table: string) {
      assert.equal(table, "sales_leads");
      return {
        select() {
          state.reads += 1;
          throw new Error("the limit is never a count-then-insert on sales_leads");
        },
        insert(row: Record<string, unknown>) {
          state.inserted.push(row);
          return { select: () => ({ single: () => Promise.resolve({ data: { id: "lead-1" }, error: null }) }) };
        },
      };
    },
  };
  return {
    state,
    deps: {
      admin: () => admin as unknown as SupabaseClient,
      hashIp: () => "iphash-1",
      limit: async () => {
        state.limited += 1;
        return limit();
      },
    },
  };
}

const req = (body: unknown, headers: Record<string, string> = { origin: ORIGIN }) =>
  new Request(`${ORIGIN}/api/sales/capture`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

test("application capture consumes one durable allowance and persists one lead", async () => {
  const f = fakeAdmin();
  const res = await receiveSalesCapture(req({ email: "a@example.com", desired_next_step: "va_application" }), f.deps);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.leadType, "va_application");
  assert.equal(f.state.limited, 1);
  assert.equal(f.state.reads, 0, "no count query");
  assert.equal(f.state.inserted.length, 1);
  assert.equal(f.state.inserted[0].ip_hash, "iphash-1");
  for (const key of ["role", "payment_status", "deal_id", "matter_id"]) assert.ok(!(key in f.state.inserted[0]), `lead only: ${key}`);
});

test("abuse controls refuse before any lead is written; malformed requests spend no allowance", async () => {
  const cases: [string, Request, number][] = [
    ["foreign origin", req({ email: "a@example.com" }, { origin: "https://evil.example" }), 403],
    ["declared oversize", req({ email: "a@example.com" }, { origin: ORIGIN, "content-length": String(MAX_SALES_CAPTURE_BODY_BYTES + 1) }), 413],
    ["actual oversize", req({ email: "a@example.com", notes: "x".repeat(MAX_SALES_CAPTURE_BODY_BYTES) }), 413],
    ["malformed", req("{nope"), 400],
    ["array body", req([{ email: "a@example.com" }]), 400],
    ["missing email", req({ full_name: "A" }), 400],
  ];
  for (const [name, request, status] of cases) {
    const f = fakeAdmin();
    const res = await receiveSalesCapture(request, f.deps);
    assert.equal(res.status, status, name);
    assert.equal((await res.json()).ok, false, name);
    assert.equal(f.state.inserted.length, 0, `${name}: nothing persisted`);
    assert.equal(f.state.limited, 0, `${name}: no allowance consumed`);
  }
});

test("durable limit: 429 with Retry-After, limiter outage 503; neither writes a lead", async () => {
  const limited = fakeAdmin(async () => ({ allowed: false, status: 429, retryAfterSeconds: 900, bucket: "public_signup" }));
  const res = await receiveSalesCapture(req({ email: "a@example.com" }), limited.deps);
  assert.equal(res.status, 429);
  assert.equal(res.headers.get("retry-after"), "900");
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.equal(limited.state.inserted.length, 0);

  const down = fakeAdmin(async () => ({ allowed: false, status: 503 }));
  const unavailable = await receiveSalesCapture(req({ email: "a@example.com" }), down.deps);
  assert.equal(unavailable.status, 503);
  assert.equal((await unavailable.json()).ok, false);
  assert.equal(down.state.inserted.length, 0);
});

test("sales capture uses the atomic public_signup bucket under its own namespace", async () => {
  assert.deepEqual(SALES_CAPTURE_LIMIT, { client: "public_signup", namespace: "sales_capture" });
  const consumed: [string, string][] = [];
  const deps = {
    env: { PUBLIC_REQUEST_LIMIT_HMAC_SECRET: "synthetic-secret" },
    resolveUserId: async () => null,
    consume: async (scope: string, bucket: string) => {
      consumed.push([scope, bucket]);
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
  const request = () => new Request(`${ORIGIN}/api/sales/capture`, { headers: { "x-forwarded-for": "203.0.113.7" } });
  await enforcePublicRequestLimit(request(), SALES_CAPTURE_LIMIT, deps);
  await enforcePublicRequestLimit(request(), { client: "public_signup" }, deps);
  assert.equal(consumed[0][1], "public_signup");
  assert.match(consumed[0][0], /^[0-9a-f]{64}$/);
  assert.notEqual(consumed[0][0], consumed[1][0], "independent of the other signup forms for the same client");
});
