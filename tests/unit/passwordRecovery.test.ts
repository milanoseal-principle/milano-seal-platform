import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { classifyRecoveryResult, INVALID_EMAIL_OUTCOME, isPlausibleEmail } from "@/lib/auth/passwordRecovery";

// 2026-11-15 production Auth log: Client B's POST /recover returned HTTP 429
// over_email_send_rate_limit, yet the route answered { ok: true } and the page said "Check your
// email". Supabase returns { error } (it does not throw), so the old try/catch never saw it.

test("an accepted request is the only success", () => {
  assert.deepEqual(classifyRecoveryResult(null), { status: 200, body: { ok: true } });
  assert.deepEqual(classifyRecoveryResult(undefined), { status: 200, body: { ok: true } });
});

test("provider rate limits are reported as retryable, never as sent", () => {
  for (const error of [{ status: 429 }, { code: "over_email_send_rate_limit" }, { status: 400, code: "over_request_rate_limit" }]) {
    const outcome = classifyRecoveryResult(error);
    assert.equal(outcome.status, 429);
    assert.equal(outcome.body.ok, false);
    assert.equal(outcome.body.ok === false && outcome.body.code, "RATE_LIMITED");
  }
});

test("other provider failures are unavailable, with no account or provider detail", () => {
  const outcome = classifyRecoveryResult({ status: 500, code: "unexpected_failure" });
  assert.equal(outcome.status, 503);
  assert.equal(outcome.body.ok === false && outcome.body.code, "RECOVERY_UNAVAILABLE");
  assert.doesNotMatch(JSON.stringify(outcome), /registered|not found|exists|unexpected_failure|smtp/i);
});

test("invalid addresses are rejected before contacting the provider", () => {
  for (const bad of ["", "nobody", "a@b", "a b@c.com", `${"x".repeat(250)}@a.com`]) assert.equal(isPlausibleEmail(bad), false, bad);
  assert.equal(isPlausibleEmail("themilanoseal+clientb@gmail.com"), true);
  assert.equal(INVALID_EMAIL_OUTCOME.status, 400);
});

test("route uses the returned Supabase error, keeps the recovery redirect, and the page shows success only when accepted", () => {
  const route = fs.readFileSync("app/api/auth/password/reset-request/route.ts", "utf8");
  const page = fs.readFileSync("app/forgot-password/page.tsx", "utf8");
  assert.match(route, /const \{ error \} = await supabase\.auth\.resetPasswordForEmail/);
  assert.match(route, /redirectTo: `\$\{origin\}\/auth\/recovery`/);
  assert.match(route, /classifyRecoveryResult\(error/);
  assert.doesNotMatch(route, /service_role|SUPABASE_SERVICE_ROLE_KEY|createAdminClient/, "no privileged client in recovery");
  assert.doesNotMatch(route, /console\.\w+\([^)]*email/, "the address is never logged");
  assert.match(page, /if \(response\.ok && result\?\.ok === true\) setSent\(true\)/);
  assert.match(page, /role="alert"/);
});
