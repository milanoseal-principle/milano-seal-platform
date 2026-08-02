# Government & Public Sector Document Execution Vertical (Module 14)

## Purpose
The Milano Seal™ supports government, public-sector, and agency-adjacent
document execution workflows: structured intake, identity coordination, mobile
or remote execution when eligible, apostille/authentication coordination when
required, secure release tracking, and professional document handling.

This vertical treats public-sector buyers as a distinct go-to-market motion with
its own CRM stages, procurement cadence, vendor registration requirements, and
compliance posture — while reusing the platform's payment-gated, custody-aware
execution engine unchanged.

## What this vertical is NOT
- It does not claim government approval, endorsement, or partnership.
- It does not guarantee contracts, procurement outcomes, awards, or acceptance.
- It does not provide legal advice.
- It does not assert existing agency clients or past performance that has not
  actually occurred.
- Final acceptance of any document always remains subject to the receiving
  authority.

## Who we serve (illustrative customer types)
County governments, city governments, school districts, public universities,
community colleges, special districts, housing authorities, transit authorities,
economic development agencies, courts, public defenders, state agencies, public
hospitals, emergency management, public procurement offices, and airport
authorities.

These are the segments the workflow is designed for — not a client list.

## Capabilities
- Remote online notarization (eligible documents)
- Mobile document execution coordination
- Document authentication coordination
- Apostille coordination
- Identity verification
- Witness coordination
- Records execution
- Contract execution
- Emergency response documents
- Vendor support
- Public meeting documents
- Board documents

## Pipeline stages
prospect → vendor_registered → capability_statement_sent → meeting_requested →
opportunity_identified → bid_submitted → shortlisted → awarded → renewal / lost.

## Revenue streams
One-time engagement, master service agreement, blanket purchase agreement,
annual contract, emergency contract, on-call services, task orders, and
department retainer.

## System components
- `lib/government/*` — typed registries, reducers, and scoring (internal).
- `app/services/government-document-execution` — public service page.
- `app/dashboard/government` — internal operator dashboard.
- `components/dashboard/government/*` — operator panels.

## Compliance
See `lib/government/governmentSafety.ts` for the banned-claims list enforced by
`scripts/validate-government-public-sector-vertical.mjs`.
