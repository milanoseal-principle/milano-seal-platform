# Shippo Custody Smoke Test
## Milano Seal · Operator Pre-Deploy Checklist

### 1. ENV CHECK
- [ ] `SHIPPO_API_KEY` exists
- [ ] `SHIPPO_WEBHOOK_SECRET` exists  
- [ ] `SHIPPO_MODE=test` confirmed in non-production
- [ ] `NEXT_PUBLIC_APP_URL` exists

### 2. MIGRATION CHECK
- [ ] `shippo_shipments` table exists (migration 015 applied)
- [ ] `shippo_tracking_events` table exists

### 3. LABEL GATE — UNPAID MATTER
Attempt label creation on unpaid matter.  
**Expected:** Blocked with `PAYMENT_REQUIRED`

### 4. LABEL GATE — APOSTILLE INCOMPLETE
Attempt label on matter requiring apostille, apostille not yet complete.  
**Expected:** Blocked with `APOSTILLE_NOT_COMPLETE`

### 5. RATE PREVIEW
Open `/dashboard/shipping`, preview rates on a valid matter.  
**Expected:** Carrier, service level, estimated days shown. No wholesale cost exposed.

### 6. LABEL PURCHASE
Purchase sandbox label on a gate-cleared matter.  
**Expected:**
- `shippo_shipments` row created
- `label_url` stored server-side only — not returned to client
- `COURIER_LABEL_CREATED` ledger event created

### 7. TRACKING REGISTRATION
**Expected:** Tracking number registered with Shippo. `tracking_registered_at` set.

### 8. WEBHOOK — FIRST EVENT
Send Shippo test webhook to `/api/webhooks/shippo?secret=SHIPPO_WEBHOOK_SECRET`.  
**Expected:**
- `shippo_tracking_events` row created
- `courier_status` updated

### 9. WEBHOOK — DUPLICATE
Send identical webhook payload again.  
**Expected:** Returns `{ duplicate: true }`. No duplicate event inserted.

### 10. PORTAL COURIER VIEW
Open portal courier tab for the matter.  
**Expected:**
- Carrier, status, tracking display, sanitized events shown
- `label_url`, cost, `raw_event`, operator notes NOT present in response

### 11. DELIVERED — NO AUTO-RELEASE
Simulate `DELIVERED` webhook.  
**Expected:**
- `courier_status = DELIVERED`
- Matter is NOT auto-released
- Release Review still required

### FINAL PASS
All 11 checks green → Shippo Custody Layer ready for production traffic.
