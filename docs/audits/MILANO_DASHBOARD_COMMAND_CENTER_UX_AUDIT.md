# Milano Seal Dashboard — Command Center UX Audit & Plan

Branch: `dashboard-command-center-ux-upgrade`
Scope: UX/UI + motion polish across the operator dashboard. **No** payment/Wise/release/auth/DB logic changes.

## Existing architecture (what we build ON, not replace)

- `app/dashboard/layout.tsx` → wraps **all 108 dashboard pages** in `MilanoShell` + `FounderAccessBar` (founder only). `requireDashboardAccess()` gate, `robots: noindex`.
- `components/dashboard/milano-shell.tsx` (`MilanoShell`) — the shared shell: black/gold sidebar (26 flat nav items), mobile drawer, UTC clock, operator identity, sign-out, "Begin Execution" CTA, footer.
- Visual tokens already exist via Tailwind theme + CSS vars: `--ms-gold`, `text-gold`, `bg-gold-soft`, `border-gold`, `gold-glow`, `text-foreground`, `bg-background`, `border-border`, `text-muted-foreground`.
- `framer-motion@^12.38.0` is installed — used for cinematic motion.
- Scattered prior components exist (`components/motion/MilanoMetricSweep`, `components/animations/StatusTransitionPill`, `components/alliance/AllianceEmptyState`, `components/portal/portal-empty-states`) — referenced for language, not reused directly.

## Findings

- **Shell is solid but nav is a flat 26-item list** — no grouping (Command / Control / Finance / Intelligence / Network). Hard to scan on mobile. Label `VA Tasks` should read `Execution Support`.
- **No shared dashboard component system** — each of the 108 pages styles its own cards/tables/badges/empty states, so spacing, status pills, and empty/loading/error states are inconsistent.
- **Status pills** are ad-hoc per page; no single canonical pill covering the locked state-machine + payment/release statuses.
- **Empty/loading/error states** are missing or inconsistent on many pages.
- **Tables** are raw per page; not consistently mobile-stacked.
- **Motion** is inconsistent — some pages animate, most don't; no shared reduced-motion-aware reveal.

## Plan (this branch, incremental — preview-reviewed before merge)

**Stage 1 — Foundation (this commit):** additive, zero-breakage.
- `components/dashboard/system/` design + motion system:
  - `dashboardTheme.ts` — canonical tokens (black/gold/ivory) mirroring existing CSS vars.
  - `DashboardMotion.tsx` — `Reveal`, `Stagger`, `StaggerItem` (framer-motion, `prefers-reduced-motion` aware, no layout shift, never blocks data).
  - `DashboardPageHeader.tsx` — eyebrow / title / description / status / primary+secondary action.
  - `StatusPill.tsx` — canonical pill for all locked statuses (intake_received … released, mismatch_review, release_locked/ready/released).
  - `RiskBadge.tsx` — RON risk, receiving-authority review, apostille required, payment mismatch, release locked, overdue follow-up, compliance manual review, courier exception, missing data.
  - `MetricCard.tsx` + `DashboardMetricGrid.tsx` — premium stat card (`—` when null, skeleton when loading, no fake metrics).
  - `CommandCard.tsx` — reusable card (gold top-hairline, subtle hover).
  - `DataTable.tsx` — sticky desktop header, mobile stacked cards, loading/empty/error states, row-action slot.
  - `DashboardEmptyState.tsx`, `DashboardSkeleton.tsx`, `DashboardErrorState.tsx` — calm premium states.
  - `index.ts` — barrel export.
- Shell: regroup `MilanoShell` nav into labeled groups + rename `VA Tasks` → `Execution Support` (visible label only; `/dashboard/va` route unchanged).
- `scripts/validate-dashboard-command-center.mjs` + `validate:dashboard-command-center` script.

**Stage 2+ (subsequent commits):** adopt the system route-by-route across the 17 target routes (Command Overview, Intake, Deals, Pipeline, Compliance, Invoices, Payments, Reconciliation, Follow-ups, Terminal, Acquisition/Revenue/Autopilot/Compliance Intel, Execution Support, Courier) — replacing ad-hoc cards/tables/states with the shared system, adding cinematic reveals, mobile-stacked tables, and clear primary actions. Real Supabase data only; honest empty states where data is absent. Each batch validated + previewed before the next.

## Locks honored
Supabase source of truth; Wise-first gates; client never trusts payment status; scheduling/release gates unchanged; ledger-safe; no exposure of internal notes/margin/commission; no validator removed; responsive containment + `data-critical-card` preserved; no fake metrics — honest empty states.
