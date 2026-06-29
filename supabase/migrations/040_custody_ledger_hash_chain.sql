begin;

-- Custody ledger hash-chain hardening.
--
-- lib/custodyLedger.ts appendLedger() writes a SHA-256 hash-linked, tamper-evident
-- chain and inserts the columns: actor_id, method, status, prev_hash, hash. The
-- custody_ledger table (migration 001) was never given those columns, so every
-- appendLedger() insert was rejected by PostgREST ("column does not exist") and
-- silently dropped via the function's non-fatal .catch — the chain-of-custody
-- record was not being persisted. This migration adds the missing columns so the
-- ledger actually records. Additive + idempotent; safe to re-run.
--
-- actor_id is stored as text (the app passes an opaque actor identifier string,
-- which may be a uuid or a system actor label). prev_hash/hash are hex SHA-256
-- digests; the first entry per deal uses prev_hash = 'GENESIS'.

alter table public.custody_ledger
  add column if not exists actor_id  text,
  add column if not exists method    text,
  add column if not exists status    text,
  add column if not exists prev_hash text,
  add column if not exists hash      text;

-- Hash lookups: appendLedger() reads the latest row's hash per deal to chain the
-- next entry; verifyChain() walks rows in order. Index the chain head lookup.
create index if not exists idx_custody_ledger_hash
  on public.custody_ledger(hash);

create index if not exists idx_custody_ledger_deal_created
  on public.custody_ledger(deal_id, created_at desc);

commit;
