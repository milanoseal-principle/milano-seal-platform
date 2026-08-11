# Supabase Migration Chain — Repair Debt (tracked, separate project)

**Do not repair inside Enterprise Intelligence PRs.** This is infrastructure
hardening for a dedicated branch with a clean shadow database.

## Findings
- **Production does NOT deploy from `supabase/migrations/*`.** Production's
  `schema_migrations` history is the original April set (`01_schema_core`,
  `02_schema_rls`, `03_seed_data`, `add_anon_insert_policy`) plus additive live
  patches (comp columns, status-based payment gate). The repo `001…044` chain is
  a parallel/aspirational set that was never applied end-to-end.
- **A fresh chain fails at migration `002_rls_storage_policies.sql`** (reproduced
  in a local Postgres 16 shadow with Supabase-like roles): `public.files` /
  storage-object ordering and role prerequisites are missing at that point.
- **Migration `044` also needs the status-column guard** from **PR #147**
  (`add column if not exists status/payment_status/payment_confirmed`) — the
  status-based trigger requires `deals.status` which the committed base lacks.

## Constraints for the future repair
- No production rollback is required; no production rows may be modified.
- Repair on a dedicated branch against a clean shadow DB; validate the full chain
  applies before merge.
- PR #147 stays **open and blocked** — do not merge while its required Supabase
  check is red; fold it into the chain repair.

## Impact today
- Non-migration PRs are unaffected (Supabase preview is *skipped*).
- Any PR that touches `supabase/` will show a red Supabase preview until repaired.
