# Milano Seal Responsive Visual QA

Purpose: permanent manual fallback checklist for environments where automated browser smoke testing is not configured.

## Required public routes

Check:

- `/`
- `/countries`
- `/apostille/italy`
- `/apostille/uae`
- `/apostille/brazil`
- `/map`
- `/map?country=italy`
- `/map?country=uae`
- `/intake`
- `/intake?destination=italy`
- `/review`
- `/about`
- `/founder`
- `/login`

## Required portal routes

Check with a valid token:

- `/portal/[token]`
- `/portal/[token]/invoice`
- `/portal/[token]/payment`
- `/portal/[token]/tracking`
- `/portal/[token]/documents`

## Required operator routes

Check while authenticated:

- `/dashboard`
- `/dashboard/matters`
- `/dashboard/matters/[matterId]`
- `/dashboard/payments`
- `/dashboard/apostille`
- `/dashboard/shipping`
- `/dashboard/testing/tiffany-e2e`
- `/internal`
- `/va`
- `/alliance`
- `/ops`
- `/admin`
- `/workspace`

## Required viewports

- 390px mobile
- 768px tablet
- 900px split screen
- 1024px laptop
- 1280px desktop
- 1440px desktop

## Required browser zoom

- 90 percent
- 100 percent
- 125 percent
- 150 percent

## Global acceptance

Every tested route must satisfy:

- no 500 error
- primary title visible
- primary CTA visible where applicable
- no card clipped
- no card hidden under header or ticker
- no country name cut off
- no unexpected horizontal scrollbar
- vertical scroll works when content needs space
- fixed bars do not cover CTAs
- mobile layout stacks cleanly
- split-screen layout remains usable

## Homepage acceptance

- hero route card fully visible
- globe remains behind route card
- country dots visible behind card
- Begin Secure Intake CTA visible
- Explore Global Document Intelligence CTA visible
- no ticker overlap
- no horizontal overflow
- route card not clipped at 90, 100, 125, or 150 percent zoom

## Countries and apostille acceptance

- Italy displays fully
- Spain displays fully
- Portugal displays fully
- Germany displays fully
- Mexico displays fully
- Brazil displays fully
- Greece displays fully
- UAE / United Arab Emirates displays cleanly
- United Kingdom displays cleanly
- Saudi Arabia displays cleanly
- Dominican Republic displays cleanly
- Hague route language is clear
- consular route language is clear
- 3D globe, SEO preview, and atlas are visually distinct
- View in Atlas links work
- Start Secure Intake links work
- `/map?country=italy` preselects Italy
- `/map?country=uae` preselects UAE
- `/intake?destination=italy` prefills safely

## Portal acceptance

- invoice summary visible
- discount code input visible
- Wise payment block visible
- payment reference wraps cleanly
- payment status visible
- tracker visible
- document vault visible
- final release / shipping panel visible
- no internal notes exposed
- no margin exposed
- no internal cost exposed
- no admin controls exposed to client

## Dashboard acceptance

- sidebar starts below header/ticker
- mobile drawer does not cover content
- matter action panels visible
- payment panels visible
- event ledger visible
- Tiffany E2E controls visible
- final packet checklist visible
- apostille queue visible
- shipping queue visible
- tables scroll horizontally only when intentional
- no operator action button hidden under fixed bars

## Regression rule

Every element marked with `data-critical-card` must remain visible and usable at every required viewport and browser zoom level.
