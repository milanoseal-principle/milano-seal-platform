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
