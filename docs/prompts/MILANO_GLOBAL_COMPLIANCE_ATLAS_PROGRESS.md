# Global Compliance Atlas — Progress (Stage 1 of 3)

Branch: claude/funny-maxwell-hlxQN

## Created
- data/global-compliance-atlas.ts — GLOBAL_COMPLIANCE_ATLAS (every destination slug),
  getCountryComplianceAtlasEntry, getPublicCountryCompliance (safe), getPrivateCountryCompliance
  (role-gated: operator/founder full, lawyer/alliance/va scoped). Route types: hague_apostille /
  authentication / consular_legalization / receiving_authority_review / hybrid_review. Each entry:
  public route label + summary, receiving-authority boundary, hague status, RON/wet-ink/translation/
  consular/courier risk, public flags, document/industry warnings, client/operator/alliance/va checks,
  sourceNotes (operator_note + needs_review where no official source), lastReviewedAt + reviewCadenceDays.
- data/country-role-use-cases.ts — per-country use cases for client/lawyer/alliance/VA/operator +
  priority revenue audiences (foreign/us counsel, private client, family office, yacht, real estate,
  equine, gemstone). Brazilian-attorney + Italian-yacht-broker copy generated per country.
- data/receiving-authority-requirements.ts — RECEIVING_AUTHORITY_REQUIREMENTS profiles (bank, civil
  registry, maritime/real-estate registry, consulate, foreign court, university, private buyer) with
  RON/wet-ink/translation risk + operator-review flags; getReceivingAuthorityRequirements(country, doc).
- scripts/validate-global-compliance-atlas.mjs, scripts/validate-receiving-authority-rules.mjs + package scripts.

## Reused, not duplicated
Public CTA module already on /countries + /map (prior commit). Private engine stays gated. No
pricing/payment/intake/operator-state change. No UI rebuild.

## Commands
validate:project ✓ · intelligence ✓ · execution-intelligence ✓ · intelligence-safety ✓ · sales-engine ✓ ·
revenue-copy ✓ · global-compliance-atlas ✓ · receiving-authority-rules ✓ · typecheck ✓ · build ✓ ·
smoke:responsive ✓ (clean skip).

## Deferred (separate stages — not merged)
Stage 2: Identifier Lock + Document Version Integrity (+ migration 037). Stage 3: RON Acceptance Matrix.
