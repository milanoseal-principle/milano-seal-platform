# Complimentary Matter Existing System Map

This build extends the current Milano Seal payment and scheduling spine instead of creating a parallel Tiffany portal, fake Wise adapter, or second pricing engine.

## Reused systems

- **Matter record:** existing `deals` rows remain the Matter source used by dashboard detail, portal invoice display, scheduling, execution, and activity timeline.
- **Canonical pricing:** `total_price`, `base_price`, `witness_total`, and `amount_due` are read server-side from the Matter record. The client never submits a trusted amount.
- **Payment gate:** `lib/payments/paymentGate.ts` remains the verified-payment evaluator. Complimentary scheduling is evaluated by an additive scheduling gate that accepts either verified payment or active Complimentary Authorization.
- **Scheduling route:** `app/api/deals/[id]/schedule/route.ts` now reports `paymentRequirementMethod` as `verified_payment`, `complimentary_authorization`, or `not_satisfied`.
- **Audit:** `lib/audit.ts` and `lib/activity.ts` record append-only complimentary request, approval, and revocation events.
- **Role source:** server-side Supabase auth `app_metadata` / `user_metadata` roles and permissions are used. No Tiffany email, name, or user ID is hardcoded.
- **Client portal:** existing `/portal/invoice` displays a client-safe Complimentary Service Authorization message and suppresses Wise payment prompts for authorized complimentary Matters.
- **Founder/operator dashboard:** existing `/dashboard/deals/[id]` receives the complimentary Matter card in the Matter payment area.

## Canonical complimentary fields

The Matter retains the original commercial value and receives a separate disposition snapshot:

- `payment_disposition = 'complimentary'`
- `amount_before_adjustment = original canonical price`
- `complimentary_adjustment_amount = original canonical price`
- `amount_due = 0`
- `amount_paid = 0`
- `verified_revenue = 0`
- `wise_payment_id = null`
- `wise_transfer_id = null`
- `payment_confirmed_at = null`
- `comp_authorized = true`
- `comp_authorization_id = immutable authorization id`

## Tiffany setup

Tiffany is not created or assigned by application code. Assign her authenticated production account through the canonical role/permission mechanism with:

- `matter.comp.view`
- `matter.comp.authorize`
- `matter.comp.audit`
- optionally `matter.comp.revoke`

If her user record does not exist, create it through the normal operator provisioning workflow and then assign those permissions. Do not hardcode her email in application logic.
