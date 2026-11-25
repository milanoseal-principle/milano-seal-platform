import assert from "node:assert/strict";
import { test } from "node:test";
import { GET, POST } from "@/app/api/verify/[verificationId]/route";
import { POST as apply } from "@/app/api/notary/apply/route";
import { POST as createProfile } from "@/app/api/professional/profile/route";
import { generatePublicVerificationId } from "@/lib/security/publicVerificationId";
import { requestLimitScope } from "@/lib/security/publicRequestLimit";

const site = "https://www.themilanoseal.com";
const params = { params: Promise.resolve({ verificationId: "MS-2026-ABCDEF12" }) };

test("cross-origin public registrations are rejected before any database work", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", () => {
    throw Error("unexpected downstream request");
  });
  for (const submit of [apply, createProfile]) {
    const response = await submit(new Request(site, {
      method: "POST",
      headers: { origin: "https://other.example" },
    }));
    assert.equal(response.status, 403);
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test("verification methods share a durable quota and stop before record access", async (t) => {
  const values = {
    NEXT_PUBLIC_SUPABASE_URL: "https://fixture.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    PUBLIC_REQUEST_LIMIT_HMAC_SECRET: "test-limit-key",
  };
  for (const [name, value] of Object.entries(values)) {
    const previous = process.env[name];
    process.env[name] = value;
    t.after(() => {
      if (previous === undefined) delete process.env[name];
      else process.env[name] = previous;
    });
  }
  const buckets: unknown[] = [];
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    assert.equal(new URL(request.url).pathname, "/rest/v1/rpc/consume_public_request_limit");
    buckets.push(await request.json());
    return Response.json([{ allowed: false, retry_after_seconds: 25 }]);
  });

  for (const lookup of [GET, POST]) {
    const response = await lookup(new Request(site, { headers: { "x-forwarded-for": "192.0.2.1" } }), params);
    assert.equal(response.status, 429);
    assert.equal(response.headers.get("Retry-After"), "25");
  }
  assert.equal(buckets.length, 2);
  assert.deepEqual(buckets[0], buckets[1]);
  assert.match(JSON.stringify(buckets[0]), /"p_bucket":"verify_lookup"/);
});

test("new verification references are opaque and Alliance HMACs are purpose-scoped", () => {
  const first = generatePublicVerificationId();
  const second = generatePublicVerificationId();
  assert.match(first, /^MS-\d{4}-[A-F0-9]{32}$/);
  assert.notEqual(first, second);
  const request = new Request(site, { headers: { "x-forwarded-for": "192.0.2.1" } });
  const env = { PUBLIC_REQUEST_LIMIT_HMAC_SECRET: "test-limit-key" };
  const alliance = requestLimitScope(request, null, env, "alliance");
  assert.match(alliance ?? "", /^[a-f0-9]{64}$/);
  assert.notEqual(alliance, requestLimitScope(request, null, env));
  assert.equal(alliance, requestLimitScope(request, null, env, "alliance"));
  assert.equal(requestLimitScope(request, null, {}, "alliance"), null);
});
