# The Milano Seal™ — Production Readiness & Roadmap

## Readiness Standard

Use only these statuses:

1. CONCEPT — approved idea only.
2. SPECIFIED — requirements written.
3. BUILT — code exists.
4. WIRED — connected to canonical data/flows.
5. GATED — covered by validation/tests.
6. DEPLOYED — present in production.
7. LIVE_PROVEN — real production behavior verified with evidence.
8. CERTIFIED — controlling human/live acceptance complete.

## Evidence Rule

Never infer a higher readiness state from a lower one. A passing build cannot prove Wise settlement, physical mobile behavior, RON identity/KBA completion, notarial execution, apostille/authentication issuance, receiving-authority acceptance, carrier delivery, role-session isolation or Final Truth Review.

## International Execution Evidence Classes

Code can validate routing rules and fail-closed behavior, but production readiness for an international Matter depends on actual evidence classes:

- document identity and origin evidence
- destination / HCCH status evidence
- receiving-authority evidence
- RON or physical notarial execution evidence
- identity / credential / KBA evidence when RON applies
- apostille or authentication issuance evidence
- translation / witness evidence when applicable
- Wise settlement evidence
- custody / release evidence
- carrier tracking and delivery evidence
- final operator truth review

The HCCH 1961 Apostille Convention currently has **130 Contracting Parties**. Country coverage must never be treated as proof that an individual document is apostille-ready.

## Current Platform Roadmap Structure

### Demand

Keep public international authority, country/document education, professional/institutional acquisition, referrals, SEO and client-return acquisition inside the Demand parent system. Do not create separate products for individual acquisition engines.

### Matter Control

Prioritize canonical Matter integrity, document origin/destination, RON/notarial execution truth, payment, scheduling, apostille/authentication authority routing, custody, courier, delivery and release before adding new workflow abstractions.

### Execution Network

Expand Alliance/partner capacity only through explicit certification, compliance, availability and scoped execution evidence. RON, mobile notary, translation and courier capacity must remain capability-scoped rather than presumed.

### Intelligence & Control

New intelligence must be a derived projection over canonical evidence, read-only by default, and placed inside the existing Operator workspace unless another user genuinely requires the surface. Intelligence may identify stale authority evidence but cannot select a notarial act or authorize release.

Matter Truth archives, output envelopes, evidence reconciliation and provenance matrices remain derived governance capabilities until wired to canonical evidence, migration-deployed, production-gated and live-proven.

### Governance & Platform

Maintain role isolation, source governance, HCCH/authority provenance, validators, deployment controls, observability, brand consistency, architecture decisions and production certification.

## Live-Proof Gates That Cannot Be Self-Certified by Code

- Exact production SHA deployed and READY.
- Real TIFF 15-step Matter execution.
- Real Wise settlement/replay/idempotency evidence.
- Physical authenticated Client / Operator / VA / Alliance sessions.
- Actual RON/notarial evidence when the Matter uses that lane.
- Actual apostille/authentication/legalization completion evidence.
- Actual notification/provider delivered evidence where required.
- Actual carrier delivery evidence.
- Human character-for-character Final Truth Review.
- Browser screenshot/pixel regression evidence where required.

## Technical Debt Rule

Technical debt must be visible. Record it as a named roadmap or registry item with parent system, owner, dependency and acceptance test. Do not hide unfinished work inside unrelated reports, intelligence pages or comments.

## Change-Control Rule

Before merge, every new production capability must pass the System Placement Gate:

1. Parent system.
2. User/audience.
3. Canonical authority.
4. Read-only or mutation behavior.
5. Duplicate registry search.
6. Existing UX placement.
7. Production validation.
8. Registry entry.

If the capability affects international execution, it must additionally identify document-origin, destination, receiving-authority, state/federal, RON/notarial and apostille/authentication dependencies.

No unregistered production module should merge.


## 2026-11-08 GitHub Implementation Evidence

The November 8 RON incident reconciliation is a **GATED GitHub implementation change only** until separately authorized production migration/deployment occurs. It aligns the RON security-incident path to the canonical compliance incident model (`matter_id`, `summary`, `release_frozen`, `detected_at`), preserves one incident authority, and keeps controlled live certification separate from repository validation.
