import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { findUserByEmail, planPermissions } from "../scripts/provision-tiffany.mjs";

const SOURCE = readFileSync("scripts/provision-tiffany.mjs", "utf8");
const BASE = ["matter.comp.view", "matter.comp.authorize", "matter.comp.audit"];

function fakeClient(users: Array<{ id: string; email: string; app_metadata?: Record<string, unknown> }>) {
  return {
    auth: {
      admin: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        listUsers: async ({ page }: { page: number; perPage: number }) => {
          if (page === 1) return { data: { users }, error: null };
          return { data: { users: [] }, error: null };
        },
      },
    },
  };
}

test("existing user is located by email (case-insensitive)", async () => {
  const client = fakeClient([{ id: "u1", email: "Op@Example.com" }]);
  const user = await findUserByEmail(client, "op@example.com");
  assert.equal(user?.id, "u1");
});

test("missing user returns null (safe stop, no fabrication)", async () => {
  const client = fakeClient([{ id: "u1", email: "someone@else.com" }]);
  const user = await findUserByEmail(client, "notthere@example.com");
  assert.equal(user, null);
});

test("existing user with no permissions gets exactly the scoped base set", () => {
  const plan = planPermissions([], BASE);
  assert.equal(plan.already, false);
  assert.equal(plan.toAddCount, 3);
  assert.deepEqual(plan.merged.sort(), [...BASE].sort());
});

test("revoke is added only when included in the required set", () => {
  const withRevoke = planPermissions([], [...BASE, "matter.comp.revoke"]);
  assert.ok(withRevoke.merged.includes("matter.comp.revoke"));
  const without = planPermissions([], BASE);
  assert.ok(!without.merged.includes("matter.comp.revoke"));
});

test("rerun is idempotent — already-provisioned yields zero additions", () => {
  const plan = planPermissions(BASE, BASE);
  assert.equal(plan.already, true);
  assert.equal(plan.toAddCount, 0);
});

test("unrelated existing permissions are preserved", () => {
  const existing = ["billing.view", "matter.comp.view", "reports.read"];
  const plan = planPermissions(existing, BASE);
  assert.ok(plan.merged.includes("billing.view"));
  assert.ok(plan.merged.includes("reports.read"));
  assert.equal(plan.preservedCount, 2);
  // Only the two missing comp perms are added.
  assert.deepEqual(plan.toAdd.sort(), ["matter.comp.audit", "matter.comp.authorize"]);
});

test("source never assigns founder_admin or any role", () => {
  assert.ok(!/founder_admin/.test(SOURCE));
  assert.ok(!/\brole\s*:/.test(SOURCE), "must not set a role field");
});

test("source never resets a password or requires TIFFANY_OPERATOR_PASSWORD", () => {
  assert.ok(!/password\s*:/i.test(SOURCE), "must not set a password field");
  assert.ok(!/TIFFANY_OPERATOR_PASSWORD/.test(SOURCE));
});

test("source never touches discount codes", () => {
  assert.ok(!/discount_codes/.test(SOURCE));
  assert.ok(!/TIFFANY_COMP_CODE/.test(SOURCE));
});

test("source never creates users", () => {
  assert.ok(!/createUser/.test(SOURCE));
});

test("source honors revoke flag and dry-run env", () => {
  assert.ok(/TIFFANY_ALLOW_COMP_REVOKE/.test(SOURCE));
  assert.ok(/TIFFANY_PROVISION_DRY_RUN/.test(SOURCE));
});

test("source writes an immutable audit event", () => {
  assert.ok(/audit_logs/.test(SOURCE));
  assert.ok(/COMP_PERMISSIONS_PROVISIONED/.test(SOURCE));
});

test("source never prints the email or secret env values", () => {
  // No console.log line should interpolate EMAIL, PASSWORD, SERVICE_KEY, or user id.
  const logLines = SOURCE.split("\n").filter((l) => /console\.log/.test(l));
  for (const line of logLines) {
    assert.ok(!/\$\{EMAIL\}/.test(line), `email printed: ${line}`);
    assert.ok(!/\$\{?SERVICE_KEY/.test(line), `service key printed: ${line}`);
    assert.ok(!/\$\{user\.id\}/.test(line), `user id printed: ${line}`);
    assert.ok(!/\$\{PASSWORD/.test(line), `password printed: ${line}`);
  }
});
