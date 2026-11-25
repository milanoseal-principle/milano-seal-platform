import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { authorizePaymentRequest, type PaymentAuthorizationDeps } from "@/lib/payments/authorizePaymentRequest";
import {
  bindIntakePaymentCapability,
  issuePaymentCapability,
  PAYMENT_CAPABILITY_COOKIE,
  PAYMENT_CAPABILITY_TTL_MS,
  verifyPaymentCapability,
} from "@/lib/payments/paymentCapability";
import { issueUploadCapability } from "@/lib/uploads/authorization";

const read = (file: string) => fs.readFileSync(file, "utf8");
const KEY = "test-capability-key-not-real";
const NOW = 1_800_000_000_000;
const ORIGIN = "https://www.themilanoseal.com";
const MATTER = { deal_id: "MS-ITALY-0001", email: "client@example.com" };

const user = (overrides: Partial<User> & { role?: string; disabled?: boolean; confirmed?: boolean } = {}): User =>
  ({
    id: overrides.id ?? "user-1",
    email: overrides.email ?? "someone@example.com",
    email_confirmed_at: overrides.confirmed === false ? null : "2026-01-01T00:00:00Z",
    app_metadata: { role: overrides.role, ...(overrides.disabled ? { disabled: true } : {}) },
    user_metadata: {},
    aud: "authenticated",
    created_at: "2026-01-01T00:00:00Z",
  }) as unknown as User;

function deps(options: { user?: User | null; matter?: typeof MATTER | null; calls?: string[] } = {}): PaymentAuthorizationDeps {
  return {
    getUser: async () => options.user ?? null,
    loadMatter: async (ref) => {
      options.calls?.push(ref);
      return options.matter === undefined ? MATTER : options.matter;
    },
    capabilityKey: () => KEY,
    now: () => NOW,
  };
}

function payRequest(options: { cookie?: string; origin?: string | null; site?: string } = {}) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (options.cookie) headers.cookie = `${PAYMENT_CAPABILITY_COOKIE}=${options.cookie}`;
  if (options.origin !== null) headers.origin = options.origin ?? ORIGIN;
  if (options.site) headers["sec-fetch-site"] = options.site;
  return new Request(`${ORIGIN}/api/deals/${MATTER.deal_id}/pay`, { method: "POST", headers, body: "{}" });
}

const validCap = () => issuePaymentCapability(MATTER.deal_id, KEY, NOW);

test("capability verifies only for its own Matter, scope, key and lifetime", () => {
  const token = validCap();
  assert.equal(verifyPaymentCapability(token, MATTER.deal_id, KEY, NOW), true);
  assert.equal(verifyPaymentCapability(token, "MS-OTHER-0002", KEY, NOW), false, "wrong Matter");
  assert.equal(verifyPaymentCapability(token, MATTER.deal_id, "other-key", NOW), false, "forged key");
  assert.equal(verifyPaymentCapability(token, MATTER.deal_id, KEY, NOW + PAYMENT_CAPABILITY_TTL_MS + 1), false, "expired");
  const [encoded, signature] = token.split(".");
  assert.equal(verifyPaymentCapability(`${encoded}.${signature.slice(0, -2)}xx`, MATTER.deal_id, KEY, NOW), false, "tampered");
  assert.equal(verifyPaymentCapability(`${token}.extra`, MATTER.deal_id, KEY, NOW), false);
  assert.equal(verifyPaymentCapability(issueUploadCapability(MATTER.deal_id, KEY, NOW), MATTER.deal_id, KEY, NOW), false, "upload scope is not payment scope");
  assert.equal(verifyPaymentCapability(token, MATTER.deal_id, null, NOW), false, "no key fails closed");
  assert.equal(verifyPaymentCapability("", MATTER.deal_id, KEY, NOW), false);
});

test("anonymous requests are refused before any Matter lookup", async () => {
  const calls: string[] = [];
  const result = await authorizePaymentRequest(payRequest(), MATTER.deal_id, "retainer", deps({ calls }));
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.response.status, 401);
  assert.deepEqual(calls, [], "no lookup, so existence is not revealed");
});

test("the intake capability authorizes only this Matter's retainer from the same origin", async () => {
  const ok = await authorizePaymentRequest(payRequest({ cookie: validCap() }), MATTER.deal_id, "retainer", deps());
  assert.deepEqual(ok, { ok: true, actor: { kind: "intake_capability" } });

  const cases: Array<[string, Request, string, PaymentAuthorizationDeps]> = [
    ["cross-site", payRequest({ cookie: validCap(), site: "cross-site" }), "retainer", deps()],
    ["missing origin", payRequest({ cookie: validCap(), origin: null }), "retainer", deps()],
    ["foreign origin", payRequest({ cookie: validCap(), origin: "https://evil.example" }), "retainer", deps()],
    ["non-retainer payment", payRequest({ cookie: validCap() }), "final_balance", deps()],
    ["other Matter's capability", payRequest({ cookie: issuePaymentCapability("MS-OTHER-0002", KEY, NOW) }), "retainer", deps()],
  ];
  for (const [label, request, type, d] of cases) {
    const result = await authorizePaymentRequest(request, MATTER.deal_id, type, d);
    assert.equal(result.ok, false, label);
    if (!result.ok) assert.equal(result.response.status, 403, label);
  }
});

test("operators and the Matter owner are authorized; other signed-in users are not", async () => {
  const operator = await authorizePaymentRequest(payRequest(), MATTER.deal_id, "final_balance", deps({ user: user({ role: "admin" }) }));
  assert.equal(operator.ok && operator.actor.kind, "operator");
  const owner = await authorizePaymentRequest(payRequest(), MATTER.deal_id, "final_balance", deps({ user: user({ role: "client", email: "CLIENT@example.com" }) }));
  assert.equal(owner.ok && owner.actor.kind, "owner");
  const otherClient = await authorizePaymentRequest(payRequest(), MATTER.deal_id, "retainer", deps({ user: user({ role: "client", email: "other@example.com" }) }));
  assert.equal(otherClient.ok, false, "cross-client denied");
  if (!otherClient.ok) assert.equal(otherClient.response.status, 403);
  const disabled = await authorizePaymentRequest(payRequest(), MATTER.deal_id, "retainer", deps({ user: user({ role: "admin", disabled: true }) }));
  assert.equal(disabled.ok, false, "disabled operator denied");
  const unknown = await authorizePaymentRequest(payRequest(), "MS-NOPE", "retainer", deps({ user: user({ role: "admin" }), matter: null }));
  assert.equal(!unknown.ok && unknown.response.status, 404, "operators may learn a Matter does not exist");
  // Ownership requires a confirmed email (same rule as lib/portalAuth).
  const unconfirmed = await authorizePaymentRequest(
    payRequest(), MATTER.deal_id, "final_balance",
    deps({ user: user({ role: "client", email: MATTER.email, confirmed: false }) }),
  );
  assert.equal(!unconfirmed.ok && unconfirmed.response.status, 403, "unconfirmed email is not owner authority");
});

test("forged, expired or garbage capabilities are no credential and never trigger a lookup", async () => {
  for (const [label, cookie] of [
    ["garbage", "garbage"],
    ["forged", issuePaymentCapability(MATTER.deal_id, "attacker-key", NOW)],
    ["expired", issuePaymentCapability(MATTER.deal_id, KEY, NOW - PAYMENT_CAPABILITY_TTL_MS - 1)],
    ["upload scope", issueUploadCapability(MATTER.deal_id, KEY, NOW)],
  ] as const) {
    const calls: string[] = [];
    const result = await authorizePaymentRequest(payRequest({ cookie }), MATTER.deal_id, "retainer", deps({ calls }));
    assert.equal(!result.ok && result.response.status, 401, label);
    assert.deepEqual(calls, [], `${label}: no Matter lookup`);
  }
});

test("non-operators cannot distinguish a missing Matter from an unauthorized one", async () => {
  // A valid capability for one Matter probing other identifiers.
  const probe = (matter: typeof MATTER | null) =>
    authorizePaymentRequest(payRequest({ cookie: validCap() }), "MS-2026-0042", "retainer", deps({ matter }));
  const existing = await probe({ deal_id: "MS-2026-0042", email: "x@example.com" });
  const missing = await probe(null);
  assert.equal(!existing.ok && existing.response.status, 403);
  assert.equal(!missing.ok && missing.response.status, 403);
  // Same for a signed-in non-operator.
  const client = await authorizePaymentRequest(payRequest(), "MS-NOPE", "retainer", deps({ user: user({ role: "client" }), matter: null }));
  assert.equal(!client.ok && client.response.status, 403);
});

test("intake binds an httpOnly, SameSite=Strict capability only on success", async () => {
  const saved = process.env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    process.env.SUPABASE_SERVICE_ROLE_KEY = KEY;
    const ok = await bindIntakePaymentCapability(NextResponse.json({ success: true, deal_id: MATTER.deal_id }));
    const cookie = ok.cookies.get(PAYMENT_CAPABILITY_COOKIE);
    assert.ok(cookie, "cookie issued");
    assert.equal(cookie?.httpOnly, true);
    assert.equal(cookie?.sameSite, "strict");
    assert.equal(cookie?.path, "/api");
    assert.equal(verifyPaymentCapability(cookie?.value, MATTER.deal_id, KEY), true, "bound to the created Matter");
    const failed = await bindIntakePaymentCapability(NextResponse.json({ error: "x" }, { status: 400 }));
    assert.equal(failed.cookies.get(PAYMENT_CAPABILITY_COOKIE), undefined);
    const notSuccess = await bindIntakePaymentCapability(NextResponse.json({ success: false, deal_id: MATTER.deal_id }));
    assert.equal(notSuccess.cookies.get(PAYMENT_CAPABILITY_COOKIE), undefined);
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const noKey = await bindIntakePaymentCapability(NextResponse.json({ success: true, deal_id: MATTER.deal_id }));
    assert.equal(noKey.cookies.get(PAYMENT_CAPABILITY_COOKIE), undefined, "no key → no capability (fail closed)");
  } finally {
    if (saved === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = saved;
  }
});

test("pay route authorizes before the shared handler; intake and status are wired", () => {
  const route = read("app/api/deals/[id]/pay/route.ts");
  assert.ok(route.indexOf("authorizePaymentRequest(") < route.indexOf("receivePaymentInstruction(req"));
  assert.match(route, /if \(!authorization\.ok\) return authorization\.response;/);
  assert.match(read("app/api/intake/route.ts"), /bindIntakePaymentCapability\(await bindIntakeUploadCapability\(/);
  const status = read("app/api/public/payment-status/route.ts");
  assert.match(status, /verifyPaymentCapability\(req\.cookies\.get\(PAYMENT_CAPABILITY_COOKIE\)\?\.value, dealId, paymentCapabilityKey\(\)\)/);
  assert.match(status, /if \(!dealId \|\| \(!accessToken && !capabilityValid\)\)/);
  // The capability never appears in a response body or URL.
  assert.doesNotMatch(read("lib/payments/paymentCapability.ts"), /NextResponse\.json\([^)]*capab/i);
});

test("intelligence APIs are operator-only in the proxy and the generator is size-bounded", () => {
  const proxy = read("proxy.ts");
  for (const prefix of ['"/api/intelligence"', '"/api/intel"']) assert.ok(proxy.includes(prefix), prefix);
  assert.match(proxy, /pathname === "\/api\/intel" \|\|\s*pathname\.startsWith\("\/api\/intel\/"\) \|\|\s*pathname === "\/api\/intelligence" \|\|\s*pathname\.startsWith\("\/api\/intelligence\/"\)\) &&\s*!isRouteAllowedForRole\("\/dashboard", role\)/);
  const generate = read("app/api/intelligence/generate/route.ts");
  assert.ok(generate.indexOf("payload_too_large") < generate.indexOf("new Anthropic"), "size check precedes provider client");
  assert.doesNotMatch(generate, /^export const MAX_GENERATE_BODY_BYTES/m);
});
