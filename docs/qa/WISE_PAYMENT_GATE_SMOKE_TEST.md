# Wise Payment Gate — Operator Smoke Test
**Milano Seal OS — Pre-Production Checklist**
Status: MIGRATION PENDING / WEBHOOK REGISTRATION PENDING / SMOKE TEST PENDING

---

## Prerequisites

Apply migration 016 BEFORE registering the webhook URL in Wise.

```sql
-- Verify tables exist after migration
SELECT table_name FROM information_schema.tables
WHERE table_name IN (
  'wise_payment_intents',
  'wise_webhook_events',
  'payment_gate_audit',
  'wise_reconciliation_runs'
);
-- Expected: 4 rows
```

---

## Environment Checks

### 1. Environment Variables

Confirm in Vercel (server-side only, never NEXT_PUBLIC):

| Variable | Required | Notes |
|---|---|---|
| `WISE_ENV` | Yes | `sandbox` or `production` |
| `WISE_API_TOKEN` | Yes | Personal token or OAuth |
| `WISE_PROFILE_ID` | Yes | Business profile ID |
| `WISE_WEBHOOK_ALLOWED_TEST` | No | `true` only in sandbox |

Verify no Wise secrets appear in client bundle:

```bash
grep -rn "WISE_API_TOKEN\|WISE_CLIENT_SECRET" .next/static/ 2>/dev/null
# Expected: no output
```

### 2. Webhook URL

Correct URL (no query params — Wise requirement):
```
https://themilanoseal.com/api/webhooks/wise
```

Register in Wise dashboard > Settings > Webhooks.

Subscribe to:
- `transfers#state-change`
- `balances#credit`
- `balances#update`
- `transfers#payout-failure`
- `transfers#refund`

---

## Test Cases

### Test 1 — Unpaid matter cannot schedule

```bash
# Create matter, do NOT mark paid
curl -X POST https://themilanoseal.com/api/deals/{MATTER_ID}/schedule \
  -H "Cookie: <operator-session>"

# Expected: HTTP 402
# { "error": "PAYMENT_REQUIRED", "message": "Payment must be confirmed..." }
```

Check `payment_gate_audit` table — should have 1 row with `gate_status = PAYMENT_REQUIRED`.

---

### Test 2 — Partial payment cannot schedule

```bash
# Set amount_due = 975, amount_paid = 500, payment_status = partial
# Attempt schedule

# Expected: HTTP 402
# { "error": "PARTIAL_PAYMENT" }
```

---

### Test 3 — Invalid webhook signature is rejected

```bash
curl -X POST https://themilanoseal.com/api/webhooks/wise \
  -H "Content-Type: application/json" \
  -H "X-Signature-SHA256: invalidsignature" \
  -d '{"event_type":"transfers#state-change"}'

# Expected: HTTP 401
# Payment status must NOT change
# wise_webhook_events should have row with signature_valid = false
```

---

### Test 4 — Duplicate X-Delivery-Id is ignored

Send the same Wise test webhook twice (same X-Delivery-Id).

```
First delivery: HTTP 200
Second delivery: HTTP 200, body: { "received": true, "duplicate": true }
Payment status advances only once.
```

---

### Test 5 — Valid matched payment confirms

Send Wise test webhook with:
- Valid RSA signature
- `event_type: balances#credit`
- `resource.reference` = existing `wise_reference` on a deal
- `resource.amount` >= `amount_due`
- `resource.currency = "USD"`
- `WISE_ENV = sandbox`, `X-Test-Notification: true`, `WISE_WEBHOOK_ALLOWED_TEST = true`

Expected:
- `deals.payment_status = "paid"`
- `deals.amount_paid = <amount>`
- `deals.payment_confirmed_at` = timestamp
- `wise_webhook_events` row with `processed = true`
- `deal_activity` row with `action = "payment_confirmed"`

---

### Test 6 — Payment confirmed unlocks scheduling only

After Test 5, attempt to schedule:

```bash
curl -X POST https://themilanoseal.com/api/deals/{MATTER_ID}/schedule \
  -H "Cookie: <operator-session>"

# Expected: HTTP 200 — matter advances to "scheduled"
# Matter must NOT jump to in_execution or beyond
```

---

### Test 7 — Unmatched Wise event flags review

Send webhook with valid signature but `resource.reference` that does not match any deal.

Expected:
- HTTP 200 (received)
- `wise_webhook_events` row with `processing_error = "PAYMENT_REVIEW_REQUIRED: no_matching_deal"`
- NO payment status change on any deal

---

### Test 8 — Test notification blocked in production

Set `WISE_ENV = production`, `WISE_WEBHOOK_ALLOWED_TEST` unset or `false`.
Send webhook with `X-Test-Notification: true`.

Expected:
- HTTP 200, body: `{ "received": true, "skipped": true, "reason": "test_notification_blocked" }`
- Payment status unchanged

---

### Test 9 — Portal does not expose raw Wise payload

```bash
curl https://themilanoseal.com/api/portal/me/payment \
  -H "Cookie: <portal-session>"

# Expected: Only sanitized fields returned
# Must NOT contain: raw_payload, wise_transfer_id, wise_api_token,
#                   processing_error, idempotency_hash, delivery_id
```

---

### Test 10 — Ledger records payment confirmation

```sql
SELECT * FROM deal_activity
WHERE action = 'payment_confirmed'
ORDER BY created_at DESC
LIMIT 5;
-- Expected: row with actor = 'wise-webhook', amount_confirmed, scheduling_unlocked
```

---

### Test 11 — Migration 016 applied before webhook registration

Checklist (operator sign-off required):

- [ ] Migration 016 applied in Supabase
- [ ] `wise_payment_intents` table exists
- [ ] `wise_webhook_events` table exists
- [ ] `payment_gate_audit` table exists
- [ ] DB trigger `enforce_payment_gate` exists on `deals`
- [ ] RLS policies confirmed service_role only
- [ ] Webhook URL registered in Wise (no query params)
- [ ] `WISE_ENV` set correctly in Vercel
- [ ] `WISE_WEBHOOK_ALLOWED_TEST = false` in production
- [ ] All 11 tests above passed in sandbox before switching to production

---

## Operator Sign-Off

Before switching `WISE_ENV=production`:

| Check | Status | Signed By |
|---|---|---|
| Migration 016 applied | ☐ | |
| Sandbox smoke test passed | ☐ | |
| Invalid signature test passed | ☐ | |
| Duplicate dedup confirmed | ☐ | |
| Portal isolation confirmed | ☐ | |
| Wise account model confirmed (personal token vs OAuth) | ☐ | |
| Inbound payment event type confirmed with Wise | ☐ | |

**DO NOT switch WISE_ENV=production until all boxes checked.**
