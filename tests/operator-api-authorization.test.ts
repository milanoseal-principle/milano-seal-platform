import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import type { User } from "@supabase/supabase-js";
import { isOperatorApiRole, requireOperatorApiAccess } from "@/lib/auth/operatorApiAccess";

// Regression for unauthenticated / role-less operator APIs: any signed-in client
// (clients self-register) could previously read cross-Matter payment rows, approve
// Alliance operators, mark notary credentials verified, read Matter messages or send
// WhatsApp messages to a client, because these routes trusted the session alone or
// had no check at all.

const read = (file: string) => fs.readFileSync(file, "utf8");
const user = (id = "u-1", email = "operator@example.invalid") => ({ id, email }) as unknown as User;
const access = (role: string | null, signedIn = true) =>
  requireOperatorApiAccess({ getUser: async () => (signedIn ? user() : null), resolveRole: async () => role ?? "" });

test("operator API guard: no session is 401, never a role default", async () => {
  const result = await access("founder_admin", false);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.response.status, 401);
});

test("operator API guard: client, VA, Alliance, professional and unknown roles are 403", async () => {
  for (const role of ["client", "virtual_assistant", "va", "alliance_partner", "alliance", "professional", "", "unknown-role", null]) {
    const result = await access(role);
    assert.equal(result.ok, false, String(role));
    if (!result.ok) assert.equal(result.response.status, 403, String(role));
  }
});

test("operator API guard preserves the approved operator access model", async () => {
  for (const role of ["founder_admin", "founder", "admin", "owner", "operator", "admin_operator", "ops_manager", "finance", "execution_coordinator", "apostille_coordinator", "client_support"]) {
    const result = await access(role);
    assert.equal(result.ok, true, role);
    if (result.ok) assert.equal(result.actor, "operator@example.invalid");
    assert.equal(isOperatorApiRole(role), true, role);
  }
});

test("proxy role-checks /api/admin and /api/follow-ups like /api/dashboard", () => {
  const proxy = read("proxy.ts");
  for (const prefix of ['pathname.startsWith("/api/dashboard")', 'pathname.startsWith("/api/admin/")', 'pathname === "/api/admin"', 'pathname.startsWith("/api/follow-ups/")', 'pathname === "/api/follow-ups"']) {
    assert.ok(proxy.includes(prefix), prefix);
  }
  assert.match(proxy, /!isRouteAllowedForRole\("\/dashboard", role\)\s*\)\s*\{\s*return NextResponse\.json\(\{ error: "Forbidden" \}, \{ status: 403 \}\)/);
  // The secret-authenticated production ledger runner bypass is unchanged.
  assert.match(proxy, /x-test-runner-secret/);
});

const guarded: Array<[string, string[]]> = [
  ["app/api/deals/[id]/activity/route.ts", ["GET"]],
  ["app/api/deals/[id]/messages/route.ts", ["GET", "POST"]],
  ["app/api/deals/[id]/payment/manual-confirm/route.ts", ["POST"]],
  ["app/api/deals/[id]/payment/request-final/route.ts", ["POST"]],
  ["app/api/alliance/referrals/review/route.ts", ["POST"]],
  ["app/api/alliance/operator/profile/route.ts", ["GET"]],
  ["app/api/alliance/operator/toolbelt/route.ts", ["PATCH"]],
  ["app/api/alliance/operator/availability/route.ts", ["POST", "GET"]],
  ["app/api/admin/operators/[id]/approve/route.ts", ["POST"]],
  ["app/api/route.ts", ["POST"]],
];

for (const [file, handlers] of guarded) {
  test(`${file} checks operator access before any data access`, () => {
    const source = read(file);
    for (const handler of handlers) {
      const start = source.search(new RegExp(`export async function ${handler}\\b`));
      assert.ok(start >= 0, `${handler} handler present`);
      const body = source.slice(start);
      const next = body.slice(1).search(/\nexport async function /);
      const handlerBody = next >= 0 ? body.slice(0, next + 1) : body;
      const guard = handlerBody.indexOf("await requireOperatorApiAccess()");
      assert.ok(guard > 0, `${handler} calls the operator guard`);
      for (const dataAccess of ["createAdminClient(", "supabaseServer(", "getMatterById(", "updateMatter(", "resolveDealUuid(", "req.json()", "request.json()"]) {
        const at = handlerBody.indexOf(dataAccess);
        if (at >= 0) assert.ok(guard < at, `${handler}: guard must precede ${dataAccess}`);
      }
    }
  });
}

test("manual payment confirmation is founder-only and attributes the verified session", () => {
  const source = read("app/api/deals/[id]/payment/manual-confirm/route.ts");
  assert.match(source, /canPerformAction\(access\.role, "confirm_payment_manual"\)/);
  assert.match(source, /FOUNDER_ADMIN_REQUIRED/);
  assert.doesNotMatch(source, /body\.actorEmail|actorEmail\?: string/);
  assert.equal(read("app/api/deals/[id]/payment/confirm-final/route.ts").trim(), 'export { POST } from "../manual-confirm/route";');
  assert.doesNotMatch(read("app/api/deals/[id]/payment/request-final/route.ts"), /x-actor-email/);
});

test("operator approval attribution cannot be supplied by the request body", () => {
  const source = read("app/api/admin/operators/[id]/approve/route.ts");
  assert.doesNotMatch(source, /body\.approved_by/);
  assert.match(source, /const approvedBy = access\.actor;/);
});
