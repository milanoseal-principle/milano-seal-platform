# Milano Seal — Duplicate Engine Audit

**Status:** Phase 1/24 discovery (first pass). Read-only — **nothing deleted or migrated in this pass.**
**Branch:** `milano-final-operating-system-unification` · **Base:** main `08941c0`

> Deletion rule (from the unification spec): a duplicate may be removed only when
> (1) confirmed duplicated, (2) controlling impl identified, (3) every consumer
> migrated, (4) validation proves the old impl is unused, (5) deletion documented
> here. This pass does **1** and **2** and records consumers; **3–5 are future work.**
> Consumer counts are `from "@/lib/…"` import greps; mark **(verify)** for deep traces.

---

## 1. Pricing engine — **FRAGMENTED (4 implementations)**

| Implementation | Consumers | Role |
| --- | --- | --- |
| `lib/pricing.ts` | **3** | de-facto controlling (most consumed real pricing) |
| `lib/command-center/pricingIntelligence.ts` (INTERNAL_PRICING, 750/975/1850) | 2 | command-center internal quote calc |
| `lib/config/pricing.ts` | 1 | config-level constants |
| `lib/pricing/*` (smartIntakePricingEngine, pricingDoctrine, INTERNAL_BASES 750/975/1850) | **0** | orphan (PR #98, never wired) |

- **Duplicate facts:** lane bases 750/975/1850 defined in **both** `command-center/pricingIntelligence` and `pricing/pricingDoctrine`.
- **Controlling target:** consolidate to a single `lib/pricing/canonicalPricingGateway.ts` (Phase 6) that the others delegate to.
- **Adapter strategy:** wrap `lib/pricing.ts` behind the gateway; mark `pricingIntelligence`/`config/pricing`/`smartIntakePricingEngine` `@deprecated`.
- **Deletion eligibility:** NOT yet — `lib/pricing.ts` (3) and `pricingIntelligence` (2) still consumed. smartIntakePricingEngine (0) is the safest first deprecation.

## 2. Country / Hague registry — **FRAGMENTED (3 sources)**

| Implementation | Consumers | Role |
| --- | --- | --- |
| `data/destinations` (DESTINATIONS) | **12** | dominant — homepage globe/routing corridors |
| `lib/compliance/countries.ts` (`CountryComplianceProfile`, hagueMember) | 5 | SEO country pages / apostille pages |
| `lib/jurisdictions/countryRegistry.ts` + `hagueStatus.ts` | 1 | new (next-five Task 3), near-orphan |

- **Controlling target:** one Canonical Country Intelligence (Phase 14). Likely fold `compliance/countries` (authoritative fields) + `data/destinations` (display/corridor) via adapters; retire the new `jurisdictions/countryRegistry` or make it the canonical shell that reads both.
- **Deletion eligibility:** NOT yet — two live sources (12 + 5 consumers). Start by adapting, not deleting.

## 3. Canonical Matter — **INTENDED CANONICAL UNDER-CONSUMED**

| Implementation | Consumers | Role |
| --- | --- | --- |
| `lib/platform/canonicalMatter.ts` (`CanonicalMatterObject`) | **1** | intended source of truth |
| `lib/command-center/types.ts` (`MatterCommandRecord`) | 0 | parallel model |
| `lib/matter/*` | (verify) | matter helpers |

- **Finding:** the canonical Matter exists but is barely wired — dashboards resolve from sample data, not `CanonicalMatterObject`. This is the central unification gap (Phase 4/10–22).
- **Deletion eligibility:** none — do **not** delete; **extend + wire consumers to** canonicalMatter.

## 4. Matter state machine — **CONTROLLING IMPL CLEAR**

| Implementation | Consumers | Role |
| --- | --- | --- |
| `lib/stateMachine.ts` | **11** | controlling |
| `lib/command-center/status.ts` (MASTER_STATUS, APOSTILLE_STATUS) | 1 | legacy status vocab |
| `lib/conversion/conversionStageRegistry.ts` | 1 | conversion stages |
| `lib/orbit/orbitStateMap.ts` | (verify) | UI orbit states |

- **Controlling target:** `lib/stateMachine.ts` (11 consumers). Others map into it via adapters (Phase 5). Keep legacy status strings until every consumer migrated.

## 5. Partner Passport / Trust Score — **TRIPLE DUPLICATE, ALL ORPHAN**

| Implementation | Consumers | Role |
| --- | --- | --- |
| `lib/alliance/intelligence/partnerPassport.ts` (+ trustNetworkRegistry, dispatchIntelligence) | **0** | established alliance model |
| `lib/dispatch/trustScore.ts` (+ dispatch/types, dispatchQueue) | **0** | new (next-five Task 5) |
| `lib/platform/trustNetwork.ts` | **0** | platform-layer model |

- **Finding:** three parallel Partner Passport / trust-score implementations, **all with 0 importers** — dashboards render sample data. Lowest-risk consolidation (nothing consumes them yet).
- **Controlling target:** pick `lib/alliance/intelligence` as canonical (most complete), adapter the dispatch + platform variants, deprecate duplicates (Phase 15). **Deletion becomes eligible early here** since consumers = 0 (still requires validation evidence before removal).

---

## Cross-cutting duplicates to audit next (deeper trace needed — **verify**)
- Conversion stages vs canonical states (Phase 18)
- Revenue lane registry duplicates (`lib/revenue`, `lib/seo-revenue`, command-center)
- Dashboard nav: `lib/dashboard-modules.ts` has a **malformed entry** (Government Intelligence object missing a closing brace, duplicate keys) — pre-existing; tolerated by `typescript.ignoreBuildErrors`. Fix during Phase 26 nav consolidation.
- Government opportunity models (`lib/government` vs `lib/government/intelligence` if present)

## Summary of controlling implementations (first-pass)
| Concept | Controlling (target) | Deprecate/adapter |
| --- | --- | --- |
| Pricing | `lib/pricing.ts` → new `canonicalPricingGateway` | pricingIntelligence, config/pricing, smartIntakePricingEngine |
| Country | canonical from `compliance/countries` + `data/destinations` | `jurisdictions/countryRegistry` |
| Matter | `lib/platform/canonicalMatter.ts` | MatterCommandRecord |
| State machine | `lib/stateMachine.ts` | command-center/status, conversion stages (via adapter) |
| Partner/Trust | `lib/alliance/intelligence` | `lib/dispatch/trustScore`, `lib/platform/trustNetwork` |

## Explicit non-actions this pass
- No files deleted. No imports migrated. No consumers changed.
- All findings above require consumer migration + validation evidence before any removal (spec rule 3–5).

**Next gated step (after review):** Phase 2–5 — canonical entity index, extend `CanonicalMatterObject`, and the `canonicalPricingGateway` + `matterStateAdapters`, each behind `@deprecated` shims so no existing consumer breaks.

---

# Phase 2–5 Decisions (implemented — additive only, nothing deleted)

| Concept | Controlling decision | Adapter added | Deprecated (not deleted) | Consumers migrated |
| --- | --- | --- | --- | --- |
| Matter | `lib/platform/canonicalMatter.ts` — **extended** with optional fields | `lib/platform/entities/adapters.ts` (MatterCommandRecord → canonical) | MatterCommandRecord (still used where it is) | 0 (foundation only) |
| Entities | `lib/platform/entities/index.ts` (single import surface) | ids/relationships/safety | — | 0 |
| State machine | `lib/stateMachine.ts` remains controlling | `lib/platform/matterStateAdapters.ts` delegates to it; `matterStateSafety.ts` | command-center/status, conversion stages (via adapter) | 0 |
| Pricing | `lib/pricing.ts` remains controlling | `lib/pricing/canonicalPricingGateway.ts` delegates `calculatePrice`; `pricingAdapters.ts`; `pricing/index.ts` | pricingIntelligence, config/pricing, smartIntakePricingEngine (marked @deprecated in index) | 0 |
| Partner Passport | `lib/alliance/intelligence/partnerPassport.ts` **selected** | `lib/alliance/canonicalPartnerPassport.ts` (re-export) + `partnerPassportAdapters.ts` | `lib/dispatch/trustScore.ts`, `lib/platform/trustNetwork.ts` | 0 (all 3 had 0 importers) |
| Country | `data/destinations` (presentation) + `compliance/countries` (authoritative) | `lib/jurisdictions/canonicalCountryAdapter.ts` (merge by ISO, preserve conflicts) | `jurisdictions/countryRegistry` → adapter layer | 0 |

**Deletion eligibility remains FALSE for every item.** No consumer migrated in this pass; nothing removed. Deletion still requires: consumers migrated → validation proves unused → documented here.

**Next migration sequence (future, gated):** (1) route new pricing consumers through `canonicalPricingGateway`; (2) wire dashboards to read canonical state via `normalizeMatterState`; (3) migrate the 0-consumer passport/trust duplicates first (lowest risk); (4) fold country sources through `canonicalCountryAdapter`. No Portal 2.0 live auth, no nav reorg, no deletion in this phase.
