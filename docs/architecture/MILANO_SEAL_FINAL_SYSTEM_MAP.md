# Milano Seal — Final System Map

**Status:** Phase 1 discovery (first pass). Read-only audit — no code changed.
**Branch:** `milano-final-operating-system-unification`
**Base commit:** main `08941c0`

> This map is a discovery snapshot to guide unification. Consumer counts are
> measured by import grep (`from "@/lib/…"`); where a trace is incomplete it is
> marked **(verify)**. Nothing here is deleted or migrated — that is later work,
> gated by the Duplicate Engine Audit.

## Scale (measured)
- **~320** `page.tsx` routes under `app/`
- **~90** dashboard subroutes under `app/dashboard/`
- **~80** top-level `lib/` modules
- Portal routes under `app/portal/` incl. `v2`, `matter-room`, `documents`, `payment`, `release`, `ron`, `tracking`

## Six-Layer Architecture (existing modules classified)

### Layer 1 — Client Experience
- Public site, service pages (`app/services/*`), country pages (`app/countries/[country]`, `app/apostille/*`)
- Smart Intake (`components/intake/*`, `app/intake`), pricing presentation (`app/pricing`)
- Client Portal (`app/portal/*`), Portal 2.0 (`app/portal/v2` — **new, not yet wired to authorized Matter**)

### Layer 2 — Execution Engine
- Execution pathway (`lib/execution/*`), execution QA (`lib/execution-qa`, `app/dashboard/execution-qa`, `matter-ops`)
- Apostille rules (`lib/apostille-rules`), fingerprinting/ORI (`lib/fingerprinting`), translations (`lib/translations`)
- Custody controls (`lib/custody` — **PROTECTED**), release (`lib/release` — **PROTECTED**)

### Layer 3 — Operations
- Founder OS (`lib/founder-os`, `app/dashboard/founder` — **new**), Command Center (`lib/command-center`, `app/dashboard/command-center`)
- Conversion Recovery (`lib/conversion`, `app/dashboard/conversion`), Acquisition (`lib/acquisition`, `app/dashboard/acquisition` — **new**), SEO Revenue (`lib/seo-revenue`)
- Government/procurement (`lib/government`, `app/dashboard/government`, `government-intelligence`), notifications (`lib/notifications`)

### Layer 4 — Trust Network
- Alliance intelligence (`lib/alliance/intelligence/*`), Dispatch (`lib/dispatch`, `app/dashboard/dispatch` — **new**), platform trust (`lib/platform/trustNetwork`)
- **Three competing Partner Passport / trust-score implementations — see Duplicate Audit.**

### Layer 5 — Intelligence
- Country/Hague/embassy/consular (`lib/compliance/countries`, `lib/jurisdictions`, `data/destinations`, `lib/intelligence`)
- Government intelligence (`lib/government`), case studies, Knowledge Graph (`lib/intelligence-platform`, `lib/alliance/intelligence`)

### Layer 6 — Enterprise
- Enterprise/white-label/API tiers — **mostly conceptual**; `CanonicalMatterObject.executionTier` already includes Foundation/Professional/Enterprise scaffolding.

## Core Entities (found)
- **Intended canonical:** `lib/platform/canonicalMatter.ts` → `CanonicalMatterObject` (execution tier/path, client, jurisdiction, commercial, QA, fulfillment). **Only 1 importer today** — the central unification gap.
- Parallel matter models: `lib/command-center/types.ts` (`MatterCommandRecord`, 0 importers), `lib/matter/*`.
- State machine: `lib/stateMachine.ts` (**11 importers — de-facto controlling**).

## Data-source paths
- **Live/DB:** `lib/supabase/*` (**PROTECTED RLS**), portal loaders, `lib/live-data/*` (adapter layer scaffold).
- **Static/sample:** `data/destinations` (12 importers), dashboard `SAMPLE_*` consts across `app/dashboard/*` pages (government, acquisition, dispatch, etc. — labeled "Internal sample data").

## Protected integrations (DO NOT ALTER)
`lib/wise/*`, Wise webhooks (`app/api/**/wise`), payment confirmation, payment-before-scheduling gate, `lib/release/*`, `lib/custody/*`, `lib/supabase` RLS/auth, `lib/shippo/*`, `lib/bluenotary/*`, statutory notarial fee logic, apostille eligibility, fingerprint/ORI routing, env/secrets.

## Orphan / not-yet-wired modules (0 importers — built but unconsumed)
- `lib/pricing/smartIntakePricingEngine` (PR #98) — **0 importers**
- `lib/dispatch/trustScore`, `lib/alliance/intelligence/partnerPassport`, `lib/platform/trustNetwork` — **all 0 importers**
- `lib/command-center/types` (MatterCommandRecord) — **0 importers**
- Most `lib/jurisdictions/*` (new) — 1 importer

## Modules not connected to canonical Matter
Nearly all Layer-3/4 dashboards currently render **sample data**, not `CanonicalMatterObject` (canonicalMatter has 1 importer). Wiring these to canonical Matter is the core Phase-4/10–22 work.

## Dashboards displaying static/sample data (to convert to live/empty)
`app/dashboard/government`, `acquisition`, `dispatch`, `founder`, `jurisdictions`, plus any panel sourced from a `SAMPLE_*` const.

## Modules with no clear operator next-action (candidate cleanup)
Preview/demo routes: `app/dashboard/motion-preview`, `build-center`, `testing`, `dna`, `truth`, `memory`, `observations` — **verify** before any consolidation.

## Next
Proceed to `MILANO_SEAL_DUPLICATE_ENGINE_AUDIT.md`. No consolidation or deletion until that audit identifies controlling implementations and proves consumers can migrate.
