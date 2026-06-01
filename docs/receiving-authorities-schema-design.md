# Receiving Authorities Intelligence Schema

**Status:** Design Only — Not Implemented  
**Purpose:** Foundation for authority-specific workflow requirements beyond country-level derivation  
**Gate:** Production data requires operator verification before any requirement is surfaced to clients  
**Last Updated:** 2026-05-31

---

## Authority Confidence Levels

Every authority record must carry a `verification_status`. This controls what the readiness engine is allowed to assert.

| Level | Code | Engine Behavior |
|---|---|---|
| Authority Verified | `AUTHORITY_VERIFIED` | Full auto-drive of readiness requirements |
| Multi-Source Confirmed | `MULTI_SOURCE_CONFIRMED` | Drives readiness with source attribution shown |
| Partner Confirmed | `PARTNER_CONFIRMED` | Drives readiness; note shown: "Partner-confirmed" |
| Observed | `OBSERVED` | Drives readiness with caution note |
| Unverified | `UNVERIFIED` | Shows "Verification Required" — does not drive requirements |
| Verification Required | `VERIFICATION_REQUIRED` | Blocks automatic requirement population |

**Rule:** Only `AUTHORITY_VERIFIED` and `MULTI_SOURCE_CONFIRMED` may auto-drive execution requirements without a "Verification Required" flag.

**Escalation:** Any authority at `UNVERIFIED` or `VERIFICATION_REQUIRED` that is referenced in an active matter triggers an operator alert.

---

## Authority Friction Scoring

Friction score 1–10 drives QA requirements, complexity, and escalation routing.

| Score | Level | Behavior |
|---|---|---|
| 1–3 | Low Friction | Standard processing |
| 4–6 | Moderate Friction | Enhanced QA recommended |
| 7–8 | High Friction | Operator review required before apostille |
| 9–10 | Executive Attention | Nick review required; maximum QA applied |

---

## Priority Authorities for Verification (Phase 1)

High-volume, high-impact corridors where authority-level specificity reduces rejection risk most:

| Country | Authority | Type | Friction Est. | Verification Status |
|---|---|---|---|---|
| Italy | Comune di Roma | Municipality | 6 | Unverified |
| Italy | Comune di Cansano | Municipality | 8 | Unverified |
| Italy | Prefettura di Roma | State Office | 7 | Unverified |
| Brazil | Cartório de Registro | Notary Registry | 7 | Unverified |
| Mexico | Registro Civil | Civil Registry | 5 | Unverified |
| Spain | Registro Civil Municipal | Civil Registry | 5 | Unverified |
| Germany | Standesamt | Municipal Court | 6 | Unverified |
| UAE | Dubai Courts | Government | 8 | Unverified |
| France | Chambre des Notaires | Notary Chamber | 6 | Unverified |
| Japan | City Hall (役所) | Municipal Office | 7 | Unverified |

---

## Problem Statement

Country alone is insufficient for precise execution readiness. A document destined for Italy may be accepted differently by:

- Comune di Roma (civil registry)
- Comune di Cansano (small municipality)
- An Italian court
- An Italian university
- A private employer

Each authority may have distinct requirements for format, translation certification, witness count, apostille chain, original vs. copy, and acceptable notarization type. Without authority-level intelligence, the system can only derive from country defaults — which is correct as a baseline but leaves real rejection risk unaddressed.

---

## Access Model

| Surface | Access Level |
|---|---|
| Public website | No authority-specific claims unless verified |
| Client portal | Client-safe summary only — no operator notes |
| Dashboard | Full operator view including notes and verification status |
| VA | Assigned task requirements only |
| Alliance | Corridor/category summary only |

**Rules:**
- Never present unverified authority requirements as fact
- Use "Verification Required" when authority rules are not confirmed
- Never say: "guaranteed acceptance", "embassy verified", "government approved"
- Never provide legal advice

---

## Schema Entities

### `receiving_authorities`

Primary authority registry. One row per distinct receiving body.

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| country_slug | TEXT | References `countries.id` |
| authority_name | TEXT | e.g., "Comune di Roma" |
| authority_type | TEXT | `municipality` · `court` · `university` · `employer` · `consulate` · `embassy` · `immigration_office` · `cartorio` · `registry` · `other` |
| region | TEXT | Sub-national region or state |
| city | TEXT | City of record |
| website | TEXT | Official authority website |
| contact_email | TEXT | Primary contact — operator-only |
| contact_phone | TEXT | Operator-only |
| status | TEXT | `active` · `inactive` · `unknown` |
| verification_status | TEXT | `verified` · `unverified` · `pending_review` |
| last_verified_at | TIMESTAMPTZ | Last operator confirmation date |
| source_reference | TEXT | Legal source, treaty reference, or URL |
| notes_operator_only | TEXT | Internal notes — never exposed to portal |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

---

### `authority_requirement_profiles`

Document-specific requirements per authority. Overrides country-level derivation when verified.

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| authority_id | UUID | FK → receiving_authorities |
| document_type_slug | TEXT | FK → document_types.id |
| workflow_type | TEXT | `hague` · `consular` · `direct` |
| apostille_required | BOOLEAN | |
| consular_required | BOOLEAN | |
| translation_required | BOOLEAN | |
| certified_translation_required | BOOLEAN | |
| witness_required | BOOLEAN | |
| notarization_required | BOOLEAN | |
| ron_accepted | BOOLEAN | Whether RON is accepted by this authority |
| original_required | BOOLEAN | Physical original required (not a copy) |
| copy_accepted | BOOLEAN | Certified copy accepted |
| special_format_notes | TEXT | e.g., "Apostille must be on reverse side" — operator-only |
| valid_from | DATE | Profile validity start |
| valid_to | DATE | Profile validity end (NULL = current) |
| last_reviewed_at | TIMESTAMPTZ | Operator verification timestamp |
| source_reference | TEXT | Legal basis or source URL |

---

### `authority_document_rules`

Granular rejection risk rules per authority/document pair. Drives the `rejectionTriggers` array in the readiness engine when an authority profile is active.

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| authority_id | UUID | FK → receiving_authorities |
| document_type_slug | TEXT | FK → document_types.id |
| required_attachment | TEXT | e.g., "Birth certificate must accompany POA" |
| rejection_risk | TEXT | Description of rejection scenario |
| client_safe_label | TEXT | Portal-safe version of the rule |
| operator_detail | TEXT | Full operator detail — never exposed to portal |
| severity | TEXT | `fatal` · `correctable` |
| active | BOOLEAN | |

---

### `authority_contact_points`

Multiple contacts per authority (different departments, seasonal contacts).

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| authority_id | UUID | FK → receiving_authorities |
| contact_type | TEXT | `primary` · `apostille_desk` · `legalization` · `translation` |
| name | TEXT | |
| email | TEXT | Operator-only |
| phone | TEXT | Operator-only |
| hours | TEXT | e.g., "Mon–Fri 9–12" |
| notes | TEXT | Operator-only |
| active | BOOLEAN | |

---

### `authority_audit_events`

Immutable audit log for all changes to authority profiles and rules. Never mutable after insert.

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| authority_id | UUID | FK → receiving_authorities |
| event_type | TEXT | `created` · `requirement_updated` · `verified` · `deactivated` · `note_added` |
| old_value | JSONB | Previous field value |
| new_value | JSONB | New field value |
| actor_id | UUID | Operator who made the change |
| reason | TEXT | Required — why this change was made |
| created_at | TIMESTAMPTZ | Immutable — no updates |

---

## Readiness Engine Integration

When an authority profile is active and verified:

1. `getWorkflowOrDerive(countryId, documentId)` is called first for the base workflow
2. `getAuthorityRequirementProfile(authorityId, documentId)` is checked for overrides
3. If profile exists and `verification_status = verified` and `valid_to IS NULL OR valid_to > now()`:
   - Authority-specific rules replace country defaults where they differ
   - `authority_document_rules` are merged into `rejectionTriggers`
   - `corridorLabel` becomes `"Authority-Verified Corridor"`
4. If profile exists but `verification_status != verified`:
   - Readiness engine shows `"Verification Required"` on affected items
   - Score is not penalized but items are flagged
5. If no profile:
   - Fall back to `getWorkflowOrDerive()` — country-level derivation (current behavior)

---

## Readiness Reveal Sequence (Future)

When authority selector is added to the intake and dashboard flows:

```
Country selected
↓
Document selected
↓
Receiving Authority selected (optional — defaults to country-level)
↓
Authority profile resolved (verified / unverified / none)
↓
Workflow + requirements populated
↓
Requirements illuminate (real data only)
↓
Missing items appear
↓
Timeline appears
↓
Readiness score renders
↓
Begin Secure Intake activates
```

**Animation rules:**
- Reveal only after real data loads
- No fake progress indicators
- No fake authority status
- No fake confirmation states

---

## Implementation Prerequisites

Before this schema is migrated to production:

1. [ ] At least 3 verified authority profiles must be built by operator research
2. [ ] Access control reviewed: `notes_operator_only`, `operator_detail`, `contact_email`, `contact_phone` must never reach portal
3. [ ] `authority_audit_events` must be append-only — no UPDATE permissions
4. [ ] Migration reviewed and approved by Nick × Tiff before execution
5. [ ] Readiness engine adapter built and tested against derived fallback

---

## Priority Authorities for Phase 1 Build

These are high-volume corridors where authority-level specificity has the most impact on rejection risk:

| Country | Authority Type | Example |
|---|---|---|
| Italy | Municipality | Comune di Roma, Comune di Cansano |
| Brazil | Cartório | Cartório de Registro de Imóveis |
| Mexico | Civil Registry | Registro Civil |
| Spain | Civil Registry | Registro Civil Municipal |
| Germany | Municipal Court | Standesamt |
| UAE | Government | Dubai Courts, Abu Dhabi Judicial Dept |
| France | Notary Chamber | Chambre des Notaires |
| Japan | Municipal Office | City Hall (役所) |

---

*This document is a design specification only. No migration has been created or applied.*
