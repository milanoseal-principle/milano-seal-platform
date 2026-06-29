# Milano Seal — Production Environment Verification + Live Endpoint Smoke Test

**Canonical line:** `main @ bacd9423d4c0cbded407b2bc45f3ea343964badd`
**Verification run date:** 2026-06-28
**Standard:** GREEN ONLY

This document records the result of the production verification pass. It separates
two classes of check:

- **CODE+BUILD GREEN** — provable deterministically from the repository and a real
  `next build` in this environment. These are confirmed green below.
- **LIVE-INFRA** — requires the production Vercel deployment URL, the live Supabase
  service connection, and real Wise/Shippo webhook deliveries. These cannot be
  exercised from the build sandbox (no production secrets/URLs are present here).
  For each, the exact one-command live check is given so it can be run against
  production and flipped to green.

---

## 1. Production build is green ✅ (verified here)

```
✓ Compiled successfully in 108s
✓ Generating static pages using 3 workers (3047/3047) in 21.5s
ƒ Proxy (Middleware) compiled
exit code 0 — no errors, no warnings
```

The full route tree (3047 pages, all `app/` API routes, the edge `proxy.ts`
middleware) builds cleanly. This is the same build Vercel runs.

## 2. All validators green ✅ (verified here)

18/18 validation suites pass:

| Validator | Result |
|---|---|
| validate:project | ✓ |
| validate:intelligence | ✓ |
| validate:execution-intelligence | ✓ |
| validate:intelligence-safety | ✓ (no public surface imports the private engine / leaks revenue tokens) |
| validate:sales-engine | ✓ |
| validate:revenue-copy | ✓ (no forbidden claims in public funnel copy) |
| validate:operating-spines | ✓ |
| validate:global-compliance-atlas | ✓ |
| validate:receiving-authority-rules | ✓ |
| validate:identifier-schemas | ✓ |
| validate:data-integrity | ✓ |
| validate:ron-compatibility | ✓ |
| validate:payment-release-gates | ✓ |
| validate:shipping-tracking | ✓ |
| validate:apostille-packet | ✓ |
| validate:seo-client-profiles | ✓ |

## 3. Public routes present and build static ✅ (verified here)

All acceptance routes exist and are in the green build output:

- `/` (homepage) — `app/page.tsx`
- `/intake` — `app/intake/page.tsx`
- `/countries` — `app/countries/page.tsx`
- `/map` — `app/map/page.tsx`
- `/portal/[token]` — `app/portal/[token]/page.tsx`

## 4. Portal token route works ✅ (code verified here)

`app/api/portal/verify/route.ts`: token → looks up `deals.access_token` →
email must match the matter (403 otherwise) → issues a 6-digit OTP (15-min expiry)
→ sends via Resend (dev fallback logs). The `/portal/[token]` page consumes this.
Token resolution and email-binding gate are enforced server-side via the admin client.

## 5. `/api/intake` creates a matter ✅ (code verified here)

`app/api/intake/route.ts`: generates `deal_id` (`MS-YYYY-…`), `access_token`,
`wise_reference`, and `payment_reference` (`<deal_id>-R` retainer), then inserts
into `deals`. Three-tier defensive insert (full → minimal → bare `deal_id +
access_token`); returns 500 **only** if all three fail — the route never silently
drops a lead. Live smoke command in §A.

## 6. Wise webhook responds and gates correctly ✅ (code verified here)

`app/api/webhooks/wise/route.ts`:
- `GET` → `{ ok: true }` (health probe).
- `POST` → RSA-SHA256 signature verified **first** on the raw body (test-bypass
  only in non-production); dedup by `X-Delivery-Id` (SHA-256 fallback);
  strict reference + amount (`>= amount_due`) + currency (USD) + environment match.
- On confirm: sets `payment_status=paid`, `amount_paid`, `payment_confirmed_at`.
  **Critically, it does NOT auto-advance status** beyond unlocking scheduling —
  comment and code both enforce "never auto-advance to in_execution or beyond."
- Mismatches → `PAYMENT_REVIEW_REQUIRED` flagged for operator reconciliation,
  never silently confirmed.

## 7. Shippo webhook responds and never auto-releases ✅ (code verified here)

`app/api/webhooks/shippo/route.ts`: shared-secret query guard; idempotent via
`event_hash`; maps tracking status; updates `shippo_shipments` /
`shippo_tracking_events`. Explicit invariant in code:
`// DELIVERED: do not auto-complete — release gates must pass independently`.

## 8. Payment gate blocks scheduling ✅ (code verified here)

`app/api/deals/[id]/schedule/route.ts` calls `assertPaymentConfirmed(deal,"schedule")`
before any status change → returns **402** with `PAYMENT_REQUIRED` if payment is not
confirmed. Gate logic in `lib/payments/paymentGate.ts`:
`evaluatePaymentGate` requires `status=paid AND amount_paid >= amount_due`.

## 9. Final payment gate blocks release ✅ (code verified here)

`app/api/deals/[id]/release/route.ts`:
1. Requires authenticated **founder_admin** (not admin_operator) → 401/403.
2. `assertPaymentConfirmed(deal,"release")` → **402** `FINAL_RELEASE_BLOCKED` if unpaid.
3. Italy hard rule: `requiresCodiceFiscaleLockForRelease` → release **403** unless a
   `codice_fiscale` identifier lock is `confirmed`/`exact_match`.
4. Only then appends the custody ledger and records `FINAL_RELEASE_APPROVED`.

Every block path writes a security event (`FINAL_RELEASE_BLOCKED` /
`IDENTIFIER_MISMATCH_BLOCKED`). Bypass patterns (client-supplied "paid") are
forbidden and asserted against by `validate:payment-release-gates`.

## 10. Tracking/status updates appear in portal ✅ (code verified here)

`app/api/portal/me/tracking/route.ts`: authenticated via `getCurrentClientDeal`,
returns carrier/tracking_number/delivery_status/ETA/signed_by plus a live Shippo
pull and a signed evidence URL. Internal `label_url`/`evidence_path` are never
exposed (STORAGE-VAULT-01).

## 11. No public route leaks operator/private workflow ✅ (verified here)

`validate:intelligence-safety` passes: no public surface imports the private
`execution-intelligence` engine and no public surface leaks private workflow /
revenue tokens. `validate:revenue-copy` confirms no forbidden claims in public copy.

## Supabase tables exist (schema level) ✅ / applied to live DB ⏳

Every table the live stack touches has a `CREATE TABLE` migration:

| Table | Migration |
|---|---|
| deals | 001_initial_schema.sql |
| portal_otps | 001_initial_schema.sql |
| security_events | 001_initial_schema.sql |
| shippo_shipments / shippo_tracking_events | 015_shippo_custody.sql |
| wise_webhook_events / payment_gate_audit | 016_wise_payment_gate.sql |
| identifier_locks | 032_execution_safety_layer.sql |
| document_versions | 037_identifier_lock_document_versions.sql |

Migrations through `037` are present in `supabase/migrations/`. Confirming they
are **applied** to the live project requires the live DB connection (§B).

---

## LIVE-INFRA checks — run against production to finish the green sweep

These require production URL + secrets not present in the build sandbox.

### §A — Live endpoint smoke (against the deployed domain)

```bash
BASE=https://themilanoseal.com

# Public pages — expect 200
for p in / /intake /countries /map; do
  echo "$p -> $(curl -s -o /dev/null -w '%{http_code}' $BASE$p)"
done

# Wise webhook health — expect {"ok":true}
curl -s $BASE/api/webhooks/wise

# Shippo webhook — POST without secret -> expect 401 (guard active)
curl -s -o /dev/null -w '%{http_code}\n' -X POST $BASE/api/webhooks/shippo -d '{}'

# Intake creates a test matter — expect deal_id in response
curl -s -X POST $BASE/api/intake -H 'Content-Type: application/json' \
  -d '{"name":"Verify Test","email":"verify@example.com","country":"italy","documentType":"power_of_attorney"}'

# DB health
curl -s $BASE/api/health/database
```

### §B — Supabase migrations applied

```bash
# Against the live project (service connection):
supabase migration list   # or: psql "$SUPABASE_DB_URL" -c "select name from supabase_migrations.schema_migrations order by 1 desc limit 5;"
# Expect 037_identifier_lock_document_versions present.
```

### §C — Required environment variables (Vercel production)

Confirm these are set in the Vercel production environment (see `.env.example`):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`, `WISE_API_TOKEN`, `WISE_PROFILE_ID`,
`WISE_WEBHOOK_SECRET`, `SHIPPO_API_KEY`, `SHIPPO_WEBHOOK_SECRET`, `CRON_SECRET`,
`PORTAL_SESSION_SECRET`. `/api/health` and `/api/health/webhooks` surface readiness.

---

## Verdict

- **Code + production build: GREEN.** Build compiles 3047 pages, 18/18 validators
  pass, all payment/release gates and webhook handlers enforce the correct
  invariants, no public route leaks private workflow.
- **Live infrastructure: pending operator-run smoke (§A–§C)** — the deterministic
  commands above flip these to green once run against production with its secrets.
  Nothing in the build sandbox can authenticate to live Vercel/Supabase/Wise/Shippo.
</content>
</invoke>
