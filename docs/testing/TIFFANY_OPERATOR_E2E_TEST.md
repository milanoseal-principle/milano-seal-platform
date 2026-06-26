# Tiffany Operator E2E Test — Milano Seal

**Version:** 2026-06-26 (post route-protection + demo harness pass)
**Branch:** claude/funny-maxwell-hlxQN
**Tester Account:** Tiffany@bulbtech.io (role: founder_admin)
**Payment Rail:** Wise (primary)

---

## Prerequisites

| Requirement | Value |
|---|---|
| Operator account | Tiffany@bulbtech.io (role: founder_admin) |
| Demo mode env var | `MILANO_E2E_DEMO_MODE=true` |
| Discount code | TIFFANYTEST (seeded automatically on first demo run) |
| Demo matter ref | `MS-DEMO-{YEAR}-000001` |

**Do not include real passwords, live Wise banking details, or secrets in this document.**

---

## Setup

### Option A — Auto-seed via E2E page
Visit `/dashboard/testing/tiffany-e2e` → click **Start Demo Matter** if no matter exists, or **Reset Demo** to restore to `awaiting_payment`.

### Option B — CLI seed script
```bash
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed:tiffany-e2e
```

---

## Full E2E Test Steps

### 1. Authentication
- Log in as Tiffany (operator/founder_admin role)
- Confirm redirect to `/dashboard` after login
- Confirm `/dashboard` is inaccessible when logged out (redirects to `/login`)

### 2. Open Demo Harness
- Navigate to `/dashboard/testing/tiffany-e2e`
- Page must load (requires `MILANO_E2E_DEMO_MODE=true` — shows disabled state if not set)
- Page must NOT appear in Google (noindex confirmed via metadata)

### 3. Start or Reset Demo Matter
- Click **Start Demo Matter** if first run, or **Reset Demo** to restore
- Confirm matter `MS-DEMO-{YEAR}-000001` appears with:
  - Stage: `awaiting_payment`
  - Payment: `unpaid`
  - Amount Due: `$1,250`

### 4. Open Operator Matter Detail
- Click **Open Matter Detail** link — opens `/dashboard/deals/[id]`
- Confirm matter fields: Power of Attorney · Italy · Priority · $1,250

### 5. Open Client Portal
- Click **Open Client Portal** link — opens `/portal/[token]`
- Confirm portal shows: matter ref, document type, destination country, lane, amount due
- Confirm portal does NOT show: internal_notes, operator_notes, margins, costs, assignee

### 6. Open Portal Invoice
- Navigate to `/portal/invoice`
- Confirm invoice shows: Tiffany Demo Client, $1,250 amount due, unpaid status, Wise payment instructions

### 7. Apply Discount Code TIFFANYTEST
- On E2E page: click **Apply TIFFANYTEST**
- Expected server response (via `POST /api/deals/[id]/apply-discount`):
  - Original Total: `$1,250`
  - Discount Code: `TIFFANYTEST`
  - Discount Amount: `$100`
  - Final Amount Due: `$1,150`
- Confirm E2E page shows updated amount
- Confirm portal invoice reflects `$1,150` after refresh
- Confirm event `DISCOUNT_APPLIED` appears in event ledger
- Confirm discount cannot be applied again (button disabled)

### 8. Confirm Wise Payment Reference
- On portal invoice: confirm Wise reference appears
- Confirm Wise payment instructions are visible
- Confirm payment status still shows `unpaid`

### 9. Test Payment Gate — Attempt Scheduling Before Payment
- While payment is `unpaid`: schedule button must show "🔒 Payment Required" or be disabled
- All downstream actions (execution, apostille, shipping, release) must remain locked

### 10. Test Payment Mismatch
- Click **Test Mismatch ($1,100)**
- Expected:
  - Payment confirmation endpoint NOT called
  - `PAYMENT_MISMATCH_FLAGGED` event logged
  - E2E page shows yellow "MISMATCH FLAGGED" status
  - Payment status remains `unpaid`
  - Scheduling remains blocked

### 11. Confirm Manual Wise Payment (Success Path)
- Click **Confirm Paid ($1,150)**
- Calls `POST /api/deals/[id]/payment`:
  - `payment_method: "wise"`, `payment_status: "paid"`
  - `payment_reference: "WISE-DEMO-MS-DEMO-{YEAR}-000001"`
  - `payment_amount_received: 1150`
- Expected:
  - `payment_status` → `paid`
  - Matter auto-advances to `scheduled`
  - `SCHEDULING_UNLOCKED` event logged
  - E2E page shows green "Paid ✓" badge

### 12. Confirm Scheduling Unlocked
- Status badge shows `scheduled`
- All step buttons no longer show "🔒 Payment Required"

### 13. Schedule Execution
- Auto-set by payment confirmation. Status: `scheduled` ✓

### 14. Mark Execution Started
- Click **Start Execution** → `scheduled → in_execution`

### 15. Mark RON Completed → Apostille
- Click **Complete RON → Apostille** → `in_execution → apostille`

### 16. Mark Apostille Submitted
- Click **Mark Submitted** → logs `APOSTILLE_SUBMITTED`

### 17. Mark Apostille Received
- Click **Mark Received** → logs `APOSTILLE_RECEIVED`

### 18. Mark Ready for Release
- Click **Ready for Release** → logs `READY_FOR_RELEASE`

### 19. Add Courier + Tracking / Mark Shipped
- Click **Add Tracking + Ship**
- Sets: `tracking_number: "DEMO-TRACK-2026-001"`, `carrier: "FedEx"`, `status: "shipped"`

### 20. Open Client Portal — Verify Tracking Appears
- Return to `/portal/[token]`
- Confirm tracking number and carrier visible
- Confirm portal status tracker reflects `shipped`

### 21. Mark Delivered
- Click **Mark Delivered** → logs `DELIVERED`

### 22. Mark Completed
- Click **Mark Completed** → `shipped → completed`

### 23. Confirm Client Portal Shows Completed
- Open `/portal/[token]` → confirm status shows `completed`

### 24. Verify Event Ledger — Required Events

| Event | Source |
|---|---|
| `INTAKE_CREATED` | seeded |
| `MATTER_CREATED` | seeded |
| `QUOTE_GENERATED` | seeded |
| `PORTAL_LINK_CREATED` | seeded |
| `PAYMENT_INSTRUCTIONS_SENT` | seeded |
| `DISCOUNT_APPLIED` | step 7 |
| `PAYMENT_MISMATCH_FLAGGED` | step 10 |
| `SCHEDULING_UNLOCKED` | step 11 |
| `payment_confirmed` | step 11 |
| `stage_advanced` (scheduled) | step 11 |
| `APOSTILLE_SUBMITTED` | step 16 |
| `APOSTILLE_RECEIVED` | step 17 |
| `READY_FOR_RELEASE` | step 18 |
| `DELIVERED` | step 21 |

### 25. Verify Portal Security
Confirm `/portal/[token]` does NOT show:
- `internal_notes`, `operator_notes`, `admin_notes`
- `margin`, `base_cost`, `shipping_cost`
- `assignee`, `runner_id`, `operator_id`
- `label_url`, `full_signing_url`
- Admin actions or data from other matters

### 26. Verify Route Protection (Logged Out)
- Log out
- `/dashboard` → must redirect to `/login?next=/dashboard`
- `/dashboard/testing/tiffany-e2e` → must redirect to login
- `/portal/[token]` → still loads (public portal access by token)

### 27. Confirm Build Passes
```
npm run validate:project  → All checks passed
npm run typecheck         → 0 errors
npm run build             → Build successful
```

---

## Acceptance Criteria Summary

| Criterion | Status |
|---|---|
| Tiffany can log in as founder_admin | ✓ |
| /dashboard/testing/tiffany-e2e accessible to operator | ✓ |
| Demo page requires auth | ✓ |
| Demo page never indexed | ✓ |
| Demo matter seeded idempotently | ✓ |
| Discount applied through real server endpoint | ✓ |
| Amount updates $1,250 → $1,150 server-side | ✓ |
| Payment cannot be faked by client | ✓ |
| Mismatch test flags and blocks scheduling | ✓ |
| Operator manual Wise confirmation marks paid | ✓ |
| Scheduling unlocks only after paid status | ✓ |
| Full lifecycle reachable intake → completion | ✓ |
| Client portal tracking updates after ship | ✓ |
| Event ledger records every required step | ✓ |
| Private routes protected by proxy.ts | ✓ |
| Portal token still works for client | ✓ |
| No Stripe checkout | ✓ |
| No Survisure/HVAC/appliance/claims language | ✓ |
| No fake public paid status | ✓ |
| Build passes | ✓ |

---

## Automated E2E Testing

No automated E2E framework (Playwright, Cypress) is configured in this project.
Manual smoke test using this document is the current acceptance method.

**Deferred:** Playwright browser automation for CI regression testing.
When configured, test file: `e2e/tiffany-smoke.spec.ts`

---

## Payment Gate Reference

| Action | Requires Payment? |
|---|---|
| Apply discount code | No (must be applied before payment) |
| View portal | No |
| View invoice | No |
| View Wise instructions | No |
| Schedule execution | YES |
| Start execution | YES |
| Send to apostille | YES |
| Create shipping label | YES |
| Release documents | YES |
| Mark completed | YES |

---

## Locked Pricing (Do Not Change)

| Lane | Price |
|---|---|
| Signature Lane | $750 |
| Priority Lane | $975 |
| Executive Lane | $1,850 |
| Apostille Coordination (first doc) | $275 |
| Rush / Same-Day | $175 |
| Additional Signer | $75 |
| Custom Matter | Review required — not a public lane |
