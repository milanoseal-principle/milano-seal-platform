// Create (or update) the founder account.
// Run where env vars exist:  node scripts/create-founder-user.mjs
//
// Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// (already set in your Vercel project / local .env).

import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const EMAIL = "nicholas@themilanoseal.com";
const PASSWORD = process.env.MILANO_FOUNDER_TEMP_PASSWORD;
if (!PASSWORD) {
  console.error("Set MILANO_FOUNDER_TEMP_PASSWORD in the environment before running this script.");
  process.exit(1);
}
const ROLE = "founder_admin"; // routes to /dashboard; tab selection unlocks all workspaces

const admin = createClient(URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(email) {
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

async function run() {
  const existing = await findUserByEmail(EMAIL);

  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password: PASSWORD,
      email_confirm: true,
      app_metadata: { ...existing.app_metadata, role: ROLE },
    });
    if (error) throw error;
    console.log(`Updated ${EMAIL} — role=${ROLE}, password reset.`);
    return;
  }

  const { error } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    app_metadata: { role: ROLE },
  });
  if (error) throw error;
  console.log(`Created ${EMAIL} — role=${ROLE}.`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
