# Revenue Intelligence Roadmap

**Status:** STAGED BACKLOG — DO NOT BUILD PRODUCTION AUTOMATION YET
**Classification:** Operator Only — Not for alliance, VA, or portal exposure

---

## Overview

This document stages the revenue intelligence architecture for The Milano Seal™. No component in this roadmap is to be built until explicitly authorized. All items below require operator review before implementation.

---

## Staged Modules

### 1. Partner Registry
- Persistent registry of alliance partners with role, corridor focus, and observation history
- No public rankings, no revenue exposure to partners
- Operator-managed only

### 2. Referral Ledger
- Immutable log of referral source capture events
- Attribution locks at intake unless operator audits an override
- Fields: source_partner_id, matter_id, captured_at, attribution_status
- No automatic payout trigger

### 3. Alliance Revenue Attribution
- After a matter reaches PAID_AND_RELEASED, operator may associate a referral source
- Manual attribution only — no automatic revenue sharing
- Attribution stored in ledger, visible to operator only

### 4. Partner Payout Review
- Payout calculation is operator-initiated, not automated
- No payout without: (a) PAID_AND_RELEASED matter, (b) operator confirmation, (c) audit log entry
- Payout amounts are never exposed to VA, alliance partners, or portal

### 5. Matter Source Attribution
- Every matter intake should capture source: direct, referral, alliance, organic, partner-referred
- Attribution field added to matter record at intake
- Attribution is locked at payment confirmation (PAYMENT_CONFIRMED event)

### 6. Attorney Directory
- Curated list of referring attorneys with matter history (operator-only)
- No public directory
- No automatic revenue routing based on directory membership

### 7. International Partner Directory
- Registry of international practitioners (Italy, Portugal, Mexico, etc.)
- Source observation contributors logged here
- No public exposure, no revenue exposure

---

## Architecture Rules

1. **No automatic payouts** — all partner compensation requires explicit operator action
2. **No public partner rankings** — partnership is private between operator and partner
3. **No revenue exposure to VA** — VA task system has no visibility into revenue, margin, or payout
4. **No margin exposure to alliance** — partners see only their own referral status
5. **No payout without PAID_AND_RELEASED** — the ledger event PAID_AND_RELEASED is the prerequisite for any payout calculation
6. **Attribution locks at intake** — once captured, referral attribution requires an audited operator override to change
7. **All payout decisions are operator-confirmed** — no automation, no webhook trigger, no scheduled job

---

## Build Sequence (when authorized)

| Phase | Module | Prerequisite |
|-------|--------|-------------|
| R1 | Partner Registry | Alliance observation intake live |
| R2 | Referral Ledger | Operational Ledger taxonomy live |
| R3 | Source Attribution | Matter intake UTM capture live |
| R4 | Attribution Lock | PAYMENT_CONFIRMED event in ledger |
| R5 | Payout Review UI | R1 + R2 + R4 complete |
| R6 | Attorney Directory | R1 + operator approval |
| R7 | International Partner Directory | R6 + partner consent flow |

---

## What Is Explicitly NOT Staged

- Automatic payout webhooks
- Public revenue leaderboards
- Partner-visible margin data
- VA-accessible revenue figures
- Automated revenue routing based on referral source

---

*This roadmap is operator-only. It is not exposed in portal, alliance portal, or VA workspace.*
