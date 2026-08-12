#!/usr/bin/env tsx
/**
 * Milano Seal — Operator Account Repair Script
 *
 * Run: npx tsx scripts/repair-operator-accounts.ts
 *
 * Required env vars:
 *   SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 *   MILANO_NICHOLAS_TEMP_PASSWORD
 *   BURTT_TIFFANY_TEMP_PASSWORD
 *
 * Does NOT log passwords. Does NOT commit passwords.
 * Uses Supabase Admin API (service role) only.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.",
  );
  process.exit(1);
}

const NICHOLAS_PASSWORD = process.env.MILANO_NICHOLAS_TEMP_PASSWORD;
const TIFFANY_PASSWORD = process.env.BURTT_TIFFANY_TEMP_PASSWORD;

if (!NICHOLAS_PASSWORD || !TIFFANY_PASSWORD) {
  console.error(
    "ERROR: MILANO_NICHOLAS_TEMP_PASSWORD and BURTT_TIFFANY_TEMP_PASSWORD must be set.",
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface OperatorSpec {
  email: string;
  password: string;
  display_name: string;
  milano_role_label: string;
}

async function repairOperator(spec: OperatorSpec): Promise<void> {
  console.log(`\n[operator] ${spec.email}`);

  // Check if user exists
  const { data: listData, error: listErr } =
    await admin.auth.admin.listUsers();

  if (listErr) {
    console.error(`  ✗ Could not list users: ${listErr.message}`);
    throw listErr;
  }

  const existing = listData.users.find(
    (u) => u.email?.toLowerCase() === spec.email.toLowerCase(),
  );

  if (existing) {
    console.log(`  — Found existing user (id: ${existing.id})`);

    const { data: updated, error: updateErr } =
      await admin.auth.admin.updateUserById(existing.id, {
        email_confirm: true,
        password: spec.password,
        app_metadata: { role: "founder_admin" },
        user_metadata: {
          display_name: spec.display_name,
          milano_role_label: spec.milano_role_label,
        },
      });

    if (updateErr) {
      console.error(`  ✗ Update failed: ${updateErr.message}`);
      throw updateErr;
    }

    console.log(`  ✓ Updated`);
    console.log(`    email: ${updated.user.email}`);
    console.log(`    id:    ${updated.user.id}`);
    console.log(`    role:  ${JSON.stringify(updated.user.app_metadata?.role)}`);
  } else {
    console.log(`  — No existing user — creating`);

    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({
        email: spec.email,
        password: spec.password,
        email_confirm: true,
        app_metadata: { role: "founder_admin" },
        user_metadata: {
          display_name: spec.display_name,
          milano_role_label: spec.milano_role_label,
        },
      });

    if (createErr) {
      console.error(`  ✗ Create failed: ${createErr.message}`);
      throw createErr;
    }

    console.log(`  ✓ Created`);
    console.log(`    email: ${created.user.email}`);
    console.log(`    id:    ${created.user.id}`);
    console.log(`    role:  ${JSON.stringify(created.user.app_metadata?.role)}`);
  }
}

async function main() {
  console.log("══════════════════════════════════════════");
  console.log("  Milano Seal — Operator Account Repair");
  console.log("══════════════════════════════════════════");

  let failed = false;

  try {
    await repairOperator({
      email: "nicholas@themilanoseal.com",
      password: NICHOLAS_PASSWORD!,
      display_name: "Nicholas Milano",
      milano_role_label: "Founder / Operator",
    });
  } catch {
    console.error("  ✗ nicholas@themilanoseal.com FAILED");
    failed = true;
  }

  try {
    await repairOperator({
      email: process.env.TIFFANY_OPERATOR_EMAIL!,
      password: TIFFANY_PASSWORD!,
      display_name: process.env.TIFFANY_OPERATOR_DISPLAY_NAME ?? "Authorized Operator",
      milano_role_label: "Founder Admin / Operator",
    });
  } catch {
    console.error("  ✗ TIFFANY_OPERATOR_EMAIL account repair FAILED");
    failed = true;
  }

  console.log("\n══════════════════════════════════════════");
  if (failed) {
    console.error("  ✗ One or more operators failed. Check errors above.");
    process.exit(1);
  } else {
    console.log("  ✓ Both operator accounts repaired successfully.");
    console.log("  Rotate passwords after first successful login.");
  }
  console.log("══════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("Repair script failed:", err);
  process.exit(1);
});
