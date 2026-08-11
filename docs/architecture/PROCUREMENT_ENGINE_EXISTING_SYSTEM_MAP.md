# Procurement Engine — Existing System Map (pre-build discovery)

Produced before writing any procurement code, per the build spec. Determines
what is **reused/extended** vs **created**, so nothing is rebuilt under a new name.

## Reuse — do NOT recreate (controlling implementations)

| Concept | Controlling implementation | Key exports |
| --- | --- | --- |
| Pricing | `lib/pricing.ts` → via `lib/pricing/canonicalPricingGateway.ts` | `calculatePrice`, `quoteConsumer`, `quoteNonConsumer("government")` |
| Bid/no-bid scoring | `lib/government/bidNoBidScoring.ts` | `scoreBidNoBid`, `BidNoBidInput`, `BidNoBidResult` |
| Vendor registration | `lib/government/vendorRegistrationTracker.ts` | `VendorRegistration`, `summarizeVendorRegistrations`, `isRegistrationActive` |
| Commodity codes (NIGP/NAICS) | `lib/government/commodityCodeRegistry.ts` | `COMMODITY_CODE_REGISTRY`, `getCommodityCodes` (UNSPSC not yet implemented) |
| Government CRM | `lib/government/governmentCrmEngine.ts` | `pipelineValue`, `awardRate`, `renewalValue`, … |
| Agency registry | `lib/government/intelligence/agencyRegistry.ts` | `AGENCY_REGISTRY`, `AgencyProfile` |
| Knowledge graph | `lib/government/intelligence/procurementKnowledgeGraph.ts` | `buildProcurementKnowledgeGraph` (stub) |
| Operator actions | `lib/operatorActions.ts` | `OperatorAction`, `OperatorActionQueue` |
| Capability statement | `lib/government/capabilityStatementModel.ts` | `buildCapabilityStatement` (canonical of two) |
| Canonical Matter/Org/Contact | `lib/platform/canonicalMatter.ts`, `lib/platform/entities/index.ts` | `CanonicalMatterObject`, `Organization`, `Contact` |
| Public gov service page | `app/services/government-document-execution/page.tsx` + `lib/government/governmentServicesRegistry.ts` | — |
| Government dashboard | `app/dashboard/government/` + `components/dashboard/government/*` (9 components) | — |

## Created in this build (genuinely missing)

| Concept | New file |
| --- | --- |
| Procurement safety policy | `lib/procurement/procurementSafety.ts` |
| Real Pinellas ITQ #25-0786 record | `lib/government/submissions/pinellasItq250786.ts` |
| Submission registry + award safety | `lib/procurement/submissions/submissionRegistry.ts` |
| Reference consent tracker | `lib/procurement/references/referenceConsentTracker.ts` |
| Insurance readiness | `lib/procurement/readiness/insuranceRegistry.ts` |
| Proposal section registry/assembler | `lib/procurement/proposals/proposalSectionRegistry.ts` |
| SOW builder | `lib/procurement/sow/sowBuilder.ts` |
| Procurement pricing adapter (delegates to canonical) | `lib/procurement/pricing/procurementPricingAdapter.ts` |

## Known duplications to reconcile later (NOT in this branch)

- Two `ProcurementOpportunity`/`GovernmentOpportunity` type systems (`lib/government/types.ts` vs `lib/government/intelligence/opportunityRegistry.ts`).
- Two `buildCapabilityStatement`/`CapabilityStatement` definitions (model vs intelligence builder).
- Two `OperatorAction` shapes (`lib/operatorActions.ts` vs `lib/platform/entities/index.ts`).
- **`lib/dashboard-modules.ts` duplicate-key bug (lines ~174–184)** — "Government Intelligence" entry silently overridden by "Government"; `government-intelligence` never registers in nav. **Deferred to the cross-branch error-sweep**, not fixed here.

## Safety facts locked

- Pinellas ITQ #25-0786 is **real data** (`isSample: false`), status **submitted / not_awarded**, `awardEvidenceRef: null`. Cannot become awarded without documented evidence (`canRecordAward`).
- No fabricated opportunities, awards, contract values, relationships, references, or insurance.
- Government pricing is operator-prepared (no auto public price); margins stay internal.
- Protected systems (Wise, payment confirmation, scheduling/release gates, custody, Supabase RLS, Shippo, BlueNotary) untouched.
