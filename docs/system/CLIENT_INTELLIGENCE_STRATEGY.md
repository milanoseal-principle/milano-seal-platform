# The Milano Seal™ — Client Intelligence Strategy

**Status:** Staged — Phase 1 complete. Do not activate advanced personalization until P0 live verification passes.

---

## Executive Summary

The Milano Seal OS accumulates execution intelligence from every completed matter. This intelligence is used to make future intake, portal, dashboard, and VA experiences faster, clearer, and more precise — without exposing private client data, inventing automation that does not exist, or making claims the system cannot support.

The ecosystem may learn. It must never leak.

---

## Client Experience Growth Model

| Level | User | Experience |
|---|---|---|
| 0 | New visitor | Clear public education, no personal data, basic intake guidance |
| 1 | First matter client | Current required action, document checklist, payment/scheduling clarity |
| 2 | Repeat client | Start similar matter, safe prefill, prior pathway shortcut |
| 3 | Professional / law firm | Matter history summary, office delivery language, recurring patterns |
| 4 | Internal operator | Aggregate patterns, bottlenecks, client history, delivery/review timing |

---

## Data Categories to Collect

**Client profile data:**
- client email, name, client type
- repeat client flag
- prior document types and destination countries
- prior signer location and origin jurisdiction
- completed matter count, last matter date

**Matter pattern data:**
- document type, destination country, origin jurisdiction
- apostille required, translation likely, RON possible
- lane selected, turnaround time
- common missing fields, required checklist items

**UX event data:**
- intake started/submitted
- invoice viewed, payment clicked
- vault opened, custody rail opened
- review requested/clicked, support requested

**Operational data:**
- time from intake to quote/payment/scheduling/execution/release
- delayed states, repeated blockers
- VA task outcomes, founder interventions

---

## Data That Must Never Be Exposed to Clients

- `internal_notes`
- `operator_notes`
- `discount_note`
- `discount_reason`
- `raw_webhook`
- `raw_event`
- `margin` / `net_margin`
- `shipping_cost` / `label_url`
- `raw_courier_payload`
- Founder-only pricing notes
- PIP / provider / referral / chiropractic language (completely forbidden)

---

## Per-Surface Strategy

### Public Site
Use aggregate, non-private intelligence only. Highlight high-demand destinations, common document types, apostille pathways. Never expose client names, matter IDs, or private histories.

### Intake
Adapt for repeat clients: safe prefill of name, email, frequent destination, prior document type. Dynamic guidance: if Italy + affidavit → show client-safe apostille note. If UAE → explain legalization may be required. Never force autofill or expose prior matter data before authentication.

### Secure Matter Portal
Show one clear next action, one current status, one next step. Add client-safe pathway summary card when pathway_intelligence data exists. Add prior matter shortcut for repeat clients. Never dump backend jargon.

### Execution Center
Show client intelligence inside matter drawer only (not main surface): repeat client flag, prior destination countries, common missing fields, recommended checklist, similar prior matters. Recommendations only — never auto-change pricing, auto-confirm payment, or auto-release documents.

### Operations Desk
Preflight checklist based on pathway_intelligence common missing fields. Client follow-up template suggestions. Founder approval required flags. VA must never see: margins, discount reasons, founder notes, payment override controls.

### The Vault
Consistent folder structure, generated file naming protocol, Paid & Released certificate history, delivery logs, locked PDF indicators. Never overwrite sent files.

### The Atlas
Grow from aggregate execution intelligence: country routing notes, Hague/non-Hague classification, RON availability, translation likelihood, common blockers. Never expose specific client matters or internal operator notes.

---

## Recommended Database Tables

| Table | Purpose |
|---|---|
| `client_profiles` | Persistent client identity and repeat-client memory |
| `client_matter_preferences` | Repeat matter preferences and pathway reuse |
| `pathway_intelligence` | Country/document execution knowledge |
| `ux_learning_events` | Safe UX behavior/friction tracking |
| `client_guidance_rules` | Deterministic next-action messages |

All tables: RLS enabled, client reads own data only, service role for operator access.

---

## Implementation Phases

| Phase | Work | Status |
|---|---|---|
| 1 | Strategy doc, migration `029`, TypeScript helpers, UI cards | Complete |
| 2 | Wire NextActionCard into portal, MatterIntelligencePanel into drawer, PreflightGuidanceCard into VA portal | Post P0 |
| 3 | Populate pathway_intelligence with real country/document data | Post P0 |
| 4 | Intake repeat-client prefill | Post P0 |
| 5 | Reporting: repeat clients, common destinations, common blockers, turnaround | Post P0 |

---

## Safety Rules

1. No AI calls in helpers — all logic is deterministic
2. All DB calls wrapped in try/catch with safe fallbacks
3. `operator_notes` in `pathway_intelligence` is never serialized to client
4. `ux_learning_events` has no client read policy
5. Client reads own profile only — never another client's data
6. UI cards add intelligence, never replace working modules
7. Recommendations are labeled as suggestions — never claimed as guaranteed facts

---

## What NOT to Build Yet

- Automatic pricing changes based on patterns
- Automatic payment confirmation
- Automatic document release
- AI-generated copy in client portal
- Public claims about "AI-powered" features
- Automated courier if Shippo is not live
- Cryptographic audit trail if hash-chain is not implemented
- Any PIP, provider, referral, or chiropractic logic (permanently forbidden)
