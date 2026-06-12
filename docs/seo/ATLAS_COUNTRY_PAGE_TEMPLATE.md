# Atlas Country Page SEO Template

Template for `/countries/[country]` and `/countries/[country]/apostille` pages.

## URL Structure

```
/countries/[country]              — country overview
/countries/[country]/apostille    — apostille-specific
/countries/[country]/legalization — legalization-specific (non-Hague)
/countries/[country]/[document]   — document-specific
```

## Metadata Template

```ts
title: "[Country] Apostille & Document Execution | The Milano Seal™"

description: "Coordinate U.S. document execution, notarization, apostille preparation,
and international release for documents intended for use in [Country]."

alternates.canonical: "https://themilanoseal.com/countries/[slug]"

openGraph:
  title: same as title
  description: same as description
  url: "https://themilanoseal.com/countries/[slug]"
  siteName: "The Milano Seal™"
  type: "website"

robots: index, follow
```

## H1

```
[Country] Document Execution Pathway
```

## Page Sections

### 1. Pathway Overview
- Hague status (member / non-member)
- Apostille or legalization route
- Do NOT claim guaranteed acceptance or legal advice

### 2. Common Documents
List from `AtlasCountry.commonDocuments`. Render as chips or bullets.

### 3. Signing & Notarization Review
- RON likelihood
- Two-witness requirement if applicable
- Language: "Signing method will be confirmed based on document requirements."

### 4. Translation Note
Only if `translationLikely = true`:
"Translation review may be required depending on the receiving authority and document type."

### 5. International Release Process
3–5 steps sourced from `data/destinations.ts → executionPath`.

### 6. Client-Safe Notice
```
This pathway is informational and subject to document-specific review.
The Milano Seal™ does not provide legal advice.
```

### 7. CTA
Primary: **Begin Secure Intake** → `/intake?country=[Country Name]`
Secondary: **Review All Pathways** → `/countries`

## Forbidden Content

- "guaranteed acceptance"
- "legally guaranteed"
- "government approved"
- "embassy verified"
- `operatorSummary` content
- Internal notes
- Pricing or margin data

## Priority Pages to Build

| Country | Slug | Pathway | Status |
|---------|------|---------|--------|
| Italy | italy | Apostille | Live |
| Spain | spain | Apostille | Live |
| Germany | germany | Apostille | Live |
| Portugal | portugal | Apostille | Live |
| UAE | uae | Legalization | Live |
| Mexico | mexico | Apostille | Live |
| Brazil | brazil | Apostille | Live |
| Greece | greece | Apostille | Live |
| France | france | Apostille | Draft |
| United Kingdom | united-kingdom | Apostille | Draft |
| Australia | australia | Apostille | Draft |
| Canada | canada | Review | Draft |
| Colombia | colombia | Apostille | Draft |
| Chile | chile | Apostille | Draft |
| Argentina | argentina | Apostille | Draft |

## Programmatic SEO — Document Type Pages

Pattern: `/countries/[country]/[document-type]`

Examples:
- `/countries/italy/apostille`
- `/countries/italy/power-of-attorney`
- `/countries/italy/affidavit`
- `/countries/italy/vital-record`

Build only when country page is live and data is verified.
Do not create 1,500 pages without founder review.
