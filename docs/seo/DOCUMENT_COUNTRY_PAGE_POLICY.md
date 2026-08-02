# Document × Country Page Policy — Indexation Gate

Extends the existing Topical Authority engine (no parallel SEO platform, no
duplicate country/document registries). Prevents thin/doorway/mass-generated
pages from ever being indexed.

## Gate (`lib/topical-authority/programmatic/`)
- `pageQualityScore.ts` — deterministic quality evaluation. **Any blocker → not
  indexable** regardless of score: no verified document/country record, no
  authority source, thin body, insufficient internal links, not document+country
  specific, missing rejection-risk value, no conversion path, human review not
  completed, duplicate primary intent (cannibalization), unsupported/guaranteed
  claim (reuses `containsBannedContentClaim`), or stale compliance sources.
- `pageEligibility.ts` — indexation states (draft / review_required /
  approved_indexable / approved_noindex / retired / redirected). A page reaches
  **approved_indexable** only when the quality gate passes AND an operator has
  approved it. `sitemapEligiblePages()` returns only approved-indexable pages.

## Doctrine
No mass auto-generation. Google guidance: helpful, people-first, source-backed
content; no guaranteed rankings/acceptance. The wider SEM/backlink/digital-PR
build is deferred — this is the safety gate everything else depends on.
