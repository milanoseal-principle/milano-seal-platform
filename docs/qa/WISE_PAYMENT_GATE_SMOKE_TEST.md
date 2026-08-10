# Wise Payment Gate — Operator Smoke Test
**Milano Seal OS — Production Checklist**

Status: LIVE WEBHOOKS PRESENT / LIVE PAYLOAD VALIDATION REQUIRED

---

## Canonical production truth

Wise is the only payment authority for Milano Seal execution release.

Current live callback:

```text
https://www.themilanoseal.com/api/webhooks/wise
```

Current Wise subscriptions observed in the Wise Business account:

- Account deposits
- Transfer updates
- Transfer issues

All currently point to the canonical callback above.

Current subscriptions were created on schema `2.0.0`. Wise recommends the latest supported schema for each event; `4.0.0+` provides millisecond-precision ordering timestamps.

Do not delete the existing subscriptions until the replacement subscriptions have delivered successful signed test events to production.

---

## Critical payload rule

Do not model `balances#credit` as if these values all live on `data.resource`:

```text
resource.reference
resource.amount
resource.currency
```

That is not the documented Wise balance-credit payload.

For current Wise balance-credit schemas, the balance/profile identifier is in `data.resource`, while transaction values such as amount, currency and occurred-at are in `data`.

A generic balance credit does **not** provide a Milano invoice/matter reference that is safe to use as automatic payment authority.

Therefore:

```text
balances#credit
→ authenticate
→ deduplicate
→ store event
→ parse amount/currency from data
→ require reconciliation
→ DO NOT unlock scheduling from amount-only matching
```

This is intentionally fail-closed.

---

## Environment checks

Confirm in Vercel. All values are server-side only.

| Variable | Required | Production value |
|---|---|---|
| `WISE_ENV` | Yes | `production` |
| `WISE_API_TOKEN` | Yes | existing Wise Business personal API token |
| `WISE_PROFILE_ID` | Yes | Wise Business profile ID |
| `WISE_WEBHOOK_ALLOWED_TEST` | Yes | `false` |
| `WISE_WEBHOOK_TEST_BYPASS` | No | MUST be unset |

Never create any `NEXT_PUBLIC_WISE_*` variable.

Verify no Wise secrets appear in the client bundle:

```bash
grep -rn "WISE_API_TOKEN\|WISE_CLIENT_SECRET\|NEXT_PUBLIC_WISE" .next/static/ 2>/dev/null
# Expected: no output
```

---

## Canonical webhook security

Every production event must:

1. arrive over HTTPS
2. be read as the raw request body
3. verify `X-Signature-SHA256` against Wise's production RSA public key
4. deduplicate with `X-Delivery-Id`
5. preserve `X-Test-Notification`
6. store the raw provider event server-side only
7. never expose provider payloads in client/portal responses
8. never change `payment_status` to paid unless payment authority is proven

Wise may deliver events more than once and events may arrive out of order.

Use `data.occurred_at` for event chronology when the event provides it.

---

## Test 1 — webhook route is live

```bash
curl -i https://www.themilanoseal.com/api/webhooks/wise
```

Expected:

```text
HTTP 200
{"ok":true}
```

A redirect is a failure. Wise does not follow webhook redirects.

---

## Test 2 — invalid signature is rejected

```bash
curl -i -X POST https://www.themilanoseal.com/api/webhooks/wise \
  -H "Content-Type: application/json" \
  -H "X-Signature-SHA256: invalidsignature" \
  -d '{"event_type":"balances#credit","schema_version":"4.0.0","data":{}}'
```

Expected:

```text
HTTP 401
```

Payment state must not change.

---

## Test 3 — duplicate delivery is idempotent

Deliver the same valid Wise event twice using the same `X-Delivery-Id`.

Expected second response:

```json
{
  "received": true,
  "duplicate": true
}
```

No payment transition may execute twice.

---

## Test 4 — real balance-credit shape does not auto-pay

Use the Wise-documented balance credit shape:

```json
{
  "schema_version": "4.0.0",
  "subscription_id": "01234567-89ab-cdef-0123-456789abcdef",
  "event_type": "balances#credit",
  "sent_at": "2026-08-10T12:34:56.123Z",
  "data": {
    "resource": {
      "type": "balance-account",
      "id": 111,
      "profile_id": 222
    },
    "transaction_type": "credit",
    "amount": 975,
    "currency": "USD",
    "post_transaction_balance_amount": 1500,
    "occurred_at": "2026-08-10T12:34:55.789Z"
  }
}
```

Expected:

```text
HTTP 200
wise_webhook_events row stored
processing_error = PAYMENT_REVIEW_REQUIRED: balance_credit_requires_statement_reconciliation
NO deals.payment_status change
NO scheduling unlock
```

This test is mandatory because prior test documentation incorrectly placed the reference, amount and currency on `resource`.

---

## Test 5 — exact inbound reference is required for automatic confirmation

Automatic confirmation is allowed only when an authenticated inbound Wise event actually carries a payer/matter reference and all of the following are exact:

```text
reference == deals.wise_reference OR deals.deal_id
amount == deals.amount_due
currency == USD
production environment is valid
payment is not already paid
```

Then and only then:

```text
confirm_wise_payment_for_deal(...)
→ payment_status = paid
→ amount_paid updated
→ payment confirmation persisted
→ custody ledger appended
→ activity logged
→ payment_cleared notification emitted
→ scheduling gate becomes eligible
```

No amount-only, name-only, timestamp-only, or balance-only match is payment authority.

---

## Test 6 — underpayment stays locked

For a referenced inbound event where:

```text
amount_due = 975.00
amount_received = 500.00
```

Expected:

```text
PAYMENT_REVIEW_REQUIRED: underpayment
payment_status unchanged
scheduling locked
```

---

## Test 7 — overpayment stays locked for review

For a referenced inbound event where:

```text
amount_due = 975.00
amount_received = 1000.00
```

Expected:

```text
PAYMENT_REVIEW_REQUIRED: overpayment
payment_status unchanged
scheduling locked
```

---

## Test 8 — currency mismatch stays locked

For a referenced inbound event where the deal is USD but the event is EUR:

Expected:

```text
PAYMENT_REVIEW_REQUIRED: currency_mismatch
payment_status unchanged
scheduling locked
```

---

## Test 9 — production test notifications do not unlock payment

Production must have:

```text
WISE_ENV=production
WISE_WEBHOOK_ALLOWED_TEST=false
```

A Wise event with:

```text
X-Test-Notification: true
```

must return success/skip behavior without modifying payment authority.

---

## Test 10 — transfer updates are not client-payment authority

`transfers#state-change` describes Wise transfer lifecycle state.

`outgoing_payment_sent` means Wise sent an outbound payout. It must never be interpreted as a Milano client payment.

Expected:

```text
outgoing_payment_sent
→ PAYMENT_REVIEW_REQUIRED
→ no client payment confirmation
→ no scheduling unlock
```

---

## Test 11 — transfer issues do not unlock payment

`transfers#payout-failure` is operational failure intelligence for a payout.

Expected:

```text
store/authenticate event
never mark client matter paid
never unlock scheduling
```

---

## Test 12 — portal isolation

```bash
curl https://www.themilanoseal.com/api/portal/me/payment \
  -H "Cookie: <portal-session>"
```

Must not expose:

```text
raw_payload
WISE_API_TOKEN
idempotency_hash
delivery_id
signature material
provider internals
```

---

## Wise subscription replacement sequence

Do this only after the deployed webhook handler is green.

For each current subscription:

```text
1. Create a replacement subscription
2. Same callback URL
3. Same intended event type
4. Select latest available schema
5. Confirm Wise automatic test notification succeeds
6. Confirm event appears in wise_webhook_events
7. Confirm no unauthorized payment transition occurred
8. Only then delete the old 2.0.0 subscription
```

Do not create duplicate long-lived subscriptions for the same event after validation, because Wise will deliver duplicate callbacks to every active subscription.

---

## Production acceptance gate

Do not declare Wise transaction-ready until all are true:

- [ ] `GET /api/webhooks/wise` returns direct HTTP 200
- [ ] invalid signatures return 401
- [ ] production RSA key matches current Wise documentation
- [ ] duplicate `X-Delivery-Id` is idempotent
- [ ] real `balances#credit` payload parses `data.amount` and `data.currency`
- [ ] generic account deposit cannot auto-unlock a matter
- [ ] exact referenced inbound payment can call the atomic confirmation RPC
- [ ] underpayment remains locked
- [ ] overpayment remains locked
- [ ] currency mismatch remains locked
- [ ] test notifications cannot alter production payment authority
- [ ] transfer updates cannot masquerade as client deposits
- [ ] transfer issues cannot masquerade as client deposits
- [ ] client portal exposes no Wise secrets/provider payload
- [ ] latest-schema replacement subscription test succeeds before deleting 2.0.0 subscription

Until these pass, Wise remains connected but **not proven end-to-end transaction-ready**.
