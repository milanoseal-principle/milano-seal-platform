# Milano Seal — Execution Intelligence Tool Prompt (Source of Truth)

Source standard: Milano Seal OS SOP + locked responsive containment + Wise/payment-gated execution + country execution intelligence registry.

## Mission
Turn the globe/country intelligence cards into a real Milano Seal Execution Intelligence Tool — a functional execution-intelligence layer for apostille, notary, authentication, intake, compliance, routing, release, alliance work, VA work, lawyer-client explanation, and monetization. It must help: Nicholas operate faster; international lawyers explain execution to clients; clients understand the route before paying; alliance notaries gauge assignment readiness; VAs know what to review/route/upload/escalate; operators know the next gate; founder/admin see safe revenue opportunities.

## Hard guardrails (DO NOT)
- No changes to pricing, Wise/payment logic, discount logic, auth provisioning, intake state machine, portal security, dashboard/operator state machine.
- Do not remove globe/map/country visuals, break responsive containment, or remove `data-critical-card`.
- Do not weaken existing validators.
- No fake government claims, no acceptance guarantees, no legal advice, no marketplace slang ("guaranteed", "instant approval", "legal clearance", "gangster", "mafia", "plug", "cheap").
- Never expose internal margin, commissions/payout logic, or operator notes to clients.

## Brand tone (public-safe)
Execution Intelligence Layer · Authority Route · Apostille / Authentication Pathway · Notarial Readiness · Receiving-Authority Review · Custody-Controlled Release · Lawyer Client Pack · Alliance Notary Readiness · VA Review Queue · Revenue Opportunity · Compliance Boundary · Escalation Trigger · Release Gate · Operator Action · Route Lock · Payment Gate.

## Audiences (card modes)
client · lawyer · alliance_notary · virtual_assistant · operator · founder

## Data layer
`data/country-execution-intelligence.ts` — `CountryExecutionIntelligence` with: slug, displayName, shortName?, flag?, routeType (`hague_apostille|consular_legalization|authority_review|hybrid_review`), statusPill, eyebrow, routeLabel, authoritySummary, executionFlags[], executionPath[], trustLine, primaryCtaLabel, secondaryCtaLabel, matterUseCases[], notarialReadinessChecks[], apostilleRouteChecks[], authenticationRouteChecks[], translationRisk (`none|possible|likely|authority_specific`), courierRisk (`standard|elevated|custody_required`), lawyerClientUse, allianceNotaryUse, virtualAssistantUse, operatorUse, founderUse, revenueUse, escalationTriggers[], complianceBoundary. Export `COUNTRY_EXECUTION_INTELLIGENCE` + `getCountryExecutionIntelligence(slug, fallbackName?)`. Every slug in `data/destinations.ts` must resolve; no priority country uses weak fallback copy.

`data/execution-intelligence-matrix.ts` — `ExecutionAudience`, `ExecutionIntelligenceSignal`, `ExecutionIntelligencePanel`; helpers `getExecutionIntelligenceForAudience`, `getExecutionSignals`, `getRevenueSignals`, `getComplianceSignals`.

## Default labels
eyebrow `EXECUTION INTELLIGENCE`; primaryCtaLabel `Start Controlled Intake`; secondaryCtaLabel `Open Global Atlas`.
Route labels: Hague → `HAGUE APOSTILLE EXECUTION ROUTE`; consular → `CONSULAR LEGALIZATION REVIEW ROUTE`; authority → `RECEIVING-AUTHORITY REVIEW ROUTE`; hybrid → `AUTHENTICATION / CONSULAR REVIEW ROUTE`.
Default Hague path: `01 Pre-flight readiness / 02 Authority route check / 03 Custody-controlled release`.
Default consular/authority path: `01 Authentication pathway review / 02 Consular handling check / 03 Release packet control`.

## Components
`components/intelligence/`: ExecutionAudienceTabs, ExecutionSignalChips, ExecutionComplianceBoundary, ExecutionRevenueLine, ExecutionActionLine. Rewire `destination-intelligence-card.tsx` (and globe/map/home surfaces) to render from the registry. Compact globe popover: limited tabs (Client | Lawyer | Operator); full atlas/countries: Client | Lawyer | Notary | VA | Operator. Preserve `data-critical-card`, mobile-safe wrapping, no truncation, no overflow clipping.

## Weak labels to remove
`DESTINATION REVIEW` → `EXECUTION INTELLIGENCE`; `HAGUE APOSTILLE ROUTE` → `HAGUE APOSTILLE EXECUTION ROUTE`; `Start Secure Intake` → `Start Controlled Intake`; `Explore Full Map` → `Open Global Atlas`.

## Priority country copy (exact)
**Italy** — hague_apostille / HAGUE MEMBER / HAGUE APOSTILLE EXECUTION ROUTE. Summary: "Italy-bound documents are screened for notarial readiness, apostille routing, citizenship/private-client use, translation risk, and receiving-authority presentation before release." Flags: Citizenship, POA, Civil Record, Apostille, Translation Review. trustLine/compliance: "Routing snapshot only — final acceptance remains subject to Italian receiving-authority review."

**Brazil** — hague_apostille / HAGUE MEMBER / HAGUE APOSTILLE EXECUTION ROUTE. Summary: "Florida-origin documents for Brazil are routed through a controlled Hague apostille pathway with notarial readiness review, destination-use screening, translation/courier risk check, and release packet coordination." Flags: Corporate, POA, Civil Record, Translation Review, Courier Release. Compliance: "Routing snapshot only — final acceptance remains subject to Brazilian receiving-authority review."

**UAE** — consular_legalization / CONSULAR REVIEW / CONSULAR LEGALIZATION REVIEW ROUTE. Summary: "UAE-bound documents require higher-control authentication review, with notarial readiness, state/federal route assessment, consular handling risk, and receiving-party presentation checked before release." Flags: Corporate, Commercial, Private Wealth, Consular Review, Courier Release. Compliance: "Routing snapshot only — UAE matters may require authentication and consular review before receiving-party acceptance."

## Validation
`scripts/validate-country-intelligence.mjs` + `scripts/validate-execution-intelligence.mjs` (package scripts `validate:intelligence`, `validate:execution-intelligence`). Fail if: any destination slug lacks intelligence; missing required field; priority country uses fallback; weak legacy label remains; public card uses guaranteed/instant approval/legal clearance/legal advice; any card removes `data-critical-card`; <3 execution signals; missing client/lawyer/VA/operator lines.

## Required commands
`npm run validate:project` · `validate:intelligence` · `validate:execution-intelligence` · `typecheck` · `build` · `smoke:responsive` (clean skip allowed).

## Acceptance
Country cards are useful execution tools across all six audiences; compliance boundaries preserved; revenue only in safe/operator context; all countries covered; no weak copy; registry powers globe/countries/map; responsive containment preserved; all validators + typecheck + build pass; smoke passes or cleanly skips; no pricing/payment/intake/operator logic changed; prompt + progress docs committed and pushed.
