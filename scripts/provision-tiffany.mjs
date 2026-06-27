// Provision Tiffany@bulbtech.io with founder_admin role + CUNTSEATASS 100% discount code.
// Run where env vars exist:  node scripts/provision-tiffany.mjs
//
// Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const EMAIL = "Tiffany@bulbtech.io";
const PASSWORD = process.env.BURTT_TIFFANY_TEMP_PASSWORD;
if (!PASSWORD) {
  console.error("Set BURTT_TIFFANY_TEMP_PASSWORD in the environment before running this script.");
  process.exit(1);
}
const ROLE = "founder_admin";

const DISCOUNT_CODE = "CUNTSEATASS";

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

async function provisionUser() {
  const existing = await findUserByEmail(EMAIL);

  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password: PASSWORD,
      email_confirm: true,
      app_metadata: { ...existing.app_metadata, role: ROLE },
    });
    if (error) throw error;
    console.log(`Updated ${EMAIL} — role=${ROLE}, password reset.`);
    return existing.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    app_metadata: { role: ROLE },
  });
  if (error) throw error;
  console.log(`Created ${EMAIL} — role=${ROLE}.`);
  return data.user.id;
}

async function provisionDiscountCode(createdById) {
  const { data: existing } = await admin
    .from("discount_codes")
    .select("id, status")
    .eq("code", DISCOUNT_CODE)
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from("discount_codes")
      .update({ status: "ACTIVE", discount_value: 100 })
      .eq("id", existing.id);
    if (error) throw error;
    console.log(`Discount code ${DISCOUNT_CODE} already exists — ensured ACTIVE at 100%.`);
    return;
  }

  const { error } = await admin.from("discount_codes").insert({
    code: DISCOUNT_CODE,
    discount_type: "percentage",
    discount_value: 100,
    applies_to: "service_fee",
    usage_limit: null,
    expiration_date: null,
    internal_reason: "Tiffany / BulbTech courtesy — full access.",
    client_label: "Milano Seal courtesy adjustment",
    status: "ACTIVE",
    created_by: createdById,
  });
  if (error) throw error;
  console.log(`Created discount code ${DISCOUNT_CODE} — 100% off, unlimited uses.`);
}

async function run() {
  const userId = await provisionUser();
  await provisionDiscountCode(userId);
  console.log("Done.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
