# Milano Seal — State & Pricing Governance

**Phases 4–5 deliverable.** One state machine, one pricing source. Additive adapters; nothing deleted.

## State machine (Phase 4)
- **Controlling:** `lib/stateMachine.ts` (11 consumers) — unchanged.
- **Adapters:** `lib/platform/matterStateAdapters.ts`
  - `CANONICAL_MATTER_STATES` (intake_received … on_hold)
  - `mapLegacyMatterState` / `normalizeMatterState` — legacy `DealStatus` → canonical; **unknown → `on_hold`, never `completed`**
  - `canTransitionMatterState` — **delegates to `stateMachine.canTransition`** for shared states; supplements only canonical-only states (quote_ready, payment_confirmed, delivered, on_hold)
  - `getMatterStateLabel`, `getMatterStateOperatorAction`
- **Payment gate honored:** `canTransitionMatterState` refuses `→ scheduled` unless coming from `payment_confirmed`. Adapters **only validate/label** — they never unlock scheduling; the real gate is untouched.
- `matterStateSafety.ts` — `schedulingConsistent`, `releaseConsistent`, `isTerminalMatterState` (advisory checks for UI/validators).

## Pricing (Phase 5)
- **Controlling:** `lib/pricing.ts` → `calculatePrice` — unchanged; remains the source of final consumer prices.
- **Gateway:** `lib/pricing/canonicalPricingGateway.ts`
  - `quoteConsumer(input, ctx)` — **delegates to `calculatePrice`**; forces manual review for regulated/court/consular/custody/immigration/fingerprint-ORI/receiving-authority-uncertain contexts (no auto final quote).
  - `quoteNonConsumer(category, ctx)` — Government / Enterprise / Alliance are **operator-prepared** (manual review); `internalOnly: true` so rates/payouts/margin never reach public surfaces.
- `pricingAdapters.ts` — canonical Matter → engine input (translation only, no constants).
- `pricing/index.ts` — canonical import surface; parallel engines marked `@deprecated` (not deleted).
- **No new final-price constants added.** 750/975/1850 remain defined only in existing files (to be consolidated in a later migration).

## Country governance (supporting)
`lib/jurisdictions/canonicalCountryAdapter.ts` merges `data/destinations` (presentation) + `compliance/countries` (authoritative) by ISO, **preserving conflicts** (`conflicts[]`, `manualReviewRequired`) rather than overwriting. `data/destinations` and `compliance/countries` remain their respective controlling sources; `jurisdictions` is the adapter layer.

## Partner Passport governance (supporting)
Controlling = `lib/alliance/intelligence/partnerPassport.ts` (`lib/alliance/canonicalPartnerPassport.ts` re-exports it). `dispatch/trustScore` and `platform/trustNetwork` deprecated (0 importers), wrapped by `partnerPassportAdapters.ts`, not deleted.
