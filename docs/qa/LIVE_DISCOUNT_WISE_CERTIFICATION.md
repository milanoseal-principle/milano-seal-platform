# Milano Seal — Live Discount → Wise Certification

## Scope

This runbook certifies the production path:

`canonical pricing → explicit discount code → recalculated invoice → Matter-specific Wise instruction → signed Wise reconciliation → atomic payment confirmation → discount redemption → scheduling eligibility`

Wise is the only payment authority. Supabase is the system of record.

## Hard invariants

- No discount without explicit code entry and server validation.
- Applying a code never consumes it.
- Any price change invalidates unconsumed Wise instructions derived from the old amount.
- `payment_pending` or `payment_confirmed` blocks discount mutation.
- Retainer amount comes from persisted canonical `amount_due` / `invoice_retainer`.
- Signed Wise evidence must exact-match reference, amount, and currency.
- `confirm_wise_payment_for_deal()` remains the only authoritative payment commit.
- No verified Wise payment means no normal execution.
- `DAMIANI50` is not a QA code and must not be redeemed during testing.

## Proof B — normal Matter

Create a fresh operator Matter with:

- Destination: Italy
- Document: Power of Attorney
- Notarization: Required
- Execution Method: RON
- Notarial Act: Acknowledgment
- Authentication: Apostille
- Signers: 1
- Witnesses: 0
- Translation: Off
- Discount code: none

Expected example pricing for the currently locked scope:

- Original/final total: `$1,250.00`
- Wise retainer due: `$625.00`
- Remaining balance: `$625.00`
- `payment_status = unpaid`
- `payment_confirmed = false`
- scheduling locked
- execution locked

Do not reuse a prior QA Matter.

## TIFFTEST50 — discounted QA Matter

Create a separate pure-service QA Matter with the same `$1,250.00` eligible subtotal and manually enter `TIFFTEST50`.

Before Wise payment, verify:

- original total: `$1,250.00`
- eligible subtotal: `$1,250.00`
- discount: `$625.00`
- final total: `$625.00`
- retainer due: `$312.50`
- balance: `$312.50`
- `discount_codes.usage_count = 0`
- `discount_redemptions = 0`
- `payment_status = unpaid`
- `payment_confirmed = false`
- execution locked
- the active `payments` row amount is exactly `$312.50 USD`
- the active `payments.wise_reference` equals the Matter's mirrored `deals.wise_reference`

If shipping/courier is present, do not expect a `$625.00` discount because pass-through/non-discountable charges remain outside the eligible subtotal.

## Pricing-mutation safety proof

On a disposable QA Matter only:

1. Generate a Wise retainer instruction before applying a code.
2. Record its reference and amount.
3. Apply `TIFFTEST50`.
4. Confirm the previous `awaiting_payment` instruction no longer exists.
5. Generate payment again.
6. Confirm a new reference exists and its amount is the discounted canonical retainer.
7. Confirm the Matter mirror contains the new Wise reference/link.

A `payment_pending` or `payment_confirmed` obligation must return a controlled conflict instead of allowing the price to change.

## Intentional live Wise settlement

Only perform this step when a real QA Wise payment is intentionally authorized.

Pay from the Matter-specific Wise instruction. Do not use the generic Wise Business URL manually.

After the signed Wise event is reconciled, verify:

- exact payment reference matched
- exact amount matched
- exact currency matched
- `confirm_wise_payment_for_deal()` succeeded once
- Matter payment confirmation persisted once
- TIFFTEST50 `usage_count = 1`
- exactly one `discount_redemptions` row exists for the QA Matter
- no duplicate verified revenue
- no duplicate job creation
- no duplicate authoritative payment event
- scheduling is eligible only after all non-payment execution gates also pass

## Production readbacks

```sql
select
  id,
  deal_id,
  status,
  payment_status,
  payment_confirmed,
  original_total,
  eligible_subtotal,
  non_discountable_total,
  discount_code,
  discount_amount,
  final_total,
  total_price,
  invoice_retainer,
  invoice_balance,
  amount_due,
  wise_reference,
  payment_link
from public.deals
where deal_id = '<MS-...>';
```

```sql
select
  payment_type,
  payment_amount,
  payment_currency,
  payment_status,
  wise_reference,
  wise_payment_url,
  created_at,
  confirmed_at
from public.payments
where matter_id = '<UUID>'
order by created_at desc;
```

```sql
select code, status, usage_count, usage_limit, expires_at
from public.discount_codes
where code in ('TIFFTEST50', 'DAMIANI50');
```

```sql
select count(*) as redemption_count
from public.discount_redemptions r
join public.discount_codes c on c.id = r.discount_code_id
where c.code = 'TIFFTEST50';
```

## GO criteria

GO only when all of the following are evidenced:

- canonical price is consistent across intake, dashboard, payment row, and Wise instruction
- discount requires explicit code entry
- stale payment instruction is invalidated after a price change
- discount code remains unconsumed before verified payment
- signed Wise event exact-matches reference, amount, and currency
- atomic confirmation runs once
- TIFFTEST50 redeems once after verified payment
- normal execution remains locked before verified payment
- DAMIANI50 remains unused

## NO-GO conditions

Any of the following is an immediate NO-GO:

- conflicting Matter/Wise amounts
- stale Wise reference survives a pricing change
- discount mutation after payment is pending
- code usage increments before reconciliation
- amount-only or reference-inferred reconciliation
- unsigned/test production event unlocks payment
- duplicate redemption or duplicate authoritative payment state
- DAMIANI50 is consumed during QA
