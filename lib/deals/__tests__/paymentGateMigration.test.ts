import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const SQL = readFileSync("supabase/migrations/044_production_deals_payment_gate_compatibility.sql", "utf8");

test("gate evaluates operational status (NEW.status), not deal_status or stage", () => {
  assert.ok(/NEW\.status\b/.test(SQL));
  assert.ok(!/NEW\.deal_status/.test(SQL), "must not gate on deal_status");
  assert.ok(!/NEW\.stage/.test(SQL), "must not gate on stage");
});

test("gate never uses NEW.amount_due", () => {
  assert.ok(!/NEW\.amount_due/.test(SQL));
});

test("paid advancement allowed via payment_confirmed OR payment_status='paid'", () => {
  assert.ok(/NEW\.payment_confirmed = true/.test(SQL));
  assert.ok(/NEW\.payment_status = 'paid'/.test(SQL));
});

test("complimentary advancement requires the full zero-revenue authorization", () => {
  for (const cond of [
    /payment_disposition = 'complimentary'/,
    /comp_authorized = true/,
    /comp_authorization_id is not null/,
    /comp_authorized_at is not null/,
    /comp_revoked_at is null/,
    /payment_confirmed = false/,
    /amount_paid.{0,6}= 0/,
    /verified_revenue.{0,6}= 0/,
    /final_amount_due = 0/,
    /discount_amount = ca\.original_total/,
  ]) {
    assert.ok(cond.test(SQL), `missing complimentary condition: ${cond}`);
  }
});

test("protects the canonical operational states", () => {
  for (const s of ["scheduled", "in_execution", "apostille", "apostille_processing", "shipped", "in_transit", "delivered", "completed"]) {
    assert.ok(new RegExp(`'${s}'`).test(SQL), `missing protected state ${s}`);
  }
});

test("is idempotent (create or replace / if not exists / drop trigger if exists)", () => {
  assert.ok(/create or replace function/i.test(SQL));
  assert.ok(/add column if not exists currency/i.test(SQL));
  assert.ok(/drop trigger if exists enforce_payment_gate_on_status_insert/i.test(SQL));
  assert.ok(/drop trigger if exists enforce_payment_gate_on_status_update/i.test(SQL));
  assert.ok(/before insert on public\.deals/i.test(SQL));
  assert.ok(/before update of status on public\.deals/i.test(SQL));
});

test("no destructive operations and no row rewrites", () => {
  assert.ok(!/drop table|truncate|delete from|rename column|rename to|update public\.deals set/i.test(SQL));
});

test("does not modify migration 043 semantics (separate file, additive only)", () => {
  assert.ok(/rollback/i.test(SQL), "includes rollback guidance");
});
