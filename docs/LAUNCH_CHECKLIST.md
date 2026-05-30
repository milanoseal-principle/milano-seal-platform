# The Milano Seal™ — Launch Checklist
## LAUNCH-CHECKLIST-01 · PHASE LOCKED — FULL PRODUCTION COMPLETION PASS

**Sealed:** 2026-05-24 · Branch `claude/festive-ramanujan-Vil9x` → `main`

> DO NOT TOUCH: login · auth · tokens · schema · storage · portal architecture ·
> dashboard architecture · VA architecture · alliance architecture · pricing · compliance · motion

---

## SQL Phase — COMPLETE ✅

All scripts have been run and verified. Do not re-run unless rebuilding from scratch.

| # | Script | Purpose | Status |
|---|--------|---------|--------|
| 1 | `scripts/001_create_deals_table.sql` | Deals table + base indexes | ✅ Done |
| 2 | `scripts/002_os_migration.sql` | Deals column additions (invoice fields) | ✅ Done |
| 3 | `scripts/003_trust_engine_schema.sql` | Compliance rules, messages, RLS | ✅ Done |
| 4 | `scripts/004_alliance_operator_schema.sql` | Operator schema, eligibility gate, Mexico fix | ✅ Done |
| 5 | `scripts/005_portal_safe_views.sql` | Schema patches + client-safe views | ✅ Done |
| 6 | `scripts/006_e2e_seed.sql` | Test data + documents bucket lock | ✅ Done |

> Script 006 creates matter_events, custody_ledger, files, audit_logs, portal_otps,
> and the `documents` storage bucket (private). Test deals use `@test.milanoseal.local`
> and must be deleted before go-live.

---

## Storage Bucket — LOCKED ✅

`documents` bucket confirmed private via SQL verification:

```
id: documents  |  name: documents  |  public: false
```

Bucket creation is automated in `scripts/006_e2e_seed.sql` step 7. If public ever
shows ON, fix in Supabase Dashboard → Storage → Buckets → documents → Settings →
Visibility → Private → Save.

---

## Security Gates — LOCKED ✅

| Gate | File | Status |
|------|------|--------|
| Service role key server-only | `lib/supabase/admin.ts` | ✅ Enforced |
| Portal safe fields allowlist | `app/api/portal/me/route.ts` | ✅ Enforced |
| Portal blocked fields denylist | `lib/portalProjection.ts` (30+ fields) | ✅ Enforced |
| No raw storage paths in responses | `lib/vault.ts`, portal routes | ✅ Enforced |
| Operator eligibility 7-gate | `lib/alliance/operatorEligibilityGate.ts` | ✅ Enforced |
| Toolbelt ≥80% required for routing | `evaluateEligibilityGate()` | ✅ Enforced |
| Payment confirmed before scheduled | State machine guard | ✅ Enforced |
| Admin override audited | `app/api/admin/override/route.ts` | ✅ Enforced |
| Signed URLs only (15 min expiry) | `lib/vault.ts` | ✅ Enforced |
| Idempotency on dispatch assign | `app/api/dispatch/assign/route.ts` | ✅ Enforced |
| Phantom data guard | `lib/alliance/phantomDataGuard.ts` | ✅ Active |
| Mexico: Hague/apostille correct | `lib/compliance.ts` + `scripts/004` | ✅ Fixed |
| Pricing: Signature $750, Priority $975, Executive $1,850 | `lib/lib/pricingEngine.ts` | ✅ Locked |
| documents bucket private | `storage.buckets` | ✅ Locked |
| RLS on all sensitive tables | `scripts/001–006` | ✅ Enforced |

---

## Pre-Launch Cleanup — Remaining

- [ ] Delete test deals: `DELETE FROM deals WHERE email LIKE '%@test.milanoseal.local';`
- [ ] Delete test operator: `DELETE FROM operator_profiles WHERE email LIKE '%@test.milanoseal.local';`
- [ ] Rotate `CRON_SECRET` and `WEBHOOK_SECRET` to production values
- [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` is not exposed in any `NEXT_PUBLIC_` variable

---

## Go-Live Verification

After deploying, verify these endpoints respond correctly:

| Endpoint | Expected |
|----------|----------|
| `GET /api/health/dispatch` | `{ eligibility_gate: "enforced", phantom_data_guard: "active" }` |
| `GET /api/health/payment` | `{ payment_gate: "enforced" }` |
| `GET /api/health/webhooks` | Lists active handlers |
| `GET /api/health/assistant` | `{ human_review_gate: "enforced" }` |
| `GET /api/portal/me` (unauthenticated) | `401 Unauthorized` |
| `GET /api/portal/files` (unauthenticated) | `401 Unauthorized` |

---

## Forbidden Phrases — Do Not Use in Any Copy

The following phrases must never appear in client-facing content:

- Mission Control, Sovereign Command
- government approved, guaranteed acceptance
- instant apostille, AI approved
- legal advice (except in disclaimers: "we do not provide legal advice")
- certified partner (unless actually certified)
- Buy Now, Checkout, Order
- cheap notary, fully automated legal service

---

## Branch Status — PHASE LOCKED

All patches merged to `main`. Branch: `claude/festive-ramanujan-Vil9x`

| Patch | Description | Status |
|-------|-------------|--------|
| ALLIANCE-03 | Operator gate + Tool Belt compliance | ✅ Merged |
| PORTAL-03 | Client-safe data boundary | ✅ Merged |
| STORAGE-VAULT-01 | Signed document access | ✅ Merged |
| PORTAL-MOTION-01 | Premium status rail | ✅ Merged |
| FINAL-E2E-SEED-01 | Test matters + schema patches | ✅ Merged |
| QA-01 | Production audit fixes | ✅ Merged |
| SQL-CORRECTNESS-01 | 8 SQL fixes (RLS, ordering, column names) | ✅ Merged |
| BUCKET-LOCK-01 | documents bucket private, automated in 006 | ✅ Locked |
| LAUNCH-CHECKLIST-01 | This file | ✅ Current |
| COMPLETION-AUDIT-01 | docs/vault field names, stale types, 006 UUID | ✅ Locked |

---

## Final Production Sanity Check (run once, real client)

```
1. Sign in.
2. Open /portal/documents — download one document.
   Expected: signed URL flow works, no raw paths in response.

3. Open /portal/tracking.
   Expected: status rail renders, no label_url or ship_to in response.

4. Open /portal/invoice.
   Expected: gross client-facing totals only.

5. Browser Network tab — confirm portal responses do NOT include:
   storage_path · file_path · file_url · evidence_path · label_url
   internal_notes · operator_notes · wise_transfer_id · wise_reference
   base_cost · shipping_cost · net_margin · margin · risk_score
   SUPABASE_SERVICE_ROLE_KEY · service_role
```

---

## Post-Lock Backlog (do not build until first real-client test)

```
1. Trust Routing & Revenue Intelligence
2. Courier Spread Intelligence
3. Operator Health Dashboard
4. VA Data Ingestion Gate
5. Alliance Dispatch Readiness
6. Secure Review Window
7. Premium Motion Polish
```

---

## Verdict

```
PHASE LOCKED — FULL PRODUCTION COMPLETION PASS.
Portal / Vault / Alliance seed / Verification SQL complete.
Documents bucket private.
No client-visible leaks found.
Auth/session strategy preserved.
Ready for controlled production monitoring and real-client test.
```
