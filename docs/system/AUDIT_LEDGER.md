# Automated Compliance & Audit Ledger

**Module:** Audit Trail  
**Status:** Spec ready — wire after DB health passes  
**Target table:** `audit_trail`

---

## Purpose

The Milano Seal™ operates on an immutable audit trail. Every movement, update, and execution phase is logged in real time. This is not just data management; it is the legal backbone of the Chain-of-Custody guarantee. If it happened, it is in the ledger. If it is in the ledger, it is verified.

---

## Schema

```sql
CREATE TABLE IF NOT EXISTS audit_trail (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id       TEXT NULL,
  deal_id         UUID NULL,
  event_name      TEXT NOT NULL,
  event_type      TEXT NOT NULL,
  actor_type      TEXT NOT NULL,   -- system | admin | founder_admin | portal_client
  actor_email     TEXT NULL,
  source_module   TEXT NULL,
  route           TEXT NULL,
  method          TEXT NULL,
  ip_address      TEXT NULL,
  user_agent      TEXT NULL,
  payload_summary JSONB NULL,      -- redacted — no PII, no keys, no payment details
  metadata        JSONB NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_matter_id  ON audit_trail(matter_id);
CREATE INDEX IF NOT EXISTS idx_audit_event_name ON audit_trail(event_name);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_trail(created_at DESC);
```

---

## Events

| Event | Trigger |
|---|---|
| `MATTER_CREATED` | Intake inserted to deals |
| `COMPLIANCE_VERIFIED` | Compliance check run at intake |
| `LANE_ASSIGNED` | Pricing/lane determined |
| `INVOICE_CREATED` | Invoice generated |
| `PAYMENT_LINK_CREATED` | Wise link generated |
| `PAYMENT_CONFIRMED` | Wise webhook payment confirmed |
| `SCHEDULING_UNLOCKED` | Payment gate cleared |
| `EXECUTION_SCHEDULED` | Operator schedules RON/mobile |
| `RON_COMPLETED` | Notarization complete |
| `APOSTILLE_SUBMITTED` | Submitted to SOS |
| `APOSTILLE_COMPLETED` | Received from SOS |
| `COURIER_RELEASED` | Label created, package dispatched |
| `DELIVERY_CONFIRMED` | Tracking: delivered |
| `PAID_AND_RELEASED` | Final release confirmed |
| `FOUNDER_PRICING_OVERRIDE_APPLIED` | Founder override applied |
| `REVIEW_REQUESTED` | Review prompt triggered |
| `FILE_UPLOADED` | Document uploaded to vault |
| `FILE_DOWNLOADED` | Document accessed |
| `PORTAL_ACCESSED` | Client portal opened |
| `SEAL_VERIFICATION_LOOKUP` | Public verify endpoint called |

---

## API Helper

**File:** `lib/audit/logAuditEvent.ts`

```typescript
// Non-blocking — fire and forget
// Never log: passport, SSN, payment account, SUPABASE_SERVICE_ROLE_KEY
export async function logAuditEvent(event: {
  event_name: string;
  event_type: string;
  actor_type: "system" | "admin" | "founder_admin" | "portal_client";
  actor_email?: string | null;
  matter_id?: string | null;
  deal_id?: string | null;
  source_module?: string;
  route?: string;
  payload_summary?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}): Promise<void>
```

---

## Dashboard View

**Route:** `/dashboard/audit-trail`  
**Access:** `founder_admin` only

**Columns:**
- Time
- Matter ID
- Event
- Actor
- Source Module
- Reference

**No client access to raw audit logs.**

---

## Security Rules

- Payload summaries must be redacted before logging
- Never log: full payment payloads, passport/SSN, signing URLs, storage paths, SUPABASE keys
- Logging is non-blocking — failure to log must never break the main operation
- `audit_trail` table: no RLS client reads; admin reads via service role only
