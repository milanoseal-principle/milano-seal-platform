# Production acceptance — Admin Discount Control + Alliance Benefits

The block is releasable only when all of the following pass:

- Founder/admin can create an inactive percentage code with an internal reason.
- Code creation cannot write Matter price, invoice, payment-confirmation, scheduling, or execution truth.
- Activation/pause/revoke changes only governed code policy fields.
- Alliance member sees only benefits assigned to their authenticated Alliance account.
- Alliance benefit surface is read-only.
- Alliance referral submission carries the authenticated partner referral code/email.
- Referral API resolves referral code to partner ID before staging the referral.
- Reporting is founder/admin/finance restricted.
- Reporting derives value only from redeemed discount records and referral ledger data.
- Reporting does not claim a conversion rate without an exposure denominator.
- Reporting does not label adjusted Matter value as paid revenue.
- Wise reconciliation remains the sole authority for paid revenue.
- No Stripe path is introduced.
- No DAMIANI50 or TIFFTEST50 mutation is introduced.
- Existing discount application remains server-side and fail-closed on missing eligible subtotal.
- Existing 50/50 invoice doctrine remains unchanged.
