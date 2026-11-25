import test from "node:test";
import assert from "node:assert/strict";
import { parseAndLimitPortalRequest, limitPortalMatter } from "@/lib/security/portalAccessGuard";
import type { RequestLimiterDeps } from "@/lib/security/publicRequestLimit";

const url = "https://www.themilanoseal.com/api/portal/confirm";
function request(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "origin": "https://www.themilanoseal.com", "x-forwarded-for": "192.0.2.7", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
function fixture(consume?: RequestLimiterDeps["consume"]) {
  const called: Array<{ scope: string; bucket: string }> = [];
  const deps: RequestLimiterDeps = {
    env: { PUBLIC_REQUEST_LIMIT_HMAC_SECRET: "unit-test-secret" },
    resolveUserId: async () => null,
    consume: async (scope, bucket) => {
      called.push({ scope, bucket });
      return consume ? consume(scope, bucket) : { allowed: true, retryAfterSeconds: 0 };
    },
  };
  return { called, deps };
}
const valid = { token: "11111111-2222-4333-8444-555555555555", email: "CLIENT@EXAMPLE.COM", otp: "a1b2c3" };

test("portal entry normalizes identifiers and consumes client allowance exactly once", async () => {
  const f = fixture();
  const result = await parseAndLimitPortalRequest(request(valid), true, f.deps);
  assert.ok(result.body);
  assert.equal(result.body.email, "client@example.com");
  assert.equal(result.body.otp, "A1B2C3");
  assert.deepEqual(f.called.map((c) => c.bucket), ["portal_auth_client"]);
  assert.match(f.called[0].scope, /^[a-f0-9]{64}$/);
  assert.ok(!f.called[0].scope.includes("192.0.2.7"));
});

test("cross-site, oversized, missing-field and malformed requests never consume quota", async () => {
  const f = fixture();
  for (const [req, status] of [
    [request(valid, { origin: "https://attacker.example" }), 403],
    [request(valid, { "content-length": "9999999" }), 413],
    [request("{", {}), 400],
    [request({ token: "x", email: "" }), 400],
  ] as const) {
    const result = await parseAndLimitPortalRequest(req, false, f.deps);
    assert.equal(result.error?.status, status);
  }
  assert.equal(f.called.length, 0);
});

test("client rate refusal is 429 and carries Retry-After", async () => {
  const f = fixture(async () => ({ allowed: false, retryAfterSeconds: 75 }));
  const r = await parseAndLimitPortalRequest(request(valid), true, f.deps);
  assert.equal(r.error?.status, 429);
  assert.equal(r.error?.headers.get("Retry-After"), "75");
});

test("a failed durable limiter refuses portal access with 503", async () => {
  const f = fixture(async () => { throw Error("database unavailable"); });
  const r = await parseAndLimitPortalRequest(request(valid), true, f.deps);
  assert.equal(r.error?.status, 503);
});

test("missing HMAC key refuses before any database limit call", async () => {
  const f = fixture();
  f.deps.env = {};
  const r = await parseAndLimitPortalRequest(request(valid), true, f.deps);
  assert.equal(r.error?.status, 503);
  assert.equal(f.called.length, 0);
});

test("code sends and attempts share a Matter scope but not a quota bucket", async () => {
  const f = fixture();
  assert.equal(await limitPortalMatter(request(valid), "matter-A", "portal_code_send", f.deps), null);
  assert.equal(await limitPortalMatter(request(valid), "matter-A", "portal_code_attempt", f.deps), null);
  assert.equal(f.called.length, 2);
  assert.equal(f.called[0].scope, f.called[1].scope);
  assert.notEqual(f.called[0].bucket, f.called[1].bucket);
  assert.match(f.called[0].scope, /^[a-f0-9]{64}$/);
});

test("different Matters never share their resend quota", async () => {
  const f = fixture();
  await limitPortalMatter(request(valid), "matter-A", "portal_code_send", f.deps);
  await limitPortalMatter(request(valid), "matter-B", "portal_code_send", f.deps);
  assert.notEqual(f.called[0].scope, f.called[1].scope);
});

test("Matter attempt limit returns 429 with a retry interval", async () => {
  const f = fixture(async () => ({ allowed: false, retryAfterSeconds: 15 }));
  const r = await limitPortalMatter(request(valid), "matter-A", "portal_code_attempt", f.deps);
  assert.equal(r?.status, 429);
  assert.equal(r?.headers.get("Retry-After"), "15");
});

test("Matter quota fails closed on a storage outage", async () => {
  const f = fixture(async () => { throw Error("database unavailable"); });
  const r = await limitPortalMatter(request(valid), "matter-A", "portal_code_send", f.deps);
  assert.equal(r?.status, 503);
});
