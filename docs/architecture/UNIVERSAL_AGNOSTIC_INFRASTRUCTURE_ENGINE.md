# Universal Agnostic Infrastructure Engine

**Status: FUTURE ARCHITECTURE DOCTRINE — DO NOT BUILD DURING LAUNCH**

---

## Purpose

This document describes the architectural vision for a provider-agnostic execution infrastructure. It is archived here as doctrine to inform future engineering decisions. It must not replace, modify, or extend the current Milano Seal production system during launch.

---

## Core Doctrine

A universal execution infrastructure routes any document workflow — payment, notarization, apostille/authentication, courier custody, release — across any provider combination without hardcoded dependencies. The system knows what needs to happen, not which specific vendor executes it.

---

## Capability Surface (Future Vision)

| Capability | Current Provider | Future: Any Provider |
|---|---|---|
| Payment gate | Wise | Any payment rail |
| Remote notarization | BlueNotary | Any RON provider |
| Courier custody | Shippo | Any courier API |
| Document storage | Supabase Storage | Any storage layer |
| Auth / identity | Supabase Auth | Any auth provider |
| Database | Supabase PostgreSQL | Any relational store |

---

## Orchestration Language

When applied to the current system, the universal orchestration doctrine describes the existing Milano Seal workflow as:

```
INTAKE → PAYMENT_CONFIRMED → EXECUTION_SCHEDULED → SIGNING_COMPLETE →
APOSTILLE_APPLIED → COURIER_DISPATCHED → DELIVERED → RELEASE_REVIEWED → RELEASED
```

Each state transition is:
- Gated (cannot skip)
- Operator-confirmed (no auto-advance on sensitive steps)
- Auditable (every transition logged)
- Reversible to review (blocked/on-hold states available at every stage)

---

## Quick Action Intelligence Routing

The Quick Action menu capability system maps operator intent to matter state:

| Group | Capability Domain |
|---|---|
| Matter | Intake, registry, pipeline, review |
| Financial | Payment gate, invoice, reconciliation, balances |
| Execution | Scheduling, checklist, signing room, apostille, release |
| Courier Custody | Label, address validation, rates, tracking, delivered-not-released |
| Documents | Vault, upload, review, certificates, release certificate |
| Intelligence | Atlas, compliance matrix, authority graph, execution DNA, truth engine |
| Alliance / Revenue | Alliance desk, referral ledger, partner registry, revenue desk |
| Operations | VA task queue, operational ledger, control room, admin validator |

---

## Atlas Source Governance Language

When applied to Atlas data, the universal source governance model uses:

| Field | Purpose |
|---|---|
| `source_url` | Original authority source |
| `source_type` | Official / operator / partner / client / unverified |
| `last_verified_at` | Timestamp of last human verification |
| `confidence_level` | VERIFIED_OFFICIAL / VERIFIED_OPERATOR / PARTNER_CONFIRMED / CLIENT_PROVIDED / UNVERIFIED_REVIEW_REQUIRED |
| `manual_review_required` | Flag for stale or disputed data |
| `public_safe_summary` | What can be shown externally without source exposure |

---

## Truth Engine Health Model

A universal truth engine monitors system health across capability domains:

- **Payment Health** — Confirms payment rails are processing, reconciliation is current, no open anomalies
- **Execution Health** — RON sessions in valid state, no stuck signing rooms, apostille queue clear
- **Courier Health** — No exception-state shipments, delivered-not-released count at zero
- **Portal Health** — Client sessions valid, OTPs not expired, projection layer clean
- **Alliance Health** — Partner routing status correct, referral ledger reconciled
- **VA Health** — Task queue clear, no overdue escalations, permission compliance verified
- **Atlas Health** — No stale country data beyond threshold, no unverified entries in active use
- **Release Health** — No delivered-not-released matters, release certificates valid

---

## Implementation Gate

**Do not build the Universal Agnostic Infrastructure Engine until:**

- [ ] First paid matter completed end-to-end
- [ ] All 24 migrations applied and verified
- [ ] Wise webhook tested live
- [ ] Shippo webhook tested live
- [ ] BlueNotary webhook tested live
- [ ] Role smoke test passed for all 4 roles
- [ ] Production deploy stable for 30 days

---

## Current System Relationship

The current Milano Seal system is the correct implementation for launch. This doctrine exists to ensure future architectural decisions extend the system rather than disrupt it. Build on top. Never replace what works.

See: `docs/architecture/MILANO_SEAL_CURRENT_SYSTEM_LOCK.md`
