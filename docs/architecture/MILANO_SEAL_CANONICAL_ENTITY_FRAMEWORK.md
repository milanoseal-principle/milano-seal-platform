# Milano Seal — Canonical Entity Framework

**Phase 2 deliverable.** Additive only — no existing schema forked or deleted.

## Single import surface
`lib/platform/entities/index.ts` is the one place to import canonical entities.

- `Matter` = re-export of the controlling `CanonicalMatterObject` (`lib/platform/canonicalMatter.ts`).
- `PartnerPassport` = re-export of the controlling `PartnerPassportSummary` (`lib/alliance/intelligence/partnerPassport.ts`).
- `GovernmentOpportunity` = re-export of `ProcurementOpportunity` (`lib/government/types.ts`).
- Minimal contracts defined here only where the repo had no single controlling shape (Contact, Organization, Document, Signer, Witness, Jurisdiction, Country, Quote, Invoice, PaymentView, Execution, Apostille, Courier, CustodyEventView, Partner, ReferralSource, GovernmentAgency, GovernmentSubmission, QARecord, Blocker, RevenueEvent, PortalAccess, OperatorAction, IntelligenceNode, CaseStudy, SOPUpdate, AuditEvent).

## Common metadata (`CanonicalEntityMeta`)
`id, createdAt, updatedAt, source, sourceRecordId, environment, isSample, dataClassification, createdBy, updatedBy`.

## Files
- `entities/index.ts` — entity contracts + re-exports
- `entities/ids.ts` — branded ID types + `composeId`
- `entities/entityRelationships.ts` — how each entity links to Matter
- `entities/entitySafety.ts` — `preserveUnknown`, `excludeSamples`, `findClientForbiddenFields`
- `entities/adapters.ts` — legacy → canonical translators

## Rules
- Reuse existing controlling types; never a second Matter/Payment/Partner schema.
- Unknown values stay `null`/`undefined` — no fabricated defaults.
- Payment and CustodyEvent are **read-only views** — never a second source of truth, never carry raw Wise/webhook payloads.
- Client-facing surfaces must exclude `CLIENT_FORBIDDEN_FIELDS` (margin, internal notes, wise payload, storage path, partner payout, trust score).
