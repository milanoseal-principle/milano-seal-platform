# Milano Seal Sales Intelligence Lab — Extraction & Productionization

Branch: `milano-sales-intelligence-lab`
Source: `MilanoIntelligence.jsx` (via the approved extraction spec — the raw JSX was
not available in-session, so the documented module inventory + seed data in the
spec were used as source of truth). No spreadsheets used.

## 1. Modules extracted from the source
Dashboard (KPIs, 7-day activity, pipeline, daily tracker), Ecosystem tracker (add/
filter/table), DM Builder (9 triggers, 5 output panels), Content Studio (5 content
types), Lead Capture (add/score/status), Billing (SaaS plans + Stripe portal), root
shell (tabbed nav, seed accounts/leads/daily, notifications), shared UI kit
(GoldLine, Badge, KPITile, SectionHeader, Input, Select, GoldBtn, GhostBtn, Card,
Notify).

## 2. Preserved (productionized to TypeScript + Milano Seal look)
- **Snapshot** (`SalesLabDashboard`) — KPI tiles, 7-day demo activity (CSS bars, no
  recharts dependency), pipeline-by-status, daily execution tracker.
- **Outreach Ecosystem** (`EcosystemTracker`) — add account, status/priority
  filters, table. Local state + localStorage; no DB writes.
- **DM Builder** — 9 triggers preserved; output panels Full Message / Opener /
  Authority / Soft Pivot / 48h Follow-Up; copy buttons.
- **Content Studio** — 5 content types; Hook / Caption / CTA / Hashtags.
- **Lead Capture** — add lead, deterministic/AI score, status update, filters.
- **Shared UI kit** — typed, accessible, dashboard-aligned.

## 3. Unsafe items CONVERTED
- **Client-side Anthropic call** (`fetch("https://api.anthropic.com/v1/messages")`)
  → removed from all client components. Replaced with server route
  `app/api/intelligence/generate/route.ts` (runtime nodejs, modes `dm`/`content`/
  `lead_score`, uses `ANTHROPIC_API_KEY` server-side only, deterministic fallback
  when the key is missing, safe JSON parse, never exposes the key). Clients call
  `/api/intelligence/generate`.
- **Design tokens** (source `T{}`, navy/char/etc.) → Milano Seal black/gold/ivory
  tokens in `constants.ts`.

## 4. Unsafe items REMOVED
- **Billing page**, **Stripe billing portal**, **Starter/Pro/Agency SaaS plans**
  ($49/$149/$399) — deleted entirely. No checkout, no payment button.
- Fake live revenue → renamed to **Estimated Demo Value** with an explicit
  "workspace estimate — not live revenue" label.

## 5. Why Billing became Offer Library
The lab is an internal outreach/content workspace, not a billing surface. Billing
was replaced with `OfferLibrary` showing the real Milano Seal lanes (Signature $750
/ Priority $975 / Executive $1,850) and add-ons (Apostille +$250, Rush +$400, Extra
Signer +$150) as **internal reference only** — final quote confirmed after
document/signer/jurisdiction/apostille/receiving-authority review. No payment rail.

## 6. Why Anthropic moved server-side
An API key in a client bundle is a credential leak. All generation now runs through
the protected server route; the browser never sees the key or calls Anthropic
directly. The route degrades gracefully to deterministic output without a key.

## 7. Why demo data is isolated
All seed accounts, leads, and daily activity live in `constants.ts`, each tagged
`demo: true`, surfaced only inside the auth-gated dashboard route with a persistent
"Demo workspace data only — not live dashboard, payment, courier, or matter data"
banner. Optional `localStorage` persistence (`milano_sales_lab_accounts` /
`milano_sales_lab_leads`) with a "Reset demo workspace" control. No Supabase writes.

## 8. Why spreadsheets were excluded
Explicitly out of scope for this run per instruction — none imported or referenced.

## 9. No backend / payment / Wise / release / DB changes
This branch adds only: the lab components, the AI generate route, the validator, and
this doc (+ a package.json script). It changes no payment, Wise, release-gate, auth,
Supabase schema, custody-ledger, or notification-orchestration code.

## 10. Future upgrade path
- Connect Outreach Ecosystem to a real `outreach_accounts` table (server-gated).
- Persist real lead records with approval workflow.
- Saved DM / content templates.
- Operator role-scoped access + audit logging.
