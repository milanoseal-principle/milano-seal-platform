# Founder Discount Override Control

## Purpose

The Founder Discount Override module provides the `founder_admin` role with direct, audited control over deal pricing. It allows applying custom pricing adjustments, waiving service fees, setting required platform fees, and locking pricing to prevent further modifications.

This module is strictly internal. No discount details, reasons, or notes are exposed to client-facing portals.

---

## Access Control

- **Allowed role:** `founder_admin` only
- **VA / operator access:** Blocked at API layer (HTTP 403)
- **Authentication:** Supabase session checked via `createClient()` from `@/lib/supabase/server`
- **DB writes:** Performed via `createAdminClient()` (service role)

---

## Discount Types

| Value | Description |
|---|---|
| `courtesy_discount` | Goodwill adjustment for existing clients |
| `relationship_pricing` | Long-term client or partner pricing |
| `domestic_simple_notary` | Standard domestic notary flat rate |
| `platform_fee_only` | Client pays only the platform processing fee |
| `founder_exception` | Direct founder exception with no standard formula |
| `hardship_adjustment` | Case-by-case hardship consideration |
| `strategic_client` | Strategic partnership pricing |
| `correction_adjustment` | Correction of prior billing error |

---

## Domestic Simple Notary Preset

When applying a Domestic Simple Notary:

- `finalClientPrice` = 25
- `platformFeeRequired` = 25
- `serviceFeeWaived` = true
- `discountType` = `platform_fee_only`

---

## Compliance Rules

- Pricing overrides must never be tied to referrals, commissions, kickbacks, or medical cases.
- No referral fee exchange of any kind may be encoded in discount fields.
- All overrides must have a legitimate operational reason recorded in `discount_reason`.
- Internal notes (`discount_note`) are never surfaced to clients.
- The module does not modify Supabase RLS policies, Wise payment logic, or payment gate conditions.

---

## Activity Log Events

Every action through this module writes a record to `activity_logs` via `logActivity()`.

| Event Action | Trigger |
|---|---|
| `founder_pricing_override` | Apply override (default action) |
| `founder_pricing_override_locked` | Lock override |
| `founder_pricing_override_unlocked` | Unlock override |
| `founder_pricing_override_cleared` | Clear all override fields |

Meta stored with each event includes: actor email, timestamp, discount type, final client price, platform fee, service fee waived flag, and whether adjustment was confirmed after payment.

---

## Client-Facing Display

- If `service_fee_waived = true`, client-facing invoices or summaries may show: **"Founder courtesy pricing applied"**
- Internal fields (`discount_note`, `discount_reason`, `discount_applied_by`, `platform_fee_required`) are never included in client portal API responses.

---

## Fields Added to `deals` Table

| Column | Type | Notes |
|---|---|---|
| `discount_type` | text | Discount category |
| `discount_amount` | numeric | Calculated discount value |
| `discount_reason` | text | Internal justification |
| `discount_note` | text | Internal note — never exposed to client |
| `discount_applied_by` | text | Actor email |
| `discount_applied_at` | timestamptz | Timestamp of last override |
| `founder_price_override` | numeric | Final client-facing price |
| `platform_fee_required` | numeric | Minimum platform fee to collect |
| `service_fee_waived` | boolean | Whether service fee is waived |
| `price_override_locked` | boolean | Prevents edits until unlocked |

---

## Security Summary

- API route: `/api/admin/founder-pricing-override` (POST)
- Returns `{ success: false, code: "FOUNDER_ONLY_PRICING_CONTROL" }` for any non-founder_admin caller
- Never exposes: `discount_note`, `discount_reason`, `internal_notes`, `operator_notes`, `margin`, `base_cost`
- All writes go through `createAdminClient()` — never the anon Supabase client
