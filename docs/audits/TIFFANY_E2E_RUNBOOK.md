# Tiffany End-to-End Test — Executable Runbook (Block 5)

The live E2E must be run by Nick: it needs production/Supabase access that the
build sandbox cannot reach (egress blocked, no service-role key). Every code path
it exercises is merged to `main` and green. Follow these steps in order.

**Uses the existing engine + an operator-created 100% comp. No Wise, no custody
hash change, no release-gate bypass. Payment clears only via an audited redemption.**

---

## 0. Prerequisites (one time)

Set these environment variables in the Milano Seal deployment (Vercel project):

```
DISCOUNT_ENGINE_ENABLED=true
DISCOUNT_ALLOW_OPERATOR_COMP=true
DISCOUNT_OWNER_EMAILS=themilanoseal@gmail.com
```

Apply the additive migration (creates the `discount_requests` table only):

```
supabase db push        # or run supabase/migrations/042_discount_requests.sql
```

Confirm the 3 Vercel production checks are green on the latest `main`
(commit with the discount engine merge): `milano-seal-platform`,
`milano-seal-platform-2m1v`, `milano-seal-platform-5f8n`.

---

## 1. Seed the Tiffany demo matter + 100% comp code

```
npm run seed:tiffany-e2e
```

This is idempotent and creates:
- Discount code **TIFFANYTEST** — `discount_type='percentage'`, `discount_value=100`
  (a 100% comp), `status='ACTIVE'` (live 035 schema).
- Demo matter **MS-DEMO-YYYY-000001** on `deals` — `amount_due=1250`,
  `payment_status='unpaid'`, `access_token` set for the portal link.
- Seed activity events.

Record from the output: **Deal ID** (uuid) and **Portal URL** (`/portal/<token>`).
Get the **discount code id**:

```sql
select id, code, discount_type, discount_value, status
from public.discount_codes where code = 'TIFFANYTEST';
```

---

## 2. Confirm the intake confirmation surface

Visit `/intake/confirmation?matterId=MS-DEMO-YYYY-000001&status=under_review`.
Expect the deterministic block: **Matter Received**, Matter ID, **Status: Under
Review**, **Next Step: Compliance + execution review**, **Response Window: One
business day**, **Execution Status: Not scheduled until payment is complete**.

---

## 3. Apply the audited 100% comp (clears payment)

Authenticated as an owner (`themilanoseal@gmail.com`, role `founder_admin`), POST to
the comp-clear endpoint with the demo deal id + the TIFFANYTEST code id:

```
POST /api/admin/discounts/comp-clear
Content-Type: application/json

{
  "deal_id": "<DEMO_DEAL_UUID>",
  "discount_code_id": "<TIFFANYTEST_CODE_UUID>",
  "reason": "Tiffany end-to-end production test"
}
```

Expected response: `{ "ok": true, "originalAmount": 1250, "finalAmount": 0 }`
(or `{ "ok": true, "alreadyCleared": true }` on a repeat run).

Permission notes: returns **503** if `DISCOUNT_ENGINE_ENABLED !== "true"`, **403**
unless the caller passes `canApproveComp` (owner role or an allow-listed email with
`DISCOUNT_ALLOW_OPERATOR_COMP=true`).

---

## 4. Verify the audited state

**Audited redemption (final amount 0):**
```sql
select code, original_amount, discount_amount, final_amount, redeemed_by, approved_by
from public.discount_redemptions
where matter_id = '<DEMO_DEAL_UUID>' order by created_at desc limit 1;
-- expect original_amount=1250, discount_amount=1250, final_amount=0
```

**Matter payment cleared + balance zero:**
```sql
select payment_confirmed, payment_status, payment_settlement_status, amount_due, paid_at
from public.deals where id = '<DEMO_DEAL_UUID>';
-- expect payment_confirmed=true, payment_status='confirmed',
--        payment_settlement_status='observed_available', amount_due=0
```

**Audit events written:**
```sql
select event_type, message, created_at from public.event_ledger
where matter_id = '<DEMO_DEAL_UUID>'
  and event_type in ('PAYMENT_COMPED','PAYMENT_BALANCE_UPDATED','SCHEDULING_UNLOCKED')
order by created_at desc;
-- expect all three present
```

---

## 5. Confirm gates behave

- **Scheduling unlocked:** the matter is now `payment_confirmed=true` →
  scheduling/execution is unlocked (SCHEDULING_UNLOCKED recorded).
- **Final release still gated:** `performFinalRelease.ts` accepts
  `payment_confirmed=true`, so a comped matter can proceed — and it does so *only*
  because an audited redemption + confirmed state exist. No unaudited path clears it.
- **No public exposure:** `TIFFANYTEST` never appears on any public surface
  (enforced by `validate:discount-engine` + `validate:public-surface-guards`).

---

## Final report template (fill after the live run)

- production Vercel status:
- seed ran clean:
- comp code is 100% percentage:
- comp applied (ok:true, finalAmount 0):
- discount_redemptions row (final_amount=0):
- deals payment_confirmed / status confirmed / amount_due 0:
- PAYMENT_COMPED / PAYMENT_BALANCE_UPDATED / SCHEDULING_UNLOCKED present:
- scheduling unlocked:
- Wise required: no
- release gate bypassed without audit: no
- public 100% code exposed: no
- final status: LIVE GREEN / NOT GREEN
