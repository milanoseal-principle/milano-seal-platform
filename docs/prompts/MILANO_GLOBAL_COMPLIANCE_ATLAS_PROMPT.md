# Milano Seal — Global Compliance Atlas (Stage 1 of 3; do not merge with Identifier Lock / RON Matrix)

Source-of-truth country intelligence powering /countries, /map, /apostille/[country], execution cards,
operator routing, lawyer packs, VA queues, alliance readiness, SEO.

PUBLIC = route preview, authority, conversion. PRIVATE = checklist, source notes, operator controls.

Compliance boundary: The Milano Seal is not a law firm. Routing snapshots remain subject to receiving-authority
review. No acceptance guarantees, no government affiliation, no secret shortcuts.

Files: data/global-compliance-atlas.ts (every destination slug resolves; routeType, publicRouteLabel,
publicSummary, receivingAuthorityBoundary, hagueStatusLabel, ron/wetInk/translation/consular/courier risk,
publicFlags, document/industry warnings, required client/operator/alliance/va checks, sourceNotes,
lastReviewedAt, reviewCadenceDays). data/country-role-use-cases.ts (client/lawyer/alliance/va/operator per
country + priority revenue audiences). data/receiving-authority-requirements.ts. Validators:
validate:global-compliance-atlas, validate:receiving-authority-rules. Public functions safe; private functions
role-gated (operator/va/alliance/lawyer/founder) for authenticated server use only.
