# Tiffany Wise Provider Settlement Recovery

Matter: `MS-2026-4887`

## Observed production truth

- Client: Tiffany Burtt
- Wise payment submitted: 6.88 USD
- Milano Matter remained `observed_pending`
- Wise provider notification later confirmed the funds were paid out to Milano Seal International, LLC
- Provider acquiring resource: `3894876b-21a5-49ae-9479-0ce5d17fa030`
- Gross: 6.88 USD
- Fee: 0.50 USD
- Net: 6.38 USD

## Root cause

The existing automatic Wise reconciler fails closed when Wise acquiring activity and balance-statement payloads do not contain either the Milano Matter reference or an already-correlated provider resource ID. This historical payment therefore remained pending even after official Wise settlement evidence existed.

## Recovery rule

The production recovery path must never write paid state directly.

It may accept only official Wise provider-notification evidence that exact-matches:

- the existing Matter
- the existing Wise reference
- the open Matter amount
- Matter currency
- a valid Wise provider resource UUID
- a settlement timestamp after the governed payment observation
- gross = net + fee

The recovery function records immutable provider evidence and then delegates the payment commit to the existing canonical `confirm_wise_payment_for_deal(...)` function.

## Authority lock

- Wise remains the only payment provider.
- `confirm_wise_payment_for_deal(...)` remains the canonical paid-state authority.
- No client role can execute provider-settlement recovery.
- No direct `payment_confirmed = true` mutation is permitted in the recovery migration.
- Scheduling, RON, apostille, custody and release authorities are untouched.
