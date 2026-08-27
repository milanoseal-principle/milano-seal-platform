# The Milano Seal™ — Canonical Matter & Execution Contract

## Core Rule

One Matter is the operational source of truth for every client transaction. No workspace, intelligence layer, report, partner surface or expansion engine may create a conflicting lifecycle.

The Matter contract is purpose-built for international document execution, RON/notarial execution, apostille/authentication/legalization routing, receiving-authority review, custody and international delivery.

## Canonical Authorities

| Domain | Authority |
|---|---|
| Matter | Supabase canonical Matter/deal record |
| State | Canonical Matter state machine |
| Pricing | Canonical Milano pricing engine |
| Payment | Wise verified settlement |
| Scheduling | Canonical payment + execution gates |
| Treaty / country routing | HCCH / verified official authority evidence |
| Authority routing | Verified authority/compliance registry |
| RON / notarial execution | Canonical execution truth + actual platform/notarial evidence |
| Partner eligibility | Canonical Alliance governance |
| Custody / release | Governed custody and release evidence |
| Delivery | Carrier/provider delivery evidence |
| Identity / access | Supabase Auth + governed role mapping + RLS |
| Intelligence | Derived/read-only projections over canonical evidence |

## International Matter Facts

Release-critical Matters may require explicit values for:

- document identity and category
- issuing authority
- origin country / U.S. state / federal origin
- destination country
- receiving authority
- signer location and signer count
- notarization required: yes / no / unresolved
- notarial act: explicit, never inferred
- execution method: RON / mobile / in-person / already notarized
- witness requirements
- original/copy status
- document language
- translation requirement
- apostille/authentication/legalization requirement
- competent authority
- deadline or requested timeline
- delivery method and destination address

Unknown release-critical values remain review-required.

## Hague Apostille Convention Contract

The HCCH 1961 Apostille Convention currently has **129 Contracting Parties**. The system stores this as current external coverage metadata, not as a blanket apostille conclusion.

A Matter-specific Hague route still requires verification of applicable entry into force, territorial scope, document origin/category, competent authority and receiving-authority requirements.

## Governing Sequence

Client → Intake → Validation → Trust/Compliance → Pricing → Quote → Payment → Scheduling → Execution → Apostille/Authentication/Legalization → Custody → Courier → Delivery → Completion → Review.

## Payment Contract

Wise is the canonical payment authority. Payment-dependent scheduling, execution or release cannot be unlocked by a UI flag, intelligence projection or manual convenience path that bypasses verified settlement rules.

## Scheduling Contract

Scheduling requires the canonical scheduling gate to be satisfied. Payment truth and execution readiness remain independent requirements.

## RON / Notarial Execution Contract

RON is never the default simply because it is available. It requires resolved signer location, document eligibility, platform eligibility, identity/KBA requirements, explicit notarial act and receiving-authority compatibility.

Mobile or in-person execution remains available when wet-ink, witness, physical-document or receiving-authority requirements control.

Apostille/authentication requirements must not fabricate notarization requirements. Document type alone must never auto-select acknowledgment, jurat or another notarial act.

## State / Federal Authority Contract

State-origin and federal-origin documents remain separate routing classes. Federal documents cannot be pushed through a state apostille workflow by convenience. State documents must route through the competent state authority when the operative Hague route and document facts support it.

## Non-Hague Contract

Non-Hague, non-operative or unresolved Convention routes fail closed to authentication / consular legalization review. The system must not market or display an apostille-only route when the Matter facts do not support one.

## Translation Contract

Translation is independent from notarization and apostille. Translation necessity, certification requirements and translator qualification must be explicit or receiving-authority grounded; they are never inferred from destination alone.

## Authority Contract

Receiving-authority and jurisdiction routing must retain source provenance and freshness. Missing or stale critical authority evidence fails closed to operator review.

Final acceptance remains with the foreign court, registry, agency, consulate, embassy, bank, counsel, government office, private institution or other receiving authority reviewing the document.

## Custody and Release Contract

Release requires governed payment, execution, authority and custody evidence. Intelligence may surface discrepancies but cannot authorize release.

## Delivery Contract

Provider acceptance, carrier state and delivered evidence are distinct. A provider/API success response or generated tracking label is not automatically final delivery proof.

## Completion Contract

A Matter must not be represented as fully complete when required delivery, release or controlling evidence is contradictory or missing.

## Intelligence Boundary

Reconciliation, Trust Engine, knowledge graph, return intelligence, Alliance intelligence, financial intelligence and operator exceptions are interpretations of canonical evidence. They cannot silently overwrite canonical Matter truth.
