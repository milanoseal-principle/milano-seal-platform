import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

test("approved retainer issuance is atomic, replayable and service-only", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create role service_role;
      create table public.deals (
        id uuid primary key, deal_id text, status text, quote_review_required boolean,
        quote_approved_at timestamptz, quote_approved_by text, execution_truth jsonb,
        payment_disposition text, payment_status text, payment_confirmed boolean,
        amount_paid numeric, payment_observed_at timestamptz, payment_attempt_id uuid,
        wise_transaction_reference text, currency text, final_total numeric,
        total_price numeric, invoice_retainer numeric, invoice_balance numeric,
        amount_due numeric, wise_reference text, payment_link text, client_name text, email text
      );
      create table public.matter_evidence_ledger (
        matter_id uuid, event_type text, source text, occurred_at timestamptz
      );
      create table public.payments (
        id uuid primary key default gen_random_uuid(), matter_id uuid, wise_payment_url text,
        wise_reference text, payment_type text, payment_amount numeric, payment_currency text,
        payment_description text, payment_status text, payer_name text, payer_email text,
        payment_confirmed boolean default false
      );
    `);
    await db.exec(readFileSync("supabase/migrations/20261128045056_atomic_approved_retainer_instruction.sql", "utf8"));
    const id = "11111111-1111-4111-8111-111111111111";
    const approval = "2026-11-27T12:00:00Z";
    const reference = "MS-FIXTURE-R";
    const url = "https://wise.com/pay/business/fixture?ref=MS-FIXTURE-R&amount=6.88&currency=USD";
    const issue = (amount = 6.88, approvedAt = approval) => db.query<{ amount: string; existing: boolean }>(
      "select amount, existing from public.issue_approved_retainer_instruction($1,$2,$3,$4,$5,$6)",
      [id, approvedAt, amount, reference, url, "Synthetic retainer"],
    );
    await db.query(`insert into public.deals (
      id, deal_id, status, quote_review_required, quote_approved_at, quote_approved_by,
      execution_truth, payment_disposition, payment_status, payment_confirmed, amount_paid,
      currency, final_total, total_price, invoice_retainer, invoice_balance, amount_due
    ) values ($1,'MS-FIXTURE','awaiting_payment',false,$2,'fixture operator',
      '{"review_confirmed_by":"fixture","review_confirmed_at":"2026-11-27T11:00:00Z"}',
      'standard_payment','unpaid',false,0,'USD',13.75,13.75,6.88,6.87,6.88)`, [id, approval]);
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      await assert.rejects(issue, /permission denied/);
      await db.exec("reset role");
    }
    await db.exec("set role service_role");
    await assert.rejects(issue, /APPROVED_RETAINER_REQUIRED/);
    await db.exec("reset role");
    await db.query("insert into public.matter_evidence_ledger values ($1,'canonical_quote_approved','operator_quote_builder',$2)", [id, approval]);
    await db.exec("alter table public.deals add constraint reject_mirror check (payment_link is null); set role service_role");
    await assert.rejects(() => issue(6.87), /APPROVED_RETAINER_REQUIRED/);
    await assert.rejects(() => issue(6.88, "2026-11-26T12:00:00Z"), /APPROVED_RETAINER_REQUIRED/);
    await assert.rejects(issue, /reject_mirror/);
    await db.exec("reset role");
    assert.deepEqual((await db.query("select id from public.payments")).rows, []);

    await db.exec("alter table public.deals drop constraint reject_mirror; set role service_role");
    assert.deepEqual((await issue()).rows, [{ amount: "6.88", existing: false }]);
    assert.deepEqual((await issue()).rows, [{ amount: "6.88", existing: true }]);
    await db.exec("reset role");
    assert.deepEqual((await db.query("select wise_reference, payment_link, payment_confirmed from public.deals")).rows,
      [{ wise_reference: reference, payment_link: url, payment_confirmed: false }]);
    await db.exec("update public.payments set payment_status = 'payment_pending'; set role service_role");
    await assert.rejects(issue, /RETAINER_RECONCILIATION_REQUIRED/);
    await db.exec("reset role");
    assert.equal((await db.query("select id from public.payments")).rows.length, 1);
  } finally {
    await db.close();
  }
});
