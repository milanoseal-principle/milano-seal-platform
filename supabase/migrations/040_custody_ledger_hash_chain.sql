begin;

-- Custody ledger hash-chain hardening (dedupe-safe).
--
-- lib/custodyLedger.ts appendLedger() writes a SHA-256 hash-linked, tamper-evident
-- chain and inserts: actor_id, method, status, prev_hash, hash. The custody_ledger
-- table (migration 001) was never given those columns, so every appendLedger()
-- insert was rejected ("column does not exist") and silently dropped — the
-- chain-of-custody record was not persisted. This migration adds the columns and
-- (because a duplicate hash already exists from earlier partial state) de-duplicates
-- before enforcing a partial unique index. Additive + idempotent; safe to re-run.
--
-- NOTE ON actor_id TYPE: actor_id is TEXT, not uuid. appendLedger() passes an opaque
-- actor identifier that is frequently a system/operator LABEL ("wise-webhook") or an
-- email (founder confirm-payment, final release), not a uuid. A uuid column would
-- reject those values and re-break the custody write for webhook/operator actors.
-- If production applied this column as uuid, convert it (lossless — column is all
-- NULL): alter table public.custody_ledger alter column actor_id type text;

alter table public.custody_ledger
  add column if not exists actor_id  text,
  add column if not exists method    text,
  add column if not exists status    text,
  add column if not exists prev_hash text,
  add column if not exists hash      text;

-- De-duplicate any pre-existing duplicate hashes before the unique index. Keep the
-- earliest row per hash; null out the hash/prev_hash on later duplicates and tag
-- them so the chain can be rebuilt without losing the row.
with ranked_duplicates as (
  select
    ctid,
    hash,
    row_number() over (
      partition by hash
      order by ctid
    ) as rn
  from public.custody_ledger
  where hash is not null
)
update public.custody_ledger cl
set
  hash = null,
  prev_hash = null,
  status = coalesce(cl.status, 'historical_dedupe'),
  method = coalesce(cl.method, 'migration_040_dedupe')
from ranked_duplicates rd
where cl.ctid = rd.ctid
  and rd.rn > 1;

update public.custody_ledger
set status = coalesce(status, 'recorded')
where status is null;

-- Indexes: chain-head lookup, plus actor/status/method/prev_hash query paths.
create index if not exists custody_ledger_actor_id_idx
  on public.custody_ledger (actor_id);

create index if not exists custody_ledger_status_idx
  on public.custody_ledger (status);

create index if not exists custody_ledger_method_idx
  on public.custody_ledger (method);

create index if not exists custody_ledger_prev_hash_idx
  on public.custody_ledger (prev_hash);

create index if not exists idx_custody_ledger_deal_created
  on public.custody_ledger (deal_id, created_at desc);

-- Hash is unique only where present (dedup nulled the collisions above).
drop index if exists public.custody_ledger_hash_unique_idx;

create unique index custody_ledger_hash_unique_idx
  on public.custody_ledger (hash)
  where hash is not null;

commit;
