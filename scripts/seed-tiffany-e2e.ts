#!/usr/bin/env tsx
/**
 * Milano Seal — Tiffany E2E Demo Seed Script
 * Run: npx tsx scripts/seed-tiffany-e2e.ts
 *
 * Creates (idempotent):
 *   - TIFFANYTEST discount code (fixed $100 off)
 *   - MS-DEMO-YYYY-000001 demo matter
 *   - Portal token for demo matter
 *   - Seed activity log events
 */

import { createClient } from "@supabase/supabase-js";
import { join } from "node:path";
import { config } from "node:process";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.",
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const YEAR = new Date().getFullYear();
const DEMO_MATTER_REF = `MS-DEMO-${YEAR}-000001`;
const DEMO_EMAIL = "tiffany-demo@themilanoseal.test";

async function upsertDiscountCode() {
  console.log("\n[1] Discount Code — TIFFANYTEST");

  const { data: existing } = await admin
    .from("discount_codes")
    .select("id, code, status")
    .eq("code", "TIFFANYTEST")
    .maybeSingle();

  if (existing) {
    console.log(`  ✓ Already exists (id: ${existing.id}, status: ${existing.status})`);
    if (existing.status !== "ACTIVE") {
      await admin.from("discount_codes").update({ status: "ACTIVE" }).eq("id", existing.id);
      console.log("  ✓ Re-activated");
    }
    return existing.id as string;
  }

  const { data, error } = await admin
    .from("discount_codes")
    .insert({
      code: "TIFFANYTEST",
      discount_type: "fixed_amount",
      discount_value: 100,
      status: "ACTIVE",
      description: "Tiffany E2E demo code",
      internal_note: "Tiffany E2E demo code — do not delete",
      usage_limit: null,
      usage_count: 0,
      expires_at: null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("  ✗ Failed to create discount code:", error.message);
    process.exit(1);
  }

  console.log(`  ✓ Created (id: ${data.id})`);
  return data.id as string;
}

async function upsertDemoMatter() {
  console.log("\n[2] Demo Matter — " + DEMO_MATTER_REF);

  const { data: existing } = await admin
    .from("deals")
    .select("id, deal_id, status, payment_status")
    .eq("deal_id", DEMO_MATTER_REF)
    .maybeSingle();

  if (existing) {
    console.log(
      `  ✓ Already exists (id: ${existing.id}, status: ${existing.status}, payment: ${existing.payment_status})`,
    );
    return existing.id as string;
  }

  const { data, error } = await admin
    .from("deals")
    .insert({
      deal_id: DEMO_MATTER_REF,
      matter_id: DEMO_MATTER_REF,
      display_id: DEMO_MATTER_REF,
      client_name: "Tiffany Demo Client",
      email: DEMO_EMAIL,
      phone: "+15550102026",
      document_type: "Power of Attorney",
      destination_country: "Italy",
      origin_state: "Florida",
      assigned_lane: "priority",
      status: "awaiting_payment",
      invoice_status: "unpaid",
      payment_status: "unpaid",
      payment_method: "wise",
      amount_due: 1250,
      payment_amount_due: 1250,
      currency: "USD",
      apostille_required: true,
      internal_notes: "E2E demo matter — Tiffany operator confidence test",
    })
    .select("id")
    .single();

  if (error) {
    console.error("  ✗ Failed to create demo matter:", error.message);
    process.exit(1);
  }

  console.log(`  ✓ Created (id: ${data.id})`);
  return data.id as string;
}

async function upsertPortalToken(dealId: string) {
  console.log("\n[3] Portal Token");

  const { data: existing } = await admin
    .from("portal_tokens")
    .select("id, token")
    .eq("deal_id", dealId)
    .maybeSingle();

  if (existing) {
    console.log(`  ✓ Already exists (token: ${existing.token?.slice(0, 8)}...)`);
    return existing.token as string;
  }

  const token =
    "demo-" +
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2);

  const { data, error } = await admin
    .from("portal_tokens")
    .insert({
      deal_id: dealId,
      token,
      client_email: DEMO_EMAIL,
      active: true,
    })
    .select("token")
    .single();

  if (error) {
    // Some schemas use a different table name
    console.warn("  ⚠ portal_tokens insert failed:", error.message);
    console.warn("  — Portal token may use a different table; check schema.");
    return null;
  }

  console.log(`  ✓ Created (token: ${data.token?.slice(0, 8)}...)`);
  return data.token as string;
}

async function seedActivityEvents(dealId: string) {
  console.log("\n[4] Seed Activity Events");

  const events = [
    { action: "INTAKE_CREATED", detail: "Demo intake received from Tiffany E2E seed" },
    { action: "MATTER_CREATED", detail: `Matter ${DEMO_MATTER_REF} created — Power of Attorney · Italy · Priority` },
    { action: "QUOTE_GENERATED", detail: "Quote generated: $975 base + $275 apostille = $1,250" },
    { action: "PORTAL_LINK_CREATED", detail: "Client portal token issued for Tiffany Demo Client" },
    { action: "PAYMENT_INSTRUCTIONS_SENT", detail: "Wise payment instructions sent · Amount due: $1,250" },
  ];

  const { data: existing } = await admin
    .from("activity_logs")
    .select("action")
    .eq("deal_id", dealId)
    .in("action", events.map((e) => e.action));

  const existingActions = new Set((existing ?? []).map((r: { action: string }) => r.action));

  for (const evt of events) {
    if (existingActions.has(evt.action)) {
      console.log(`  — SKIP: ${evt.action} already logged`);
      continue;
    }
    const { error } = await admin.from("activity_logs").insert({
      deal_id: dealId,
      actor: "system",
      action: evt.action,
      detail: evt.detail,
      meta: { source: "seed-tiffany-e2e" },
    });
    if (error) {
      console.warn(`  ⚠ Could not log ${evt.action}:`, error.message);
    } else {
      console.log(`  ✓ Logged: ${evt.action}`);
    }
  }
}

async function main() {
  console.log("══════════════════════════════════════════");
  console.log("  Milano Seal — Tiffany E2E Demo Seed");
  console.log("══════════════════════════════════════════");

  await upsertDiscountCode();
  const dealId = await upsertDemoMatter();
  await upsertPortalToken(dealId);
  await seedActivityEvents(dealId);

  console.log("\n══════════════════════════════════════════");
  console.log("  ✓ Seed complete");
  console.log(`  Matter: ${DEMO_MATTER_REF}`);
  console.log(`  Deal ID: ${dealId}`);
  console.log("══════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
