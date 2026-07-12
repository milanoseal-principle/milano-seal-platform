// Provision complimentary-Matter permissions for an already-approved operator.
//
// This script grants ONLY the scoped `matter.comp.*` permissions the merged
// complimentary-Matter flow reads from Supabase Auth `app_metadata.permissions`
// (see lib/payments/complimentary-server.ts -> extractActor). It never creates
// users, never resets passwords, never assigns roles, and never touches
// discount codes, payments, scheduling, custody, or revenue.
//
// Run where env vars exist:  node scripts/provision-tiffany.mjs
//
// Required env:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   TIFFANY_OPERATOR_EMAIL          (server-side only; never printed)
// Optional env:
//   TIFFANY_ALLOW_COMP_REVOKE=true  (also grant matter.comp.revoke)
//   TIFFANY_PROVISION_DRY_RUN=true  (report only; write nothing)

import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = process.env.TIFFANY_OPERATOR_EMAIL;
const ALLOW_REVOKE = process.env.TIFFANY_ALLOW_COMP_REVOKE === "true";
const DRY_RUN = process.env.TIFFANY_PROVISION_DRY_RUN === "true";

// Canonical scoped permissions read by the complimentary-Matter flow.
// Base set mirrors AUTHORIZED_OPERATOR_COMP_PERMISSIONS in
// lib/payments/complimentary-policy.ts. Revoke is added only on explicit opt-in.
const BASE_PERMISSIONS = ["matter.comp.view", "matter.comp.authorize", "matter.comp.audit"];
const REQUIRED_PERMISSIONS = ALLOW_REVOKE ? [...BASE_PERMISSIONS, "matter.comp.revoke"] : BASE_PERMISSIONS;

function fail(message) {
  console.error(message);
  process.exit(1);
}

// Build the admin client lazily so importing this module (e.g. from tests to
// exercise the pure helpers) never requires env or opens a client.
function requireAdminClient() {
  if (!URL || !SERVICE_KEY || !EMAIL) {
    fail(
      "Missing required env. Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and TIFFANY_OPERATOR_EMAIL.",
    );
  }
  return createClient(URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Paginate Supabase Auth users and match by email. Never logs the email.
export async function findUserByEmail(client, email) {
  const target = email.toLowerCase();
  let page = 1;
  for (;;) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === target);
    if (match) return match;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

// Pure planning helper: given the user's current permissions, compute the merged
// set that preserves all existing (unrelated) permissions and adds only the
// required comp permissions that are missing. No role, password, or other field.
export function planPermissions(currentPermissions, requiredPermissions) {
  const current = Array.isArray(currentPermissions) ? currentPermissions.map(String) : [];
  const present = new Set(current);
  const toAdd = requiredPermissions.filter((p) => !present.has(p));
  const merged = [...current];
  for (const p of toAdd) merged.push(p);
  return {
    already: requiredPermissions.every((p) => present.has(p)),
    toAddCount: toAdd.length,
    toAdd,
    merged,
    preservedCount: current.filter((p) => !requiredPermissions.includes(p)).length,
  };
}

async function run() {
  const admin = requireAdminClient();
  const user = await findUserByEmail(admin, EMAIL);

  // Safe stop: never fabricate a user. Provisioning is permission-only.
  if (!user) {
    console.error(
      "Operator user not found for the configured TIFFANY_OPERATOR_EMAIL.\n" +
        "This script does not create or invite users. Create the account first through the\n" +
        "approved Supabase Auth invite flow (Dashboard -> Authentication -> Invite user, or\n" +
        "the platform's operator onboarding), confirm the email, then re-run this script.",
    );
    process.exit(1);
  }

  const currentPermissions = Array.isArray(user.app_metadata?.permissions)
    ? user.app_metadata.permissions
    : [];
  const plan = planPermissions(currentPermissions, REQUIRED_PERMISSIONS);

  console.log("Complimentary permission provisioning");
  console.log(`  Mode:                 ${DRY_RUN ? "DRY RUN (no changes)" : "LIVE"}`);
  console.log(`  Operator user found:  yes`);
  console.log(`  Required present:     ${plan.already ? "yes" : "no"}`);
  console.log(`  Permissions to add:   ${plan.toAddCount}`);
  console.log(`  Revoke requested:     ${ALLOW_REVOKE ? "yes" : "no"}`);

  if (DRY_RUN) {
    console.log("  No changes applied (dry run).");
    return;
  }

  if (plan.already) {
    console.log("  No changes applied (already provisioned; idempotent no-op).");
    return;
  }

  // Update ONLY app_metadata.permissions. Preserve all other app_metadata
  // (including role) verbatim. Do not touch password or email confirmation.
  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, permissions: plan.merged },
  });
  if (updateError) throw updateError;

  // Immutable admin audit event for the permission assignment. No secrets, no
  // email, no user id in the printed output; the audit row itself references the
  // user id (already stored in the DB) but nothing sensitive is logged.
  const { error: auditError } = await admin.from("audit_logs").insert({
    actor: "provision-tiffany-script",
    event: "COMP_PERMISSIONS_PROVISIONED",
    resource: user.id,
    payload: {
      permissions_added: plan.toAdd,
      required_permissions: REQUIRED_PERMISSIONS,
      revoke_included: ALLOW_REVOKE,
    },
  });
  if (auditError) throw auditError;

  console.log(`  Permissions assigned: ${plan.toAddCount} added.`);
  console.log("  Audit event created:  yes");
  console.log("  No password changed, no role changed, no discount code created.");
}

// Only auto-run when invoked directly, so tests can import the pure helpers.
const invokedDirectly = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) {
  run().catch((e) => {
    console.error(e instanceof Error ? e.message : "Provisioning failed.");
    process.exit(1);
  });
}
