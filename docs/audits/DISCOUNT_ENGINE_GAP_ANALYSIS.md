# Dynamic Discount Engine — Gap Analysis (Copy Block 4)

**Status:** Investigation only. No payment-sensitive code written. Awaiting Nick's
decision before touching the payment/release path.

**Why this document exists:** Copy Block 4 specifies building a "full dynamic
discount engine." A working, production-grade discount engine **already exists**
in the repo. Building Block 4 verbatim would create a second, conflicting engine
on payment-sensitive infrastructure (duplicate `discount_codes` /
`discount_redemptions` tables, two apply paths, two audit logs). This document
maps the spec to what already exists and isolates the genuinely-missing pieces —
all of which alter the payment/release gate, the hardest standing lock.

---

## 1. What already exists (do not rebuild)

| Capability | Where |
|---|---|
| Discount tables + RLS (founder/admin-gated) | `supabase/migrations/035_discount_codes.sql` — `discount_codes`, `discount_redemptions`, `client_discount_assignments`, `discount_audit_log` |
| Pure calc helpers (`computeDiscountAmount`, `validateCodeRedeemable`, `generateCourtesyCode`) | `lib/discountCodes.ts` |
| Apply / remove to matter, audited, clamped ≥ 0, post-payment guard | `src/features/discounts/discountService.ts` (`applyDiscountToMatter`, `removeDiscountFromMatter`) |
| Operator + owning-client authorization (never trusts client-supplied actor) | `app/api/deals/[id]/apply-discount/route.ts` |
| Operator dashboard API (GET/POST/PATCH) | `app/api/dashboard/discounts/route.ts` |
| Operator dashboard UI | `components/dashboard/DiscountCodeManager.tsx` |
| Audit ledger writer (`DISCOUNT_APPLIED`, `DISCOUNT_REMOVED`, `DISCOUNT_REJECTED`) | `src/features/audit/eventLedgerService.ts` |
| Tiffany E2E seed (`TIFFANYTEST` code + `MS-DEMO-YYYY-000001` matter) | `scripts/seed-tiffany-e2e.ts` (`npm run seed:tiffany-e2e`), `app/api/internal/e2e/{seed,status}` |

**Existing safety properties already satisfied by Block 4's requirements:**
- `amount_after` never negative — `money()` clamps to `Math.max(0, …)`.
- Discount rejected after payment starts — guard on `["paid","deposit_paid"]`.
- Every apply/remove writes an audit event.
- Clients cannot create codes — mutation routes are operator/owner gated.

---

## 2. Spec ↔ existing schema conflicts (why "verbatim" is unsafe)

| Block 4 spec | Existing (035) | Conflict |
|---|---|---|
| `discount_type` text in `('percent','fixed','comp')` | `discount_type` **enum** `('percentage','fixed_amount')` | same column name, different type + values → migration collision |
| table `discount_codes` with spec columns | `discount_codes` already exists w/ different columns | `create table` name collision |
| table `discount_redemptions` (spec columns) | already exists w/ different columns | name collision |
| `discount_requests` table | **does not exist** | genuinely new (safe, additive) |

Applying Block 4's DDL verbatim would either fail (type/table already exists) or,
worse, partially apply and leave two divergent shapes of the same table.

---

## 3. Genuinely-missing pieces (all payment-path-altering)

These are the only real gaps. **Each one touches the payment/release gate**, so
none should be written without explicit approval.

1. **`comp` (100%) discount type + owner-approval gate.**
   Today a `percentage` value of 100 would compute `final_total = 0`, but there is
   no explicit comp semantics, no owner-only approval requirement, and no
   `requires_approval` / `approved_by` enforcement in the service layer.

2. **`paid_comped` acceptance in the release gate.**
   `lib/release/performFinalRelease.ts` clears payment only for
   `payment_confirmed`, `payment_status ∈ {paid, confirmed}`, platform-fee-only, or
   `amount_paid ≥ amount_due` **when `amount_due > 0`**. A 100% comp sets
   `amount_due = 0`, so that last branch is `false` → a comped matter would **not**
   clear today. Making comp unlock scheduling requires adding `paid_comped`
   (only via an audited comp record) to this gate — a direct release-gate change.

3. **`discount_requests` (alliance/partner) flow.**
   New additive table + `POST /api/alliance/discounts/request` +
   `approve` route. Safe/additive, but only meaningful alongside (1).

4. **Client-portal apply surface.**
   The apply route already authorizes the owning client; this is a UI card in the
   portal invoice area. Low risk, but pairs with the payment-status display above.

5. **`DISCOUNT_ENGINE_ENABLED` env gate + comp env flags**
   (`DISCOUNT_ALLOW_OPERATOR_COMP`, `DISCOUNT_OWNER_EMAILS`, …). Additive.

---

## 4. Recommended path (additive, no duplicate engine)

**Extend the existing engine; do not fork it.**

- `042_discount_engine_extensions.sql` (additive only): add `discount_requests`
  table; add nullable `requires_approval`, `approved_by`, `approved_at`,
  `internal_only`, `scope` columns to the existing `discount_codes`; treat
  `comp` as `percentage`=100 with an explicit comp marker in `metadata` (avoids the
  enum conflict) **or** add `'comp'` to the enum via `ALTER TYPE ... ADD VALUE`.
- `lib/discounts/{types,permissions,audit}.ts` + a thin `engine.ts` that **wraps**
  `src/features/discounts/discountService.ts` — no reimplementation.
- New routes only where missing: `POST /api/portal/discounts/apply` (thin wrapper),
  `POST /api/alliance/discounts/request`, `…/requests/[id]/approve`.
- **Release-gate change (the one sensitive edit):** add `paid_comped` acceptance
  guarded so it is set *only* by the comp path with a written audit row +
  `payment_reference` starting `DISCOUNT-COMP-`.
- Reuse the existing `TIFFANYTEST` seed for the Tiffany E2E, or add a comp variant.

**Explicitly out of scope until approved:** any edit to
`performFinalRelease.ts`, Wise webhook, payout/commission, custody hash chain.

---

## 5. Decision needed from Nick

Pick one:
- **A — Extend existing engine (recommended):** implement §4 additively on this
  branch; hold for preview approval before merge.
- **B — Build Block 4 verbatim as a parallel engine:** accept the schema collision
  risk and two competing discount systems (not recommended on payment infra).
- **C — Leave as-is:** the existing engine + `TIFFANYTEST` seed already support an
  operator-created matter discount; run the Tiffany E2E on what exists and skip new
  payment-path code.

No payment/release/Wise/custody code has been changed on this branch.
