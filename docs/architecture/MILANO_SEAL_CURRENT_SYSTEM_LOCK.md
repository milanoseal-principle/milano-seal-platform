# Milano Seal — Current System Lock

**Status: ACTIVE PRODUCTION SYSTEM**

---

## Locked Stack

The Milano Seal active production system is locked to:

| Layer | Provider |
|---|---|
| Frontend | Next.js / Vercel |
| Database / Auth / RLS | Supabase |
| Payments | Wise (primary) |
| Courier | Shippo |
| Remote Online Notarization | BlueNotary |
| Public Intelligence | Atlas / Global Document Intelligence |
| Operator Layer | Execution Center |
| Client Layer | Secure Matter Portal |
| Partner Layer | Alliance Desk |
| VA Layer | Operations Desk |
| Document Storage | The Vault |
| Shipping | Custody Rail |
| Payment Gate | Payment Gate |
| Release | Release Desk |

---

## System Description

The Execution Center coordinates payment, notarization, apostille/authentication, courier custody, release review, and verification across one deterministic workflow. Each module is gated: payment must confirm before execution, execution must complete before apostille, apostille must complete before courier, courier must deliver before release review, release review must approve before document release.

No step auto-advances. Every release requires operator approval.

---

## Module Health Categories

| Health Domain | What It Covers |
|---|---|
| Payment Health | Wise payment status, reconciliation, open balances |
| Execution Health | RON session state, signing room, apostille queue |
| Courier Health | Shippo label status, custody rail, delivered-not-released |
| Portal Health | Client portal access, document projection, OTP integrity |
| Alliance Health | Partner routing status, referral ledger, commission gate |
| VA Health | Task queue, escalations, permission compliance |
| Atlas Health | Country registry freshness, source confidence, stale data flags |
| Release Health | Release certificate status, verify route, release desk |

---

## Launch Priority Sequence

1. Deploy to Vercel (main branch green)
2. Apply migrations 001–024 in Supabase
3. Verify RLS enabled on all tables
4. Role smoke test: founder/admin, client, alliance, VA
5. Test Wise webhook (live payload)
6. Test Shippo webhook (live payload)
7. Test BlueNotary webhook (live payload)
8. Run first controlled paid matter end-to-end
9. Release first document packet
10. Record first operational memory entry

---

## What Must Not Change During Launch

- Auth system (Supabase Auth)
- RLS policies
- Payment gate logic (`assertPaymentConfirmed`, `evaluatePaymentGate`)
- Wise webhook verification (RSA-SHA256)
- Shippo webhook (HMAC)
- BlueNotary webhook (Bearer token)
- Release rule: delivered does not auto-release
- Signing URL: never exposed to client or VA
- VA blocked fields list
- Portal projection (no internal fields)

---

## Relationship to Universal Agnostic Infrastructure Engine

The Universal Agnostic Infrastructure Engine is a **future architecture doctrine only**. It must not be implemented during launch. The current locked stack is the active system. The doctrine exists to inform future extensibility without disrupting what is already built and proven.

See: `docs/architecture/UNIVERSAL_AGNOSTIC_INFRASTRUCTURE_ENGINE.md`
