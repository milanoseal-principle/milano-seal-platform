# The Milano Seal™ — Final Production Module Architecture

**Status:** Docs injected. Modules wire in sequence after DB health passes.  
**Deployment Gate:** Vercel build green + `/api/admin/db-health` passes + `deals_write.ok = true`

---

## Module Index

| # | Module | Doc | Status |
|---|---|---|---|
| 1 | Automated Compliance & Audit Ledger | [AUDIT_LEDGER.md](./AUDIT_LEDGER.md) | Spec ready |
| 2 | Security & RLS Hardening | [RLS_HARDENING.md](../security/RLS_HARDENING.md) | Spec ready |
| 3 | Real-Time Concierge Webhooks | [HIGH_VALUE_LEAD_ALERTS.md](../ops/HIGH_VALUE_LEAD_ALERTS.md) | Spec ready |
| 4 | Scalable Execution Pipeline | [EXECUTION_PIPELINE.md](../ops/EXECUTION_PIPELINE.md) | Spec ready |
| 5 | P&L Attribution Insights | Dashboard insights tab | Spec ready |
| 6 | Seal of Authenticity API | `/app/verify/` | Spec ready |
| 7 | Courier / Logistics Automation | Shippo + release workflow | Spec ready |
| 8 | Client-Facing Progress Passport | [PROGRESS_PASSPORT.md](../ops/PROGRESS_PASSPORT.md) | Spec ready |
| 9 | Systematic Review Capture | [REVIEW_CAPTURE.md](../ops/REVIEW_CAPTURE.md) | Partially built |
| 10 | Founder Discount Override Control | `/dashboard/founder-pricing` | Built — commit `014a245` |
| 11 | Payment Display / Invoice Safety | Portal invoice page | Spec ready |
| 12 | First Real Matter Runbook | [FIRST_REAL_MATTER_RUNBOOK.md](../runbooks/FIRST_REAL_MATTER_RUNBOOK.md) | Built |

---

## Build Order After DB Health Passes

```
1. Confirm Vercel build green
2. Run /api/admin/db-health
3. Confirm deals_write.ok = true
4. Apply migration 027_founder_discount_override.sql (if not applied)
5. Build Payment Display / Invoice Safety Gate
6. Build Audit Ledger (migration + API helper + dashboard view)
7. Build High-Value Lead Alert (lib/alerts/highValueLead.ts)
8. Build Progress Passport portal component
9. Build Seal of Authenticity API (/verify)
10. Run public copy/security scan
11. Final test matters (A, B, C, D)
12. Launch lock
```

---

## Deployment Stance

> "The Milano Seal™ is now positioned as both a legal-tech instrument and a cinematic logistics experience. The system is not simply a website; it is a controlled execution environment for high-trust document movement. Every intake, payment, signature, apostille, courier handoff, and release event must reinforce the same standard: secure, visible, premium, and operationally precise."

---

## Tone Standard: Embassy Gangster

- Legal-tech authority
- Cinematic logistics experience
- Calm control
- High-trust infrastructure
- No SaaS fluff
- No fake claims
- No overpromising
- No public claim of cryptographic logging unless hash-chain is actually implemented (use "immutably logged" instead)

---

## Hard Safety Rules (Never Violate)

Never expose to client portal:
- `internal_notes`
- `operator_notes`
- `discount_note`
- `discount_reason`
- `raw_webhook`
- `raw_event`
- Payment payloads
- `margin`
- `SUPABASE_SERVICE_ROLE_KEY`

Never publish to public pages:
- Capability claims for unbuilt modules
- Fake AggregateRating / fake reviews
- "Cryptographically logged" without implementation
- Guaranteed legal outcomes
- Government approval claims
