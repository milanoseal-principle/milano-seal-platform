# Final Branch Salvage Audit

Audit of Ready-Preview branches/commits against green `main` to decide what
belongs in final. **`main` only advances via merged PRs; nothing here is
merged wholesale.** Only isolated, build-safe files are salvaged.

- **Green main audited against:** `7fc742f`
- **Rule:** no Wise / payment / release / custody / Supabase RLS / Shippo /
  BlueNotary changes; no PIP / Liaison OS; no red build resurrected; no old
  branch merged wholesale.

## Classification

| Commit / Branch | Vercel | vs current main | Decision | Files salvaged | Files rejected | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| `14fcdca` · milano-cinematic-motion-system | Ready Preview | ahead by 1 commit | **Safe salvage** | `app/dashboard/motion-preview/page.tsx`, `components/dashboard/motion/*` (16), `scripts/validate-motion-system.mjs` | its `package.json` diff (contained a bug: `"framer-motion"` placed inside `scripts`) | Operator-only dashboard preview; `framer-motion@^12.38.0` already in main so it builds; no public/payment surface. Only the clean `validate:motion-system` script was re-added by hand. |
| `6a9cf6e` · milano-responsive-hardening | Ready Preview | ahead by 1 commit | **Safe salvage** | `scripts/validate-responsive-safety.mjs` | its `smoke:responsive` script (referenced a `.ts` not salvaged) | Standalone regression-guard validator; no runtime/product surface. Re-added `validate:responsive-safety` script only. |
| `codex/inject-first-image-into-globe-design-*` and related globe branches | mixed Ready / divergent | large outdated diffs; touches payment/discount routes | **Reject wholesale — audit/cherry-pick only** | none | none | Large stale diffs touching payment/discount routes and dashboard rewrites. Not safe to merge; cherry-pick specific pieces manually in a future scoped PR if a feature is confirmed missing. |
| `claude/funny-maxwell-hlxQN` | mixed Ready / errors | mostly behind / superseded | **Reject wholesale — audit only** | none | none | Most commits already superseded by current main. Only audit for a specific missing file if one surfaces. |
| old jaril / v0 / blocked branches | Blocked / Error | superseded | **Reject** | none | none | Failed builds superseded by later green commits. Do not resurrect. |

## Superseded red deployments (do NOT re-fix)

`92a3d76`, `39f74f3`, `7ff27d8`, `dca8263`, `5005d81` were all superseded by
`5882f4d "Fix production build" (Ready)` and later greens. They are historical
noise, not action items.

## What this PR salvages

1. **Cinematic motion system** — operator-only `/dashboard/motion-preview`
   route + 16 isolated motion components (demo/illustrative, not wired into live
   product routes) + its validator.
2. **Responsive-safety validator** — a standalone regression guard.

Nothing else is merged. Globe/route Codex branches and the old Claude/blocked
branches remain **audit-only**.

## Still not built (next after this)

- Module 3 — Regulated Credentials
- Module 4 — University / Registrar Vertical
- Module 5 — Partner Infrastructure
