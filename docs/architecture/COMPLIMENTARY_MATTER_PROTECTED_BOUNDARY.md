# Complimentary Matter Protected Boundary

Complimentary Matters are controlled commercial dispositions. They are not paid Matters and are not Wise payments.

## Never changed by this workflow

- Wise webhook signature verification
- Wise payment confirmation
- Wise reconciliation
- Shippo label creation
- BlueNotary session handling
- custody ledger hash chain
- final release gate
- production secrets
- client-controlled payment status

## Hard safety rules

- Do not set `payment_status` to `paid` for a complimentary Matter.
- Do not set `payment_confirmed` to true for a complimentary Matter.
- Do not create fake Wise webhook events, transfer IDs, payment IDs, references, settlement dates, or invoice payments.
- Do not record verified revenue for a complimentary Matter.
- Do not allow client, Alliance, or Virtual Assistant roles to authorize, revoke, or mutate the complimentary disposition.
- Do not reuse a Complimentary Authorization across Matters or quote versions.
- Do not allow ordinary unpaid Matters to schedule.

## Scheduling boundary

Scheduling is eligible only when every operational requirement passes and one payment requirement is satisfied:

```ts
schedulingEligible =
  allOperationalRequirementsPassed &&
  (verifiedPaymentConfirmed || activeValidComplimentaryAuthorization);
```

The scheduling response includes:

- `paymentRequirementSatisfied`
- `paymentRequirementMethod`

The method is never represented as paid unless a real verified payment exists.

## Revenue boundary

Founder reports may show complimentary Matter count and commercial value comped, but complimentary Matters are excluded from verified revenue, paid Matter count, recurring paid volume, Wise reconciliation, cash collections, and payment conversion.
