import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ASSISTANT_MAX_BODY_BYTES,
  ASSISTANT_MAX_MESSAGE_CHARS,
  ASSISTANT_MAX_OUTPUT_TOKENS,
  ASSISTANT_MODEL,
  handleAssistantRequest,
  type AssistantProviderRequest,
} from "@/lib/assistant/assistantHandler";

const ORIGIN = "https://www.themilanoseal.com";
const ENV = { ANTHROPIC_API_KEY: "test-placeholder-not-a-key" };

function provider(reply = "Preliminary route: please continue to secure intake.") {
  const calls: AssistantProviderRequest[] = [];
  return {
    calls,
    createMessage: async (request: AssistantProviderRequest) => {
      calls.push(request);
      return { content: [{ type: "text", text: reply }] };
    },
  };
}

function req(body: unknown, headers: Record<string, string> = {}) {
  const raw = typeof body === "string" ? body : JSON.stringify(body);
  return new Request(`${ORIGIN}/api/assistant`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN, ...headers },
    body: raw,
  });
}

test("same-origin public request reaches the provider once with bounded output", async () => {
  const p = provider();
  const res = await handleAssistantRequest(req({ message: "Apostille for Italy?", role: "PUBLIC", context: { destination_country: "IT", secret: "x" } }), { env: ENV, createMessage: p.createMessage });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).reply, "Preliminary route: please continue to secure intake.");
  assert.equal(p.calls.length, 1);
  assert.equal(p.calls[0].model, ASSISTANT_MODEL);
  assert.equal(p.calls[0].max_tokens, ASSISTANT_MAX_OUTPUT_TOKENS);
  assert.match(p.calls[0].system, /"destination_country":"IT"/);
  assert.doesNotMatch(p.calls[0].system, /secret/);
});

test("every refusal happens before the paid provider call and carries a readable reply", async () => {
  const cases: [string, Request, Record<string, string | undefined>, number, string][] = [
    ["off-switch", req({ message: "hi" }), { ...ENV, ASSISTANT_ENABLED: "false" }, 503, "ASSISTANT_DISABLED"],
    ["no provider key", req({ message: "hi" }), {}, 503, "ASSISTANT_UNCONFIGURED"],
    ["cross-site fetch metadata", req({ message: "hi" }, { "sec-fetch-site": "cross-site" }), ENV, 403, "ASSISTANT_CROSS_SITE_REFUSED"],
    ["foreign origin", req({ message: "hi" }, { origin: "https://evil.example" }), ENV, 403, "ASSISTANT_CROSS_SITE_REFUSED"],
    ["declared oversize", req({ message: "hi" }, { "content-length": String(ASSISTANT_MAX_BODY_BYTES + 1) }), ENV, 413, "ASSISTANT_PAYLOAD_TOO_LARGE"],
    ["actual oversize", req({ message: "hi", pad: "x".repeat(ASSISTANT_MAX_BODY_BYTES) }), ENV, 413, "ASSISTANT_PAYLOAD_TOO_LARGE"],
    ["message too long", req({ message: "y".repeat(ASSISTANT_MAX_MESSAGE_CHARS + 1) }), ENV, 413, "ASSISTANT_MESSAGE_TOO_LONG"],
    ["context too large", req({ message: "hi", context: { pathname: "/".repeat(2100) } }), ENV, 413, "ASSISTANT_CONTEXT_TOO_LARGE"],
    ["malformed json", req("{not json"), ENV, 400, "ASSISTANT_INVALID_JSON"],
    ["array body", req([1, 2]), ENV, 400, "ASSISTANT_INVALID_JSON"],
  ];
  for (const [name, request, env, status, code] of cases) {
    const p = provider();
    const res = await handleAssistantRequest(request, { env, createMessage: p.createMessage });
    const body = await res.json();
    assert.equal(res.status, status, name);
    assert.equal(body.code, code, name);
    assert.equal(typeof body.reply, "string", `${name}: widgets render reply`);
    assert.equal(res.headers.get("cache-control"), "no-store", name);
    assert.equal(p.calls.length, 0, `${name}: provider must not be called`);
  }
});

test("missing Origin is allowed only with same-origin fetch metadata", async () => {
  const noOrigin = (site?: string) =>
    new Request(`${ORIGIN}/api/assistant`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(site ? { "sec-fetch-site": site } : {}) },
      body: JSON.stringify({ message: "hi" }),
    });
  const denied = provider();
  assert.equal((await handleAssistantRequest(noOrigin(), { env: ENV, createMessage: denied.createMessage })).status, 403);
  assert.equal(denied.calls.length, 0);
  const allowed = provider();
  assert.equal((await handleAssistantRequest(noOrigin("same-origin"), { env: ENV, createMessage: allowed.createMessage })).status, 200);
  assert.equal(allowed.calls.length, 1);
});

test("empty prompt and unknown role never spend a provider call beyond PUBLIC scope", async () => {
  const empty = provider();
  const res = await handleAssistantRequest(req({ message: "   " }), { env: ENV, createMessage: empty.createMessage });
  assert.equal(res.status, 200);
  assert.equal(empty.calls.length, 0);

  const unknown = provider();
  await handleAssistantRequest(req({ message: "hi", role: "ROOT", context: { matter_id: "MS-1", signer_name: "A" } }), { env: ENV, createMessage: unknown.createMessage });
  assert.equal(unknown.calls.length, 1);
  // Unknown roles fall back to PUBLIC: DASHBOARD-only keys are not forwarded.
  assert.doesNotMatch(unknown.calls[0].system, /signer_name|MS-1/);
});

test("provider failure returns 500 with the unavailable reply", async () => {
  const res = await handleAssistantRequest(req({ message: "hi" }), {
    env: ENV,
    createMessage: async () => {
      throw new Error("provider down");
    },
  });
  assert.equal(res.status, 500);
  assert.match((await res.json()).reply, /temporarily unavailable/);
});

test("route wiring: the provider client is created only inside the guarded handler", () => {
  const route = readFileSync("app/api/assistant/route.ts", "utf8");
  assert.match(route, /handleAssistantRequest\(req,/);
  assert.doesNotMatch(route, /^const client = new Anthropic/m);
});
