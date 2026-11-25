import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { NextRequest } from "next/server";
import { MAX_INTAKE_BODY_BYTES, guardIntakeSubmission } from "@/lib/intake/intakeSubmissionGuard";
import {
  enforcePublicRequestLimit,
  requestLimitScope,
  type ConsumeLimit,
  type RequestLimitDecision,
} from "@/lib/security/publicRequestLimit";

const ORIGIN = "https://www.themilanoseal.com";
const ENV = { PUBLIC_REQUEST_LIMIT_HMAC_SECRET: "test-secret" };

/** In-memory model of consume_public_request_limit: one atomic counter per (scope, bucket). */
function counterStore(ceilings: Record<string, number>, fail = false) {
  const counts = new Map<string, number>();
  const calls: [string, string][] = [];
  const consume: ConsumeLimit = async (scope, bucket) => {
    calls.push([scope, bucket]);
    await Promise.resolve();
    if (fail) throw Error("storage down");
    const key = `${scope}|${bucket}`;
    const n = (counts.get(key) ?? 0) + 1;
    counts.set(key, n);
    return { allowed: n <= ceilings[bucket], retryAfterSeconds: n <= ceilings[bucket] ? 0 : 1800 };
  };
  return { consume, calls, counts };
}

const intakeRequest = (body: unknown, headers: Record<string, string> = { origin: ORIGIN }) =>
  new NextRequest(`${ORIGIN}/api/intake`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.10", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

function intakeDeps(store: ReturnType<typeof counterStore>, operator = false) {
  return {
    isOperator: async () => operator,
    limit: (req: Request) =>
      enforcePublicRequestLimit(req, { client: "intake_submit" }, { env: ENV, resolveUserId: async () => null, consume: store.consume }),
  };
}

test("scope is an HMAC of the user id or client address; raw values are never used", () => {
  const req = intakeRequest({});
  const anon = requestLimitScope(req, null, ENV);
  const user = requestLimitScope(req, "2a3b0c1e-0000-4000-8000-000000000001", ENV);
  assert.match(anon!, /^[0-9a-f]{64}$/);
  assert.match(user!, /^[0-9a-f]{64}$/);
  assert.notEqual(anon, user);
  assert.doesNotMatch(anon!, /198\.51/);
  assert.equal(requestLimitScope(req, null, {}), null, "no secret -> no scope (fail closed)");
});

test("limiter: client bucket first, global only when the client is allowed; failures fail closed", async () => {
  const store = counterStore({ assistant: 1, assistant_global: 100 });
  const deps = { env: ENV, resolveUserId: async () => null, consume: store.consume };
  const buckets = { client: "assistant", global: "assistant_global" } as const;
  assert.deepEqual(await enforcePublicRequestLimit(intakeRequest({}), buckets, deps), { allowed: true });
  const denied = await enforcePublicRequestLimit(intakeRequest({}), buckets, deps);
  assert.equal(denied.allowed, false);
  assert.equal((denied as { status: number }).status, 429);
  assert.deepEqual(store.calls.map(([, b]) => b), ["assistant", "assistant_global", "assistant"], "a client-denied request spends no global budget");
  assert.ok(store.calls.filter(([, b]) => b === "assistant_global").every(([s]) => s === "global"));

  assert.deepEqual(await enforcePublicRequestLimit(intakeRequest({}), buckets, { ...deps, consume: counterStore({}, true).consume }), { allowed: false, status: 503 });
  assert.deepEqual(await enforcePublicRequestLimit(intakeRequest({}), buckets, { ...deps, env: {} }), { allowed: false, status: 503 });
});

test("authenticated users are limited by account, anonymous callers by address", async () => {
  const store = counterStore({ intake_submit: 5 });
  const asUser = { env: ENV, resolveUserId: async () => "2a3b0c1e-0000-4000-8000-000000000001", consume: store.consume };
  await enforcePublicRequestLimit(intakeRequest({}, { origin: ORIGIN, "x-forwarded-for": "203.0.113.1" }), { client: "intake_submit" }, asUser);
  await enforcePublicRequestLimit(intakeRequest({}, { origin: ORIGIN, "x-forwarded-for": "203.0.113.2" }), { client: "intake_submit" }, asUser);
  assert.equal(new Set(store.calls.map(([s]) => s)).size, 1, "same account across addresses shares one budget");
});

test("normal submission passes with its body intact; an existing customer's retry within the limit passes", async () => {
  const store = counterStore({ intake_submit: 5 });
  const payload = { name: "Client", email: "client@example.com", country: "Italy" };
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const result = await guardIntakeSubmission(intakeRequest(payload), intakeDeps(store));
    assert.equal(result.ok, true, `attempt ${attempt}`);
    if (result.ok) assert.deepEqual(await result.request.json(), payload);
  }
});

test("excessive submissions are refused with 429 + Retry-After and success:false", async () => {
  const store = counterStore({ intake_submit: 5 });
  const results = [];
  for (let i = 0; i < 7; i += 1) results.push(await guardIntakeSubmission(intakeRequest({ email: "a@example.com" }), intakeDeps(store)));
  assert.equal(results.filter((r) => r.ok).length, 5);
  const refused = results.find((r) => !r.ok);
  assert.ok(refused && !refused.ok);
  assert.equal(refused.response.status, 429);
  assert.equal(refused.response.headers.get("retry-after"), "1800");
  const body = await refused.response.json();
  assert.equal(body.success, false);
  assert.equal(body.code, "INTAKE_RATE_LIMITED");
  assert.equal(typeof body.error, "string");
});

test("parallel submissions cannot exceed the limit", async () => {
  const store = counterStore({ intake_submit: 5 });
  const results = await Promise.all(Array.from({ length: 25 }, () => guardIntakeSubmission(intakeRequest({ email: "a@example.com" }), intakeDeps(store))));
  assert.equal(results.filter((r) => r.ok).length, 5);
  assert.equal(store.counts.size, 1);
});

test("invalid origin, oversized and invalid JSON are refused before any limit is consumed", async () => {
  const cases: [string, NextRequest, number, string][] = [
    ["foreign origin", intakeRequest({ email: "a@example.com" }, { origin: "https://evil.example" }), 403, "INTAKE_FOREIGN_ORIGIN"],
    ["declared oversize", intakeRequest({ email: "a@example.com" }, { origin: ORIGIN, "content-length": String(MAX_INTAKE_BODY_BYTES + 1) }), 413, "INTAKE_PAYLOAD_TOO_LARGE"],
    ["actual oversize", intakeRequest({ notes: "x".repeat(MAX_INTAKE_BODY_BYTES) }), 413, "INTAKE_PAYLOAD_TOO_LARGE"],
    ["invalid JSON", intakeRequest("{nope"), 400, "INTAKE_INVALID_JSON"],
    ["array body", intakeRequest([1]), 400, "INTAKE_INVALID_JSON"],
  ];
  for (const [name, request, status, code] of cases) {
    const store = counterStore({ intake_submit: 5 });
    const result = await guardIntakeSubmission(request, intakeDeps(store));
    assert.ok(!result.ok, name);
    if (result.ok) continue;
    assert.equal(result.response.status, status, name);
    const body = await result.response.json();
    assert.equal(body.code, code, name);
    assert.equal(body.success, false, name);
    assert.equal(store.calls.length, 0, `${name}: no limit consumed`);
  }
});

test("storage failure never reports a successful intake", async () => {
  const result = await guardIntakeSubmission(intakeRequest({ email: "a@example.com" }), intakeDeps(counterStore({}, true)));
  assert.ok(!result.ok);
  if (result.ok) return;
  assert.equal(result.response.status, 503);
  const body = await result.response.json();
  assert.equal(body.success, false);
  assert.equal(body.code, "INTAKE_LIMIT_UNAVAILABLE");
});

test("authorized operators creating Matters are not subject to the public per-client limit", async () => {
  const store = counterStore({ intake_submit: 0 });
  const result = await guardIntakeSubmission(intakeRequest({ email: "a@example.com" }), intakeDeps(store, true));
  assert.equal(result.ok, true);
  assert.equal(store.calls.length, 0);
  // A failing operator lookup is treated as not-an-operator (limited), never as an exemption.
  const failing = { isOperator: async () => { throw Error("auth down"); }, limit: async (): Promise<RequestLimitDecision> => ({ allowed: false, status: 503 }) };
  const refused = await guardIntakeSubmission(intakeRequest({ email: "a@example.com" }), failing);
  assert.equal(refused.ok, false);
});

test("wiring: the intake route guards before canonical intake; the migration owns ceilings", () => {
  const route = readFileSync("app/api/intake/route.ts", "utf8");
  assert.match(route, /const guarded = await guardIntakeSubmission\(request,/);
  assert.match(route, /if \(!guarded\.ok\) return guarded\.response;[\s\S]*canonicalPost\(guarded\.request\)/);
  assert.match(route, /client: "intake_submit"/);
  const migration = readFileSync("supabase/migrations/20261125120000_public_request_limits.sql", "utf8");
  for (const bucket of ["assistant", "assistant_global", "intake_extract", "intake_extract_global", "intake_submit"]) {
    assert.match(migration, new RegExp(`\\('${bucket}',`), bucket);
  }
  assert.match(migration, /revoke all on function public\.consume_public_request_limit\(text, text\) from public, anon, authenticated;/);
});
