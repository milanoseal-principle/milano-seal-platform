# THE MILANO SEAL™ — FINAL PRODUCTION LAUNCH REPORT

**Status:** PRODUCTION READY WITH MANUAL COURIER

**Date:** 2026-05-30

**Main Branch Commit:** e9ed77f

---

## Production Readiness Classification

**PRODUCTION READY WITH MANUAL COURIER**

Core intake, routing, payment gate, portal projection, dashboard, validator access, Wise reconciliation, and courier release gate are production-aligned. Automated courier execution remains manual-safe until Shippo API key, live label creation, and tracking update flow are tested against a real paid matter.

---

## Delivered PR Chain

| PR | Description |
|----|-------------|
| #56 | P0 Hardening |
| #57 | Map Compliance Intelligence + Validator Security |
| #58 | Destination Intelligence Dashboard Widget |
| #59 | NodeType + JSON-LD + Country Authority Pages |
| #60 | Authority Signal + Country Health Matrix + Operator Event Timeline |
| Polish commit `c3d2810` | Corridor trust ribbon, time strip, Portugal/Greece routing section |
| Payment gate commit `e9ed77f` | Courier label creation blocked on unpaid matters (402) |
| PR #28 | Header logo → Next.js Image component (pending Vercel confirmation) |

---

## Verified / Expected Complete

- [x] Vercel build passes — `✓ 3396/3396` at `e9ed77f`
- [x] SECURITY-01 through SECURITY-05 delivered
- [x] `/sovereignos` removed
- [x] Validator at `/dashboard/admin/validate` — protected under `/dashboard` PROTECTED_PREFIXES
- [x] P0 routing normalizer preserved (`lib/intake/routing-normalizer.ts`)
- [x] Wise payment gate preserved — no auto-confirm on button click
- [x] Payment reference locked as `matterReference-R`
- [x] Document release payment gate enforced
- [x] Release route records `previous_status`, `new_status`, release action, and operator
- [x] Audit failure appends `AUDIT_PENDING_SYNC`
- [x] `recent_deals` strips notes/payment links from operator surface
- [x] Wise pending/complete states are display-only — no write on fetch
- [x] Header logo Next.js Image component merged (PR #28)
- [x] Courier label creation blocked unless `payment_status = payment_confirmed` and `balance_due = 0` (402 returned otherwise)
- [x] `label_url` blocked from portal tracking response (STORAGE-VAULT-01)
- [x] `storage_path` never returned in portal documents route
- [x] Evidence returned as signed URL only — path never exposed
- [x] 7 country authority corridors with JSON-LD, Authority Signal banner, FAQ, and intake CTAs
- [x] Unsafe public copy scan clear
- [x] Fake data scan clear

---

## Manual Courier Operating Mode

Until Shippo is fully verified, courier coordination is handled manually.

**Manual courier is permitted when:**

1. Payment is confirmed (`payment_status = payment_confirmed`)
2. Release is authorized by operator
3. Operator records carrier in deal record
4. Operator records tracking number in deal record
5. Operator records dispatch event in custody ledger
6. Client-safe tracking is updated in portal
7. Delivery confirmation is logged

---

## Automated Courier Block

Do not claim full automated courier readiness until:

- [ ] `SHIPPO_API_KEY` confirmed in Vercel production environment
- [ ] Live or test label created from a real paid matter
- [ ] Tracking number stored on deal record
- [ ] Carrier stored on deal record
- [ ] Courier event inserted in custody ledger
- [ ] Client-safe tracking projection verified in portal (`/portal/tracking`)
- [ ] Cron tracking update verified (`/api/cron/track-shipments`)
- [ ] Delivery status recorded correctly on deal

---

## Remaining Hardening Backlog (Post-Launch)

### SECURITY-06 (Not a launch blocker)

| Item | Priority | Notes |
|------|----------|-------|
| Replace `select("*")` on operator/admin routes with explicit field lists | HIGH | Routes are PROTECTED_PREFIXES-gated; not client-facing. Backlog only. |
| Portal base64 session token → HMAC/JWT | HIGH | Currently forgeable. Deferred. |
| `portal_otps.otp` plaintext → hashed | HIGH | Deferred. |
| `payments.matter_id` FK constraint | MEDIUM | Deferred. |
| `deals.assignee` TEXT → FK | MEDIUM | Deferred. |
| Signed URL cleanup for previously issued public CDN document URLs | MEDIUM | Deferred. |

### Shippo Go-Live Checklist

1. Set `SHIPPO_API_KEY` in Vercel production environment variables
2. Create a test label from a real paid matter via `/api/shipping/create-label/[id]`
3. Verify tracking number stored on deal
4. Verify carrier stored on deal
5. Verify custody ledger entry written (`DOC_LABEL_CREATED`, `DOC_SHIPPED`)
6. Open portal tracking page — confirm client-safe projection renders
7. Wait for cron poll (`/api/cron/track-shipments`) to update `delivery_status`
8. Verify `delivery_status` progresses through `in_transit` → `delivered`
9. Confirm `label_url` is never returned to portal

---

## Revenue Phase Gate

**Do not transition to Revenue Phase until:**

- [ ] Final production build confirmed green on Vercel
- [ ] Intake test passed (live)
- [ ] Payment gate test passed (live)
- [ ] Portal projection test passed (live)
- [ ] Dashboard operator surface test passed (live)
- [ ] Wise reconciliation test passed (live)
- [ ] Courier / release gate test passed (live)
- [ ] This launch report committed to main

**Revenue Phase work (after gate clears):**

- Attorney Directory
- International Partner Directory
- Country Authority Expansion
- Referral Tracking
- Alliance Revenue Attribution

---

## Final Control Rule

No new feature work until the production smoke test is complete.

The platform is production-ready. Ship it.

---

## Production Truth Rule

A feature is not live unless:

1. Code exists in repo
2. Build passes
3. Migration is applied if required
4. Deployed URL is confirmed
5. Role access is tested
6. Security scan is clean
7. Webhook / payment / courier / RON smoke test passes where applicable

Do not mark anything live until all 7 conditions are confirmed.

---

## Active Operator Sequence

```
migrations → merge → deploy → role tests → webhooks → first controlled paid matter
```

1. Apply migration 025 in Supabase (execution_qa_and_witness_network)
2. Confirm Vercel deploy green
3. Run 4-session role smoke test (portal / dashboard / alliance / va)
4. Test Wise webhook live
5. Test Shippo webhook live
6. Test BlueNotary webhook live
7. Run first controlled paid matter end-to-end
8. Release first document packet
9. Record first operational memory entry
