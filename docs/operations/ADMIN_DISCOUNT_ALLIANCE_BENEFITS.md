# Milano Seal — Admin Discount Control + Alliance Benefits

## Authority

Discount codes are administrative policy objects. They do not directly mutate Matter pricing. Canonical pricing, discount application, 50/50 invoicing, Wise reconciliation, payment gating, and the Matter state machine remain authoritative in their existing layers.

## Founder/Admin Discount Code Manager

Route: `/dashboard/payments/discounts`

Founder/admin may create governed percentage codes with:

- normalized code
- percentage
- usage limit
- start/end timestamps
- optional client restriction
- optional Matter restriction
- optional Alliance-member restriction
- eligible service scope
- client-facing label
- required internal reason

New codes are always created `inactive`. Activation is a separate explicit action.

## Hard controls

- no manual Matter price editing
- no client-side discount authority
- no automatic redemption
- no stackable codes (`stackable=false`)
- no direct payment confirmation
- no Wise authority changes
- no complimentary disposition changes
- no state-machine changes

## Alliance Benefits

Route: `/alliance/benefits`

Alliance members receive a read-only view of codes explicitly assigned through `discount_codes.metadata.alliance_member_id`. They may copy an assigned code and view status, uses remaining, expiration, and eligible service scope. They cannot create, edit, activate, revoke, or resize a benefit.

## Referral attribution

Authenticated Alliance referral submissions carry the partner's stored referral code and email into the existing referral endpoint. The server resolves `referral_code` to `alliance_partners.id` before staging the referral observation.

## Reporting

Route: `/dashboard/payments/discounts/report`

API: `/api/dashboard/discounts/report`

Reporting uses:

- `discount_codes`
- redeemed `discount_redemptions`
- `referral_ledger`

The report exposes redeemed Matter count, eligible Matter value, courtesy value, adjusted Matter value, repeat-client signal, and partner referral volume. It intentionally does not invent a conversion rate without a governed impression/issued denominator.

Adjusted Matter value is not labeled paid revenue. Wise reconciliation remains authoritative for paid revenue.
