# Milano Seal — Public/Private Intelligence Protection + Sales Conversion Engine (Source of Truth)

Primary domain: https://www.themilanoseal.com

PUBLIC = confidence, authority, clarity, conversion. PRIVATE = workflow, money, execution mechanics.

## Public promise
The Milano Seal helps clients, international lawyers, private-client advisors, yacht brokers, luxury real estate professionals, equine professionals, gemstone, diamond, and fine jewelry teams prepare, notarize, route, apostille/authenticate, release, and track U.S.-origin documents for use abroad.

## Compliance boundary
The Milano Seal is not a law firm. Routing snapshots remain subject to receiving-authority review. No acceptance guarantees, no government affiliation, no instant approval, no legal clearance.

## Public funnels (this pass)
- /access — choose access path (route report, lawyer pack, alliance, VA, concierge)
- /lawyer-access — international counsel funnel → Request Lawyer Client Pack
- /alliance/apply — alliance notary application → /api/sales/capture
- /va/apply — VA support application → /api/sales/capture
- Public CTAs: Start Controlled Intake, Make Deposit / Unlock Scheduling, Schedule RON After Deposit, Request Lawyer Access, Apply for Alliance Access, Apply for VA Support Role.

## Data
- data/access-products.ts — ACCESS_PRODUCTS catalog (Client Route Report $149, Lawyer Client Pack $149, Lawyer Monthly $299/mo, Controlled Matter Deposit dynamic, Concierge custom, Alliance free, VA internal).
- data/milano-revenue-copy-system.ts — audience revenue copy blocks + helpers.
- data/public-country-intelligence.ts — client-safe country teaser (prior pass).
- data/country-execution-intelligence.ts + execution-intelligence-matrix.ts — PRIVATE engine (server-side only).

## Wise-first
Access references MS-ACCESS-YYYY-#### / MS-INTEL-YYYY-####. No Stripe. No client-marked paid. Deposit unlocks scheduling; final payment unlocks release. (Payment routes unchanged.)

## Guardrails
No public leak of operatorUse/founderUse/revenueUse/VA/alliance/lawyer workflow, margin, payout, commission, ledger events, internal escalation. Enforced by validate:intelligence-safety + validate:sales-engine + validate:revenue-copy.

## Validators (required)
validate:project, validate:intelligence, validate:execution-intelligence, validate:intelligence-safety, validate:sales-engine, validate:revenue-copy, typecheck, build, smoke:responsive.
