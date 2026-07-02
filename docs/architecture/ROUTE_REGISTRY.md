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

These are staged authority concepts. They remain noindex until a verified content model, canonical rules, and operator approval exist:

- `/international-affidavit`
- `/power-of-attorney-international`
- `/affidavit-name-discrepancy`
- `/affidavit-one-and-the-same`
- `/affidavit-non-existence-record`
- `/affidavit-translation-accuracy`
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

`getSitemapRoutes()` returns only approved public live routes. Internal dashboard routes and staged authority routes are excluded from the sitemap.

## Noindex rules

`getNoIndexRoutes()` returns internal dashboard routes plus staged authority routes. Unknown routes are not automatically approved for indexing.

## No fake pages

Do not create 2400 pages, spreadsheet-generated pages, or empty shells from this registry. The registry is governance, not a generator.
