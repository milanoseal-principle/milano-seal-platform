# Launch Verification Checklist

**The Milano Seal™ — Operator-Facing Document**
**Version:** 1.0
**Scope:** Pre-launch verification of build, migrations, environment variables, webhooks, role access, security, and public routes.

All items must be verified before going live. Items marked **(System)** were validated during build. Items marked **(Operator)** require manual verification by the operator in a real browser or database session.

---

## 1. BUILD & DEPLOY

| # | Check | Owner | Status |
|---|-------|-------|--------|
| 1 | main branch build green on Vercel | Operator | - [ ] |
| 2 | Production URL confirmed live and reachable | Operator | - [ ] |
| 3 | `npm run build` — PASS confirmed locally | System | - [ ] |

- [ ] **(Operator)** main branch build green on Vercel
- [ ] **(Operator)** Production URL confirmed live
- [ ] **(System)** `npm run build`: PASS — confirmed locally

---

## 2. MIGRATIONS

All 20 migrations must be applied in Supabase. Verify each in the Supabase SQL editor by checking `supabase_migrations` or running `SELECT * FROM schema_migrations ORDER BY version;`.

- [ ] **(Operator)** Migration 001 — Initial schema: users, profiles
- [ ] **(Operator)** Migration 002 — Matters table: core fields and status enum
- [ ] **(Operator)** Migration 003 — Documents table: vault references
- [ ] **(Operator)** Migration 004 — Invoices table: line items, total, status
- [ ] **(Operator)** Migration 005 — Payments table: Wise transfer records
- [ ] **(Operator)** Migration 006 — Shipments table: Shippo tracking fields
- [ ] **(Operator)** Migration 007 — RON sessions table: BlueNotary session records
- [ ] **(Operator)** Migration 008 — Apostille tracking table: authority, status, submission date
- [ ] **(Operator)** Migration 009 — Verification certificates table: matter ID, release timestamp
- [ ] **(Operator)** Migration 010 — Alliance partners table: partner profile and commission reference
- [ ] **(Operator)** Migration 011 — Referrals table: matter-to-partner link
- [ ] **(Operator)** Migration 012 — Tasks table: VA task queue
- [ ] **(Operator)** Migration 013 — Messages table: platform communications, draft/sent status
- [ ] **(Operator)** Migration 014 — Country registry table: Atlas data with routing status
- [ ] **(Operator)** Migration 015 — Receiving authorities table: authority name, type, address
- [ ] **(Operator)** Migration 016 — Webhook events log: inbound event audit trail
- [ ] **(Operator)** Migration 017 — Role-based access policies: RLS policies for all tables
- [ ] **(Operator)** Migration 018 — Reconciliation records table: payment reconciliation log
- [ ] **(Operator)** Migration 019 — Institutional memory table: operator notes per matter
- [ ] **(Operator)** Migration 020 — Audit log table: status changes with actor and timestamp

---

## 3. ENV VARS

All variables must be set in Vercel production environment. No values appear here — confirm presence and non-empty in Vercel dashboard.

- [ ] **(Operator)** `NEXT_PUBLIC_SUPABASE_URL`
- [ ] **(Operator)** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] **(Operator)** `SUPABASE_SERVICE_ROLE_KEY`
- [ ] **(Operator)** `WISE_WEBHOOK_SECRET`
- [ ] **(Operator)** `SHIPPO_API_KEY`
- [ ] **(Operator)** `SHIPPO_WEBHOOK_SECRET`
- [ ] **(Operator)** `BLUENOTARY_API_KEY`
- [ ] **(Operator)** `BLUENOTARY_WEBHOOK_TOKEN`
- [ ] **(Operator)** `NEXT_PUBLIC_SITE_URL`

---

## 4. WEBHOOK REGISTRATION

Each webhook must be manually registered in the respective third-party dashboard and tested end to end.

### Wise

- [ ] **(Operator)** Webhook URL registered: `{SITE_URL}/api/webhooks/wise`
- [ ] **(Operator)** Signature verification tested with Wise test event
- [ ] **(Operator)** `outgoing_payment_sent` event received in webhook log — **note: this event does NOT confirm payment; operator reconciliation required**

### Shippo

- [ ] **(Operator)** Webhook URL registered: `{SITE_URL}/api/webhooks/shippo`
- [ ] **(Operator)** `track_updated` event received and logged in matter record
- [ ] **(Operator)** `delivered` event creates `DELIVERED_NOT_RELEASED` state — **confirm in database**
- [ ] **(Operator)** `delivered` event does NOT release documents to client — **confirm in Release Desk**

### BlueNotary

- [ ] **(Operator)** Webhook URL registered: `{SITE_URL}/api/webhooks/bluenotary`
- [ ] **(Operator)** Wrong Bearer token returns 401 — **test manually with curl or Postman**
- [ ] **(Operator)** `kba_failed` event triggers `RON_REVIEW_REQUIRED` status on matter
- [ ] **(Operator)** `session_completed` event stores documents privately in vault — **confirm in vault, not exposed to client**
- [ ] **(Operator)** `session_completed` event does NOT release documents to client — **confirm in portal view**

---

## 5. ROLE ACCESS SMOKE TEST

Test with real browser sessions authenticated as each role. Do not use shortcuts or seeded test tokens — use full login flow.

### Founder (full access)

- [ ] **(Operator)** `/dashboard` — ACCESS
- [ ] **(Operator)** `/portal` — ACCESS
- [ ] **(Operator)** `/alliance/dashboard` — ACCESS
- [ ] **(Operator)** `/va/dashboard` — ACCESS

### Client (role = client)

- [ ] **(Operator)** `/portal` — ACCESS
- [ ] **(Operator)** `/dashboard` — REDIRECT to login or 403
- [ ] **(Operator)** `/alliance/dashboard` — REDIRECT
- [ ] **(Operator)** `/va/dashboard` — REDIRECT

### Alliance Partner

- [ ] **(Operator)** `/alliance/dashboard` — ACCESS
- [ ] **(Operator)** `/dashboard` — REDIRECT
- [ ] **(Operator)** `/portal` — REDIRECT or own portal only

### VA

- [ ] **(Operator)** `/va/dashboard` — ACCESS
- [ ] **(Operator)** `/dashboard` — REDIRECT
- [ ] **(Operator)** `/portal` — REDIRECT

---

## 6. SECURITY SCAN RESULTS

The following sensitive fields were audited for exposure in VA-facing and client-facing routes. Code-level scan results are pre-recorded. Operator confirms no leakage in browser.

- [x] **(System)** No `label_url` exposed in VA or portal routes — PASS
- [x] **(System)** No `actual_shippo_cost` exposed — PASS
- [x] **(System)** No `wise_payload` exposed — PASS
- [x] **(System)** No `full_signing_url` exposed in client routes — PASS
- [x] **(System)** No `base64Doc` exposed — PASS
- [ ] **(Operator)** Confirm no sensitive fields visible in browser DevTools Network tab on `/portal`

---

## 7. PUBLIC ROUTE SMOKE TEST

- [ ] **(Operator)** `/` (homepage) — loads, no errors
- [ ] **(Operator)** `/services/apostille` — loads
- [ ] **(Operator)** `/countries/[slug]` — loads with valid country slug
- [ ] **(Operator)** `/intake` — loads; form accepts input and submits
- [ ] **(Operator)** `/login` — loads; email + password authentication works
- [ ] **(Operator)** `/verify/[id]` — loads with valid verification ID

---

## 8. REMAINING BLOCKERS

List any known blockers at time of publishing this checklist. Update and re-verify after each blocker is resolved.

| # | Blocker | Owner | Resolution |
|---|---------|-------|------------|
| — | (none recorded at time of publication) | — | — |

If blockers exist at launch time, document them here before sign-off. Do not launch with unresolved blockers in sections 1–6.

---

*This checklist must be completed in full before production traffic is accepted. Operator signature required on final review.*
