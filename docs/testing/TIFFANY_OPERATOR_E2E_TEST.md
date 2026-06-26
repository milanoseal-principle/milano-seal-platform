# Tiffany — Operator E2E Test Guide

**Platform:** The Milano Seal™
**Tester Account:** Tiffany@bulbtech.io (role: founder_admin)
**Payment Rail:** Wise (primary)
**Discount Code:** CUNTSEATASS (100% off — for testing)

> Do not include passwords, live secrets, private keys, real bank details, or live Wise credentials in this document.

---

## Pre-Test Setup

1. Confirm Tiffany account exists in Supabase with `app_metadata.role = "founder_admin"`.
2. Confirm `CUNTSEATASS` discount code is `ACTIVE` in `discount_codes` table (100% percentage).
3. Confirm a test intake/matter exists in `deals` table in `new` or `reviewing` status.
4. Have the client portal URL for the test matter ready.

---

## Phase 1 — Operator Login

**Step 1 — Navigate to login:**
Go to `/login`. Confirm 4 workspace tabs are visible: Secure Matter Portal · Operator · Alliance · VA.

**Step 2 — Log in as operator:**
- Select **Operator** tab
- Email: `Tiffany@bulbtech.io`
- Submit
- **Expected:** Redirected to `/dashboard`. Operator workspace loads.

**Step 3 — Confirm workspace:**
- Operator dashboard shows matter pipeline stages.
- FounderAccessBar is visible at top (preview tabs for all workspaces).

---

## Phase 2 — Matter Review

**Step 4 — Open dashboard:**
Navigate to `/dashboard`. Confirm matter list loads.

**Step 5 — Find the test matter:**
Click into the test matter. Navigate to `/dashboard/deals/[matter-id]`.

**Step 6 — Review matter detail:**
Confirm visible fields:
- Matter reference (deal_id)
- Client name
- Document type
- Destination country
- Lane
- Payment status
- Event ledger

**Step 7 — Mark under review:**
Use the status action to move matter to `reviewing`.
**Expected:** Matter status updates. Event ledger records `MATTER_UNDER_REVIEW` or equivalent.

---

## Phase 3 — Quote + Payment Instructions

**Step 8 — Generate quote:**
Verify `payment_amount_due` is set on the matter.
If not, use the founder pricing override at `/dashboard/founder-pricing` to set the amount.

**Step 9 — Send Wise payment instructions:**
In the matter detail, use the "Send Payment Instructions" action.
**Expected:** Event ledger records `PAYMENT_INSTRUCTIONS_SENT`.

---

## Phase 4 — Discount Code (Client Side)

**Step 10 — Open client portal link:**
Navigate to `/portal` (or use the portal link from the matter detail).
If prompted, log in as a client account linked to the matter.

**Step 11 — Navigate to invoice:**
Go to `/portal/invoice`.
**Expected:** Invoice shows the full amount due. Discount code input field is visible (unpaid matters only).

**Step 12 — Enter discount code:**
- Type `CUNTSEATASS` into the discount code field.
- Click Apply.
**Expected:**
- Server validates code (server-side, not client-side).
- Discount summary appears showing:
  - Original amount
  - Discount: −100% (or full amount)
  - Final amount: $0.00
- No discount code UI in print layout.
- Event ledger records `DISCOUNT_APPLIED`.

**Step 13 — Verify Wise payment instructions reflect final amount:**
After discount, Wise payment card should show the final discounted amount.
If final amount is $0.00, the Wise card should reflect $0 or be suppressed.

---

## Phase 5 — Payment Confirmation

**Step 14 — Simulate payment (manual confirmation):**
Return to the operator dashboard at `/dashboard/deals/[matter-id]`.
Use the payment confirmation form:
- Payment method: Wise
- Payment reference: `TEST-WISE-REF-001`
- Amount received: match final_amount from discount
- Submit

**Step 15 — Confirm payment status:**
**Expected:**
- `payment_status` = `paid`
- `invoice_status` = `paid`
- Event ledger records `MANUAL_PAYMENT_CONFIRMED` or `WISE_PAYMENT_CONFIRMED`
- Matter status advances to `scheduled`
- Event ledger records `SCHEDULING_UNLOCKED`

**Step 16 — Verify client portal reflects paid status:**
Go back to `/portal/invoice`.
**Expected:**
- Invoice shows "Paid & Released" status.
- Discount code entry field is hidden (paid matters cannot apply codes).
- Payment method = Wise is visible.

---

## Phase 6 — Execution Flow

**Step 17 — Schedule execution:**
In dashboard matter detail, schedule the execution.
**Expected:** Matter status → `scheduled`. Event logged.

**Step 18 — Mark execution started:**
**Expected:** Matter status → `in_execution`. Event logged.

**Step 19 — Mark RON completed:**
**Expected:** Matter status → `ron_completed`. Event logged.

**Step 20 — Mark apostille submitted:**
**Expected:** Matter status → `apostille_processing`. Event logged.

**Step 21 — Mark apostille received:**
**Expected:** Matter status → `apostille_received`. Event logged.

**Step 22 — Mark ready for release:**
**Expected:** Matter status → `ready_for_release`. Event logged.

---

## Phase 7 — Shipment + Completion

**Step 23 — Add tracking:**
Enter a tracking number and carrier in the matter detail.
**Expected:** Tracking saved. Event ledger records `TRACKING_ADDED`.

**Step 24 — Mark shipped:**
**Expected:** Matter status → `shipped`. Tracking number visible.

**Step 25 — Check client portal status:**
Go to `/portal/tracking`.
**Expected:**
- Tracking number and carrier visible.
- Status = Shipped.
- No internal operator fields exposed.

**Step 26 — Mark delivered:**
**Expected:** Matter status → `delivered`. Event logged.

**Step 27 — Mark completed:**
**Expected:** Matter status → `completed`. Event logged.

---

## Phase 8 — Event Ledger Verification

**Step 28 — Review full event ledger:**
In the operator matter detail, open the event ledger.
**Expected minimum events recorded:**
- `MATTER_UNDER_REVIEW` (or equivalent)
- `PAYMENT_INSTRUCTIONS_SENT`
- `DISCOUNT_APPLIED`
- `MANUAL_PAYMENT_CONFIRMED` (or `WISE_PAYMENT_CONFIRMED`)
- `SCHEDULING_UNLOCKED`
- `EXECUTION_SCHEDULED`
- `EXECUTION_STARTED`
- `RON_COMPLETED`
- `APOSTILLE_SUBMITTED`
- `APOSTILLE_RECEIVED`
- `READY_FOR_RELEASE`
- `TRACKING_ADDED`
- `SHIPPED`
- `DELIVERED`
- `COMPLETED`

---

## Security Checks

**Step 29 — Confirm client cannot access other matters:**
Try navigating to a different matter's portal URL while logged in as the test client.
**Expected:** Access denied or safe not-found state.

**Step 30 — Confirm payment gate:**
Before payment is confirmed, attempt to advance matter to `scheduled` via a direct API call or UI.
**Expected:** API returns 409/403. Scheduling blocked.

**Step 31 — Confirm discount cannot be applied after payment:**
After payment is confirmed, attempt to apply another discount code.
**Expected:** API returns 409: "Discount codes cannot be applied after payment is confirmed."

---

## Test Pass Criteria

- [ ] Tiffany logs in on Operator tab and reaches `/dashboard`
- [ ] Matter detail loads with full field set
- [ ] Discount code `CUNTSEATASS` applies server-side correctly
- [ ] Final amount reflected in Wise payment card
- [ ] Payment confirmation updates `payment_status = paid`
- [ ] Scheduling unlocks after payment only
- [ ] Full execution lifecycle completes
- [ ] Client portal shows aligned status without internal data
- [ ] Event ledger is complete
- [ ] Security checks pass
