# The Milano Seal™ — International Document Execution Domain Profile

## Purpose

The System Control Plane is specifically designed for an international document execution firm. It is not a generic CRM, generic legal workflow product, generic notary scheduler, or generic shipping dashboard.

The operating domain is:

**International Document Execution + Remote Online Notarization + Apostille / Authentication Coordination + Receiving-Authority Review + Custody + International Courier Release.**

## Hague Apostille Convention Coverage

The HCCH 1961 Apostille Convention currently has **130 Contracting Parties** as of 2026-08-27.

Canonical external authority: HCCH status table for Convention No. 12 / Apostille Convention.

This count is a coverage fact only. It does not mean every document sent to a Contracting Party automatically qualifies for a simple apostille-only path. Each Matter must still resolve:

- Convention entry into force for the relevant relationship
- territorial scope / extensions where applicable
- objections or limitations where relevant
- document origin jurisdiction
- document category
- issuing authority
- state versus federal route
- receiving-authority expectations
- translation / witness / wet-ink requirements

## Canonical International Matter Facts

Every international Matter can require explicit resolution of:

- document identity
- document category
- issuing authority
- origin country or U.S. state
- destination country
- receiving authority
- signer location and signer count
- whether notarization is required
- required notarial act
- execution method: RON / mobile / in-person / already notarized
- witness requirements
- original versus copy status
- document language
- translation requirement
- apostille / authentication / legalization requirement
- competent authority
- deadline / requested timeline
- delivery method
- destination address

Unknown values remain unknown and force review where release-critical.

## Execution Lanes

### Remote Online Notarization
RON is conditional. It requires resolved signer-location, document, identity/KBA, platform, notarial-act and receiving-authority facts. RON is never inferred from convenience or from a negative mobile flag.

### Mobile / In-Person Execution
Used when physical presence, wet ink, witnesses, document handling, receiving-authority requirements or platform eligibility make RON unsuitable.

### Already-Notarized Review
Existing notarization is reviewed for jurisdiction and certificate sufficiency. The system does not fabricate a new notarial act.

### State Apostille
State-origin documents use the competent state authority when the Matter has an operative Convention route and all origin/document requirements are resolved.

### Federal Authentication / Apostille Review
Federal-origin documents remain on the federal authority path and are never routed through a state apostille workflow by convenience.

### Non-Hague Authentication / Consular Legalization
Non-Hague or non-operative routes fail closed to authentication / consular review.

### Translation Coordination
Translation is independent from apostille and notarization. Requirements must be explicit and receiving-authority grounded.

### International Courier & Release
Release requires payment, execution, custody and release evidence. Tracking labels are not delivery proof. Delivery requires carrier/provider evidence.

## Final Acceptance Boundary

The Milano Seal coordinates document execution and apostille/authentication workflows. Final acceptance remains with the receiving court, registry, agency, consulate, embassy, bank, foreign counsel, government office, private institution, or other receiving authority.

## Permanent Domain Locks

- one canonical Matter engine
- Wise remains payment authority
- RON is never automatically selected
- apostille is never automatically selected from destination alone
- notarial act is never inferred from document type alone
- state and federal authority paths remain distinct
- apostille and notarization are independent decisions
- receiving-authority evidence controls final acceptance review
- non-Hague routes fail closed
- intelligence cannot overwrite execution truth
- release requires governed evidence
- code cannot self-certify live transaction success
