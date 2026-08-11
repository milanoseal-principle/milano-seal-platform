# Mini Atlas ↔ Full Atlas Flow Map

## Locked homepage layout

The homepage routing preview (`components/landing/homepage-routing-preview.tsx`)
renders a single two-column panel:

```
┌───────────────────────────────┬───────────────────────────────┐
│  Mini Atlas (bottom-left)     │  Execution Intelligence card  │
│  MiniAtlasPreview             │  DestinationIntelligenceCard  │
└───────────────────────────────┴───────────────────────────────┘
grid-cols-1  ·  lg:grid-cols-2
```

- **Desktop:** Mini Atlas left, Execution Intelligence right.
- **Mobile:** stacks to one column — Mini Atlas first, Execution Intelligence
  second (DOM order guarantees this).
- The top dotted "Authority Coverage" globe (`GlobalRouteGlobe`) has been
  **removed** from the homepage. The component itself is preserved and still
  used on country authority pages (`components/seo/CountryAuthorityPage.tsx`,
  `app/countries/[country]/page.tsx`).

## Mini Atlas = true scaled-down reuse of the canonical Atlas

`components/home/MiniAtlasPreview.tsx` is **not** a bespoke SVG teaser. It embeds
the exact interactive component the full `/map` Atlas uses:

| Concern            | Canonical source                                             |
| ------------------ | ------------------------------------------------------------ |
| Interactive map    | `GlobalIntelMapInteractive` (Leaflet world choropleth)       |
| Country data       | `DESTINATIONS` (`data/destinations`)                         |
| Palette / type     | gold `var(--ms-gold)` / `#C6A55A`, mono + serif system       |
| Badge language     | Hague / Consular, matching the full Atlas                    |
| Execution origin   | Florida                                                      |

Because it reuses the canonical primitive, the Mini Atlas cannot visually drift
from the full Atlas.

## Selection & deep-link flow

```
MiniAtlasPreview.onSelect(dest)
        │
        ├──► HomepageRoutingPreview setSelected(dest)
        │         │
        │         └──► DestinationIntelligenceCard (right column) re-keys to dest
        │
        └──► "Open Full Atlas" → /map?country=<slug>
                  │
                  └──► MapPage searchParams.country → <GlobalMap initialCountry> 
                            → full Atlas opens focused on the same corridor
```

- Selecting a country on the Mini Atlas map syncs the Execution Intelligence
  card on the right.
- The Mini Atlas auto-cycles through canonical destinations (priority order
  Italy, Germany, UAE, Mexico, Brazil, Spain, France, Portugal, UK, Canada, then
  the rest; ~5s interval) and **pauses** on hover, focus, or manual selection.
- "Open Full Atlas" carries the selected slug so the full Atlas continues the
  same corridor.

## Validation

`npm run validate:mini-atlas-intelligence-flow` enforces every invariant above
(globe removed, canonical reuse, grid shape, DOM/mobile order, deep-link,
auto-cycle, Florida origin).
