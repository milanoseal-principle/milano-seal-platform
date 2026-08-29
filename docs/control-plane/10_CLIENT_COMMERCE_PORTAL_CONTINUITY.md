# The Milano Seal™ — Client Commerce & Portal Continuity

Controlling implementation for the post-intake client journey.

## Locked Flow

```text
Matter created
→ email confirmed
→ login
→ Secure Matter Portal
→ portal home itemized order ledger
→ Invoice & Payment
→ optional authorized discount
→ recalculated final Matter total
→ recalculated 50% retainer
→ Matter-specific Wise link/reference
→ verified Wise settlement
→ scheduling unlock
```

## One-Engine Rule

- Pricing remains canonical Matter pricing.
- Discount mutations route through `src/features/discounts/discountService.ts`.
- Client invoice helpers are display projections only.
- Discounts cannot change once Wise payment is pending/confirmed.
- Applying a discount does not redeem it; redemption remains post-Wise reconciliation.
- Applying a discount never creates paid state or unlocks scheduling.
- Wise remains the only payment authority.

## Client Invoice

Portal home and Invoice & Payment expose client-safe itemization only:

- execution lane
- additional document/signer handling when present
- witness coordination when present
- timeline premium when present
- apostille coordination when present
- notarial execution tracking when present
- courier/delivery
- original total
- authorized discount
- final total
- 50% retainer
- remaining balance
- Wise reference and Matter-specific payment link

Internal margin, internal cost, hidden operator notes, and provider secrets never appear.

## Password Recovery

`/login` exposes Forgot Password.

```text
/login
→ /forgot-password
→ enumeration-safe reset request
→ Supabase recovery email
→ /auth/recovery
→ /reset-password
→ new password
→ session cleared
→ /login?next=/portal
```

Password recovery never creates a second account or Matter.

## Atlas Continuity

The selected country is preserved from the homepage globe into the full Atlas:

```text
Homepage selected country
→ /map?country={slug}
→ GlobalMap initialCountry
→ selectedDest
→ Atlas fly target for the same destination
```

The large Atlas may not open on a generic view when a valid selected country was passed.

## Tiffany Gate 37

`TIFFTEST99` is a controlled, single-use, Matter-locked production test discount. The client must enter it on Invoice & Payment. It is not a public promotion and must never be auto-applied.
