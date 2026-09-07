# The Milano Seal™ — 15-Layer Architecture Control Plane

This directory is the canonical documentation/control-plane map over the EXISTING production system. It does not replace runtime modules and does not create parallel authorities.

## Operating spine

MATTER → EXECUTION → CORRIDOR

## Canonical lifecycle

Intake → Validation/Review → Quote → Wise Submission → Scheduling Authority → RON/Execution → Apostille/Authentication → Custody → Courier/Delivery → Final Settlement Gate → Release → Close → Review/Learning

## Hard locks

- Supabase is the system of record.
- Wise is the only payment rail.
- BlueNotary remains the regulated RON environment.
- No second Matter, CRM, pricing, payment, scheduler, RON, apostille, custody, or release authority.
- Unknown/review-required remains explicit and fail-closed.
- No legal advice and no foreign-authority acceptance guarantee.
- Browser navigation never authors protected provider truth.

## Layer structure

Each layer contains exactly:

1. `01_REQUIREMENTS.md`
2. `02_DATA_MODEL.md`
3. `03_BUSINESS_RULES.md`
4. `04_API_CONTRACTS.md`
5. `05_UI_CONTRACTS.md`
6. `06_SECURITY.md`
7. `07_TESTS.md`
8. `08_ACCEPTANCE.md`

Layer-specific ownership/state/evidence/test contracts are centralized in `LAYER_MANIFEST.json` so the architecture remains single-source rather than duplicated across 120 documents.

## Audit rule

Every capability must answer:

- WHO OWNS THIS TRUTH?
- WHAT STATE CAN IT CHANGE?
- WHAT EVIDENCE IS REQUIRED?
- WHAT TEST PROVES IT?

## Upgrade rule

When a capability is missing or weak, upgrade the existing canonical module. Do not create a parallel implementation to satisfy documentation.

## Validation

`scripts/validate-architecture-control-plane.mjs` enforces layer count, required files, manifest coverage, hard locks, and isolation from unrelated product-domain language.
