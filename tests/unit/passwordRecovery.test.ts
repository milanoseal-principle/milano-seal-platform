import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { classifyRecoveryResult, INVALID_EMAIL_OUTCOME, isPlausibleEmail, RECOVERY_UNREACHABLE_OUTCOME } from "@/lib/auth/passwordRecovery";

// 2026-11-15 production Auth log: Client B's POST /recover returned HTTP 429
// over_email_send_rate_limit, yet the route answered { ok: true } and the page said "Check your
// email". Supabase returns { error } (it does not throw), so the old try/catch never saw it.

test("an accepted request is the only success", () => {
  assert.deepEqual(classifyRecoveryResult(null), { status: 200, body: { ok: true } });
  assert.deepEqual(classifyRecoveryResult(undefined), { status: 200, body: { ok: true } });
});

test("account-dependent provider errors are indistinguishable from an accepted request (no enumeration)", () => {
  // Supabase only checks mail cooldowns / send caps / SMTP for registered users, so these errors
  // would reveal that an address exists if they reached the caller.
  for (const error of [
    { status: 429, code: "over_email_send_rate_limit" },
    { status: 429 },
    { status: 500, code: "unexpected_failure" },
    { status: 500 },
  ]) {
    const outcome = classifyRecoveryResult(error);
    assert.equal(outcome.status, 200);
    assert.deepEqual(outcome.body, classifyRecoveryResult(null).body);
    assert.ok(outcome.withheldCode, "withheld code is kept for server-side logging");
  }
});

test("address-independent refusals are reported, never as sent", () => {
  const limited = classifyRecoveryResult({ status: 429, code: "over_request_rate_limit" });
  assert.equal(limited.status, 429);
  assert.equal(limited.body.ok === false && limited.body.code, "RATE_LIMITED");
  assert.equal(RECOVERY_UNREACHABLE_OUTCOME.status, 503);
  assert.doesNotMatch(JSON.stringify([limited, RECOVERY_UNREACHABLE_OUTCOME]), /registered|not found|exists|smtp/i);
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
  assert.doesNotMatch(route, /console\.\w+\([^)]*email[,)]/, "the address is never logged");
  assert.doesNotMatch(route, /NextResponse\.json\([^)]*withheldCode/, "withheld provider codes are never returned");
  assert.match(page, /if \(response\.ok && result\?\.ok === true\) setSent\(true\)/);
  assert.match(page, /role="alert"/);
});
