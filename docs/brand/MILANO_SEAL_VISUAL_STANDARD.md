# THE MILANO SEAL™ — Visual Standard (LOCKED)

> Companion to `MILANO_SEAL_BRAND_SYSTEM_LOCKED.md`. Defines the applied visual
> rules for logo, color, type, iconography, imagery, and spacing.

---

## 01. Logo Suite

- **Primary logo (light):** Gold "M" feather seal + wordmark, on ivory/white.
- **Secondary logo (dark):** Gold seal + wordmark, on matte black.
- **Mark only:** Circular gold "M" feather seal.
- **Wordmark:** THE MILANO SEAL™ in primary type.

## 02. Color Palette

| Swatch | Hex | Name | Use |
|---|---|---|---|
| ⬛ Matte Black | `#0A0A0A` | Archive Black | Primary dark surface |
| 🟨 Milano Gold | `#C6A65B` | Antique Gold | Accent, seal, tagline |
| ⬜ Ivory Parchment | `#F6F1E6` | Embassy Parchment | Light surface |
| ⬜ Signature White | `#FFFFFF` | Clean White | Contrast / type |

Legacy gold alias retained for existing UI: `#C6A55A`.

## 03. Typography

| Role | Typeface | Notes |
|---|---|---|
| Primary | Trajan Pro | All-caps display, logo lockups |
| Secondary | Cinzel | Refined caps, subheads |
| Body | Playfair Display | Long-form copy, descriptions |

## 04. Iconography Style

Thin line icons in gold or white. Consistent stroke weight and spacing.
Core icon set: Trust · Global · Documents · Authority · Execution.

## 05. Imagery Style

Dark, elegant, professional, global, trust-building.
Avoid bright or casual stock photography.

## 06. Clear Space & Minimum Size

- **Clear space:** Equal to the height of the letter "M" on all sides.
- **Minimum size:** 0.75 in (print) · 24 px (digital).
- Maintain legibility in all applications.

## 07. Tagline Treatment

`SEALING TRUST IN EVERY SIGNATURE` — always all-caps, letter-spaced
(~0.28em), gold or white on dark. Never alter wording. See `.ms-tagline`
in `app/styles/milano-theme.css`.

## 08. Brand Applications

Website · Business cards · Presentation folders · Proposals · Email
signatures · Social media · Packaging inserts · Apostille cover letters ·
Marketing materials. Maintain consistency across all touchpoints.

## 09. Long-Term Brand Vision

The Milano Seal™ will be recognized worldwide as the authority for U.S.
document execution and authentication — standing for luxury, trust, and
precision across every major international market.

---

## Usage in Code

```ts
import { MILANO_COLORS, MILANO_BRAND } from "@/app/theme/milanoBrand";
```

```css
@import "../styles/milano-theme.css";
/* var(--ms-milano-gold), var(--ms-matte-black), .ms-tagline ... */
```
