# Atlas Data Governance

**The Milano Seal™ — Operator-Facing Document**
**Version:** 1.0
**Scope:** Data governance rules for the country registry (Atlas), projection rules, stale data policy, and receiving authority database.

---

## Source Schema

Every entry in the Atlas / `country_registry` table carries the following governance fields. These fields drive routing behavior, public display, and operator visibility.

```
source_url: string | null
  -- Official URL for the source of this entry's requirements.
  -- Should be a government agency, consulate website, Hague bureau page, or operator-verified reference.
  -- Null is permitted for manually entered entries pending verification.

source_type: "official_gov" | "consulate" | "hague_bureau" | "operator_verified" | "manual"
  -- Classification of the source.
  -- "official_gov": government ministry or official state agency.
  -- "consulate": consulate or embassy website.
  -- "hague_bureau": HCCH (Hague Conference) official documentation.
  -- "operator_verified": confirmed directly by operator via contact with authority.
  -- "manual": entered manually without a confirmed external source.

last_verified_at: timestamp | null
  -- ISO 8601 timestamp of the last verification event.
  -- Null if the entry has never been verified against a live source.

verified_by: "operator" | "auto" | null
  -- Who performed the last verification.
  -- "auto": system-assisted check (not a substitute for operator review).
  -- "operator": a human operator confirmed this entry against source.
  -- Null if unverified.

confidence_level: "HIGH" | "MEDIUM" | "LOW" | "UNVERIFIED"
  -- Operator-assigned confidence in accuracy of this entry.
  -- HIGH: verified by operator against official source within stale_after_days window.
  -- MEDIUM: verified but approaching stale threshold, or verified via consulate rather than primary authority.
  -- LOW: manually entered or auto-checked only; operator review needed.
  -- UNVERIFIED: no verification has occurred.

stale_after_days: number
  -- Number of days after last_verified_at before routing_status is automatically set to MANUAL_REVIEW.
  -- Default: 90 days for most countries.
  -- Set to 30 for high-change countries (e.g., countries with frequent consular policy updates,
     active political transitions, or known processing instability).

manual_review_required: boolean
  -- If true, operator must review this entry before it can be used for routing decisions.
  -- Set automatically when stale_after_days is exceeded.
  -- Must be cleared by operator after review.

public_projection: boolean
  -- If true, this entry is eligible for display on the public-facing Atlas.
  -- Entries with routing_status = SUSPENDED are not shown publicly regardless of this flag.

operator_projection: boolean
  -- If true, operator sees the full record including source_url, confidence_level,
     last_verified_at, and routing exceptions.
  -- Additional fields in the operator view are not projected to the public Atlas.

routing_status: "ACTIVE" | "MANUAL_REVIEW" | "SUSPENDED" | "UNKNOWN"
  -- ACTIVE: corridor is confirmed and available for standard routing.
  -- MANUAL_REVIEW: entry has exceeded stale_after_days or was manually flagged; requires operator review before routing.
  -- SUSPENDED: corridor is not available; do not route matters through this entry.
  -- UNKNOWN: entry has not been reviewed or confirmed; do not use for routing.
```

---

## Projection Rules

### Public-Facing Atlas

The public Atlas displays only the following fields per country or corridor entry:

- `routing_status` — shown as human-readable status label
- Document requirements — general list only; no authority-specific internal routing detail
- Authority name — the name of the apostille or authentication authority as known to the public
- Hague Convention member status — yes/no, with membership year if available

The public Atlas does **not** show:
- `source_url`
- `confidence_level`
- `last_verified_at`
- Internal routing exceptions
- Operator notes
- Partner-specific corridors
- Any fields prefixed or described as internal

### Operator Atlas

Operators see the full record in addition to all public fields:

- `source_url`
- `confidence_level`
- `last_verified_at`
- `verified_by`
- `stale_after_days`
- `manual_review_required`
- Internal routing notes
- Receiving authority detail

### Never Expose on Public Pages

The following must never appear on public-facing pages, regardless of any configuration:

- Internal routing exceptions
- Operator notes
- Partner-specific corridors or pricing adjustments
- Raw authority contact details intended for operator use only
- Any field with `operator_` prefix

---

## Stale Data Policy

1. After `stale_after_days` have elapsed since `last_verified_at`, the system automatically sets `routing_status = MANUAL_REVIEW` for that entry.

2. When `routing_status = MANUAL_REVIEW`, the public Atlas displays the following notice in place of normal routing detail:

   > **Manual Routing Review required for this corridor.** Contact your coordinator for current requirements.

3. The public Atlas does **not** imply complete or guaranteed coverage for any country. The Atlas is a reference tool, not a binding routing commitment.

4. When `routing_status = SUSPENDED`, the country or corridor entry is not shown on the public Atlas. The operator sees the entry with its status for internal tracking purposes.

5. Operator must set `manual_review_required = false` and update `last_verified_at` after completing a verification review. Routing status is not automatically restored to ACTIVE — the operator must explicitly update the record.

---

## Required Copy on Atlas

The following disclaimer must appear on every public-facing Atlas page, at or near the top of the country or corridor detail view. It may not be removed, collapsed by default, or rendered in a way that obscures it from a reasonable reader.

> Country and document requirements shown are for reference only. Final routing is confirmed by your coordinator at intake. Requirements change — The Milano Seal verifies each corridor before execution.

---

## Receiving Authority Database

For every matter that proceeds through apostille or authentication, the following fields must be recorded in the receiving authority record linked to that matter. This data feeds institutional memory and future routing decisions.

```
authority_name: string
  -- Full legal name of the authority (e.g., "California Secretary of State",
     "U.S. Department of State Authentications Office").

authority_type: "apostille" | "consulate" | "notary_board" | "court" | "registry"
  -- Classification of the authority type.

address: string
  -- Physical mailing or submission address used for this matter.
  -- Record the address actually used, not a general listing.

processing_time_estimate: string | null
  -- Estimated processing time as stated by the authority at time of submission
     (e.g., "10–15 business days", "expedite: 2 business days").
  -- Null if not confirmed.

last_confirmed_at: timestamp
  -- When this authority record was last confirmed as accurate for an active matter.

operator_confirmed: boolean
  -- True if an operator personally confirmed this authority record (not auto-populated).
  -- False if the record was pre-populated from Atlas data and not yet confirmed for this matter.
```

Receiving authority records are operator-only. They are not projected to the client portal or public Atlas. They inform the institutional memory note added at matter close.

---

*This document governs the Atlas data model and projection behavior. Any changes to projection rules or stale thresholds require operator review and documentation of the change reason.*
