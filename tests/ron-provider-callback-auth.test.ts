import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { verifyBNWebhookAuth } from "@/lib/bluenotary/webhook";

// B06: the BlueNotary webhook secret is compared in constant time; the Bearer protocol is unchanged.

const request = (authorization?: string) => new Request("https://example.invalid/api/webhooks/bluenotary", { method: "POST", headers: authorization === undefined ? {} : { authorization } });

function withSecret(value: string | undefined, run: () => void) {
  const previous = process.env.BLUENOTARY_WEBHOOK_SECRET;
  if (value === undefined) delete process.env.BLUENOTARY_WEBHOOK_SECRET; else process.env.BLUENOTARY_WEBHOOK_SECRET = value;
  try { run(); } finally {
    if (previous === undefined) delete process.env.BLUENOTARY_WEBHOOK_SECRET; else process.env.BLUENOTARY_WEBHOOK_SECRET = previous;
  }
}

test("webhook auth accepts only the exact Bearer secret and reports misconfiguration separately", () => {
  withSecret("synthetic-secret-value", () => {
    assert.deepEqual(verifyBNWebhookAuth(request("Bearer synthetic-secret-value")), { ok: true });
    for (const header of [undefined, "", "Bearer", "Bearer ", "Bearer synthetic-secret-valu", "Bearer  synthetic-secret-value", "Bearer synthetic-secret-valueX", "bearer synthetic-secret-value", "synthetic-secret-value", "Bearer SYNTHETIC-SECRET-VALUE", "Bearer undefined"]) {
      assert.deepEqual(verifyBNWebhookAuth(request(header)), { ok: false, status: 401, reason: "unauthorized" }, String(header));
    }
  });
  for (const missing of [undefined, ""]) {
    withSecret(missing, () => {
      assert.deepEqual(verifyBNWebhookAuth(request("Bearer ")), { ok: false, status: 500, reason: "misconfigured" });
      assert.deepEqual(verifyBNWebhookAuth(request("Bearer undefined")), { ok: false, status: 500, reason: "misconfigured" });
    });
  }
});

test("the comparison is constant-time and the route uses it before reading the body", () => {
  const helper = fs.readFileSync("lib/bluenotary/webhook.ts", "utf8");
  assert.match(helper, /timingSafeEqual\(digest\(authHeader\), digest\(`Bearer \$\{secret\}`\)\)/);
  assert.doesNotMatch(helper, /authHeader\s*[!=]==/);
  const route = fs.readFileSync("app/api/webhooks/bluenotary/route.ts", "utf8");
  const post = route.slice(route.indexOf("export async function POST"));
  assert.ok(post.indexOf("verifyBNWebhookAuth(request)") > 0 && post.indexOf("verifyBNWebhookAuth(request)") < post.indexOf("request.json()"));
  assert.doesNotMatch(route, /[!=]==\s*`Bearer/, "no direct string comparison of the secret remains");
  assert.match(post, /status: 500/);
  assert.match(post, /status: 401/);
});
