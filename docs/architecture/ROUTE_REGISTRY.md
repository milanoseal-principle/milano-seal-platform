# Milano Seal Route Registry

This registry separates approved public live routes, internal dashboard routes, staged authority routes, and the future programmatic SEO engine. It prevents the live public surface from drifting into unapproved page explosions or empty shells.

## Live public routes

Only these approved live routes are eligible for the controlled sitemap list:

- `/`
- `/pricing`
- `/secure-portal`
- `/intake`
- `/intake/confirmation`
- `/map`
- `/apostille/italy`
- `/apostille/brazil`
- `/international-affidavits` — International Affidavit Library index
- `/international-affidavit`
- `/power-of-attorney-international`
- `/affidavit-name-discrepancy`
- `/affidavit-one-and-the-same`
- `/affidavit-non-existence-record`
- `/affidavit-translation-accuracy`

The six affidavit authority pages are published as a controlled, human-authored authority cluster. Publishing these approved pages does **not** enable bulk programmatic generation.

## Internal dashboard routes

Internal dashboard routes must remain noindex and operator-authenticated:

- `/dashboard`
- `/dashboard/command-center`
- `/dashboard/discounts`
- `/dashboard/referrals`
- `/dashboard/seo-authority`
- `/dashboard/compliance-atlas`
- `/dashboard/operator-terminal`
- `/dashboard/invoices`
- `/dashboard/intelligence/sales-lab`

## Staged authority routes

These authority concepts remain staged/noindex until their current page/content governance is explicitly approved:

- `/fbi-apostille`
- `/international-notary`
- `/remote-online-notary`

## Future programmatic SEO rules

The future programmatic engine is `staged_only` and targets 2400 pages only after these requirements are approved:

- verified content model
- canonical URL rules
- duplicate content guard
- sitemap batching
- noindex protection for drafts
- country data verification
- operator approval

`isProgrammaticAllowed()` must return `false` until those controls are complete.

## Sitemap logic

`getSitemapRoutes()` returns only approved public live routes. Internal dashboard routes and staged authority routes are excluded from the controlled route-registry sitemap projection.

The application-level sitemap may include other separately approved public service, country, document, guide, and local pages; it must not include staged or draft authority routes.

## Noindex rules

`getNoIndexRoutes()` returns internal dashboard routes plus staged authority routes. Unknown routes are not automatically approved for indexing.

## No fake pages

Do not create 2400 pages, spreadsheet-generated pages, or empty shells from this registry. The registry is governance, not a generator. Document × country pages remain subject to the Topical Authority quality/indexation gate and human approval.

## Full route inventory and L0–L6 certification

`lib/routes/routeRegistry.ts` is the single route registry. The lists above stay
the canonical sitemap/noindex lifecycle source; the complete per-route inventory
is generated from current `app/**/page.*` and `app/**/route.*` files into
`lib/routes/routeInventory.generated.json` by the canonical route walker:

- Generate: `node scripts/generate-route-map.mjs` (also regenerates `docs/ROUTE_MAP.md`)
- Check drift: `node scripts/generate-route-map.mjs --check` and `npm run validate:route-registry`

Each record carries: stable id (`<kind>:<url>`), venture, source path, URL,
kind, methods, dynamic params, parent, canonical module, registry references
(routeRegistry lists, moduleRegistry, touchpointRegistry, systemRegistry,
commercialInventory, ROUTE_MAP critical routes), redirect, lifecycle, exposure,
access classification and its source, guards, roles, workspace grants,
entitlement, record scope, data operations, RLS posture, direct and transitive
dependencies, integrations, test references, deployment, evidence date,
customer, revenue lane, owner, historical-baseline status and certification.
Unknown stays `UNKNOWN`; heuristic fields are labelled `static_heuristic`.

Access comes from what is enforced: proxy.ts protection and role rules (read
from proxy.ts, evaluated with `isRouteAllowedForRole`), then in-route guards
read from the handler (and any module it re-exports). A public API handler with
no recognized guard is `UNKNOWN`, never assumed public.

Certification levels:

- L0 discovered — the route file exists at HEAD.
- L1 registered — the record has an access classification. Registration is not certification.
- L2 dependencies verified, L3 secured, L4 authenticated workflow verified,
  L5 operational/recovery certified, L6 commercially validated — granted only by
  human-approved entries in `lib/routes/routeCertificationEvidence.json`, each
  bound to the route's current source hash and dependency-graph hash, with
  existing test files; L3+ require the anonymous, expired session, permitted
  role, forbidden role, cross-tenant and mutation cases. Levels are cumulative;
  stale evidence is ignored and never promotes. Nothing is promoted because
  source exists.

CI fails when the inventory drifts from source, when a route has no access
classification (the `ACCESS_REVIEW_BACKLOG` of pre-existing unclassified public
APIs is shrink-only), when evidence names an unknown route, or when any record
of the historical baseline tree (`HISTORICAL_ROUTE_BASELINE`) is lost — a
baseline route removed at HEAD stays as `removed_at_head`.
