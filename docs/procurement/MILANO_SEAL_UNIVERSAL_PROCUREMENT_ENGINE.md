# Milano Seal — Universal Government & Institutional Procurement Engine

Converts one-off bid work into reusable institutional intelligence, extending the
existing government architecture rather than duplicating it.

## What this phase adds

Additive canonical modules under `lib/procurement/` plus the real Pinellas record:

- **`procurementSafety.ts`** — the non-negotiable policy every module consumes:
  no fabricated opportunities/awards/values/relationships/references/insurance;
  no government/airport/TSA endorsement; no legal/immigration advice; unknown
  data stays unknown; public/internal separation. Guards: `containsBannedClaim`,
  `canRecordAward`, `isInsuranceBound`, `isReferenceUsable`, `unknownIfBlank`.
- **`lib/government/submissions/pinellasItq250786.ts`** — the REAL Pinellas
  County ITQ #25-0786-ITQ submission (emergency/disaster response). `isSample:
  false`; status **submitted / not_awarded**; `awardEvidenceRef: null`. BID lines
  (labor $150, OT $225, standby $112.50, 10% indirect) and NO-BID lines
  (debris/equipment/transport/rental) captured from the submitted SOW & Price
  List. 60-month term.
- **`submissions/submissionRegistry.ts`** — holds real submissions; `canMarkAwarded`
  gates any award on documented, verified evidence.
- **`references/referenceConsentTracker.ts`** — references usable only when
  consent is `confirmed`; `toPublicSafeReference` strips private contact details.
- **`readiness/insuranceRegistry.ts`** — insurance "bound" only with real binding
  evidence, never a broker letter/LOI.
- **`proposals/proposalSectionRegistry.ts`** — reusable proposal modules; agency-
  specific sections stay per-opportunity; `assembleProposalOutline`.
- **`sow/sowBuilder.ts`** — SOW model preserving canonical coordination timelines
  (Signature 24–72h, Priority Same Day–48h, Executive Immediate) and the third-
  party-timeline disclaimer.
- **`pricing/procurementPricingAdapter.ts`** — delegates to the canonical pricing
  gateway (`quoteNonConsumer("government")`); no new calculator; margins internal.

## Reused (not rebuilt)

Bid/no-bid scoring, vendor registration, commodity codes, government CRM, agency
registry, knowledge graph, operator actions, capability statement model,
canonical Matter/Organization/Contact, the public government service page, and
the existing government dashboard. See
`docs/architecture/PROCUREMENT_ENGINE_EXISTING_SYSTEM_MAP.md`.

## Deferred to the cross-branch error-sweep (not this branch)

- `lib/dashboard-modules.ts` duplicate-key bug (government-intelligence nav entry
  overridden). Type reconciliation of the two opportunity/capability/operator-
  action definitions.

## Validation

`npm run validate:universal-procurement-engine` — preservation of existing
modules, presence of new modules, Pinellas submitted/not-awarded, award-evidence
safety, no fabricated guarantees/endorsements, no protected-system references,
valid package.json.

## Safety boundaries

Coordination and administrative support only — no legal, medical, or immigration
advice. No outcome guaranteed by Milano Seal or any receiving authority. Wise,
payment confirmation, scheduling gate, release gate, custody ledger, Supabase
RLS/auth, Shippo, and BlueNotary are untouched.
