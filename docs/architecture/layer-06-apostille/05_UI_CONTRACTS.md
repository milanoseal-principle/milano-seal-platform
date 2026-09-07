# UI Contracts

Layer-specific UI responsibilities are defined in `../../LAYER_MANIFEST.json`.

Rules:
- Render canonical server truth; never manually advance protected state for appearance.
- One primary next action per state.
- Show WHAT / WHY / NEXT ACTION for blocked or review-required states.
- Milano shell: near-black, warm ivory, restrained gold, strong hierarchy, minimal clutter.
- Mobile-first at 375/390/430/768/desktop with 44px targets and no clipping.
- Motion: 120–180ms common, 200–260ms major, reduced-motion safe.
