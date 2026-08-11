# Milano OS V2 completion gate

This slice completes the Milano OS V2 first production pass without changing canonical pricing, state, Wise reconciliation, or execution logic.

## Acceptance
- Matter detail uses SecurePaymentCard as the primary payment surface.
- Partner/Courtesy code calls `/api/deals/[id]/apply-discount`, the canonical server discount service.
- Complimentary authorization is demoted behind an advanced operator disclosure.
- Portal payment uses the same SecurePaymentCard and server discount route.
- Pro Forma review uses the canonical Matter payment truth and Wise-only instructions.
- Wise is the only payment provider shown.
- Responsive cockpit preserves primary action hierarchy on desktop and mobile.
- `lib/pricing.ts`, `lib/invoice.ts`, Supabase, Wise reconciliation, and execution gates remain authoritative.

## Live certification sequence
1. Fresh no-code Matter confirms canonical Matter total and 50% retainer.
2. Separate QA Matter manually applies `TIFFTEST50`.
3. Verify original total, discount, adjusted total, retainer, balance, unpaid state, and locked execution.
4. Only verified Wise settlement may redeem the QA code and unlock the payment gate.
5. `DAMIANI50` remains untouched until QA certification passes.
