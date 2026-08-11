# Milano Seal — Canonical Matter Core

**Phase 3 deliverable.** The existing `CanonicalMatterObject` (`lib/platform/canonicalMatter.ts`) is the **controlling** Matter. It was **extended, not replaced.**

## What changed
All Phase-3 fields were added as **optional** (`?`), grouped by concern:
IDENTITY (reference, state, substate, urgency, createdAt/updatedAt), CLIENT (contactId, clientType, referralSourceId), JURISDICTION (documentOriginJurisdictionId, signerLocation, destinationCountryId, receivingAuthorityId, hagueStatusReference, manualReviewFlags), EXECUTION (ronEligibility, fieldAvailability, hybridEligibility, witness/translator requirement, executionAppointment, assignedOperator/PartnerId), COMMERCIAL (quotedValue, paidValue, paymentStatus, paymentReference, schedulingUnlocked), DOCUMENTS, QA, FULFILLMENT (incl. `releaseEligible` — read from the approved gate only), PORTAL, OPERATIONS, and canonical METADATA.

## Compatibility
- Existing exports preserved (`CanonicalMatterObject`, `CANONICAL_MATTER_FIELDS`).
- All new fields optional → the single existing consumer is unaffected.
- No second Matter schema. `MatterCommandRecord` is adapted via `entities/adapters.ts:matterCommandRecordToCanonical`, not migrated yet.

## The gap this addresses
Discovery found `canonicalMatter` had only **1 importer** while dashboards render sample data. Extending it is step 1; wiring dashboards to resolve from it is future (Phases 10–22), gated.

## Safety
- `releaseEligible` / `schedulingUnlocked` are **read** projections — never set by adapters. The real payment-before-scheduling and release gates are unchanged.
