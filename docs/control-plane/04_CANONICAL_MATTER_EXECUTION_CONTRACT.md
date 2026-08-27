# The Milano Seal™ — Canonical Matter & Execution Contract

## Core Rule

One Matter is the operational source of truth for every client transaction. No workspace, intelligence layer, report, partner surface or expansion engine may create a conflicting lifecycle.

## Canonical Authorities

| Domain | Authority |
|---|---|
| Matter | Supabase canonical Matter/deal record |
| State | Canonical Matter state machine |
| Pricing | Canonical Milano pricing engine |
| Payment | Wise verified settlement |
| Scheduling | Canonical payment + execution gates |
| Authority routing | Verified authority/compliance registry |
| Execution | Canonical execution truth |
| Partner eligibility | Canonical Alliance governance |
| Custody / release | Governed custody and release evidence |
| Delivery | Carrier/provider delivery evidence |
| Identity / access | Supabase Auth + governed role mapping + RLS |
| Intelligence | Derived/read-only projections over canonical evidence |

## Governing Sequence

Client → Intake → Validation → Trust/Compliance → Pricing → Quote → Payment → Scheduling → Execution → Apostille/Authentication → Delivery → Completion → Review.

## Payment Contract

Wise is the canonical payment authority. Payment-dependent scheduling, execution or release cannot be unlocked by a UI flag, intelligence projection or manual convenience path that bypasses verified settlement rules.

## Scheduling Contract

Scheduling requires the canonical scheduling gate to be satisfied. Payment truth and execution readiness remain independent requirements.

## Execution Contract

Execution truth must be explicit. Missing facts remain unknown or review-required. Apostille/authentication requirements must not fabricate notarization requirements.

## Authority Contract

Receiving-authority and jurisdiction routing must retain source provenance and freshness. Missing or stale critical authority evidence fails closed to operator review.

## Custody and Release Contract

Release requires governed payment, execution, authority and custody evidence. Intelligence may surface discrepancies but cannot authorize release.

## Delivery Contract

Provider acceptance, carrier state and delivered evidence are distinct. A provider/API success response is not automatically final delivery proof.

## Completion Contract

A Matter must not be represented as fully complete when required delivery, release or controlling evidence is contradictory or missing.

## Intelligence Boundary

Reconciliation, Trust Engine, knowledge graph, return intelligence, Alliance intelligence, financial intelligence and operator exceptions are interpretations of canonical evidence. They cannot silently overwrite canonical Matter truth.
