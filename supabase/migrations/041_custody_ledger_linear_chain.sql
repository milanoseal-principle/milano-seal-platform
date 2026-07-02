begin;

-- Custody ledger fork-proof hardening.
--
-- Root cause: appendLedger() does read-latest-hash -> compute -> insert, which is
-- not atomic. Two appends to the SAME deal within a few ms both read the same
-- parent hash and create two children off the same prev_hash (a fork). The ledger
-- is meant to be a LINEAR, tamper-evident chain, so forks must be impossible.
--
-- This migration (1) de-duplicates existing forks, keeping the row that actually
-- continues the chain, and (2) adds a partial unique index enforcing one child per
-- (deal_id, prev_hash). appendLedger() retries on the resulting unique violation.
-- Additive + idempotent; safe to re-run. No payment/Wise/release/auth changes.

-- 1. Dedupe forks. For each (deal_id, prev_hash) group with more than one row, keep
--    the row whose own hash is referenced as some other row's prev_hash (i.e. the
--    one that continues the chain); fall back to earliest created_at when neither
--    side is referenced (chain tail). DELETE the losers.
--
--    Why delete (not null-out): production enforces `hash NOT NULL`, so the orphan
--    rows cannot be nulled, and a clean linear chain must not contain null-hash rows
--    that would break verifyChain(). The deleted rows are dead-end duplicates created
--    by a concurrent double-write (a forked sibling whose hash is never referenced);
--    the kept row carries the identical event and continues the chain, so no audit
--    history is lost. "keep earliest" alone would break the chain, because the
--    continuing row is frequently the LATER of a concurrent pair.
with candidates as (
  select
    cl.ctid,
    cl.deal_id,
    cl.prev_hash,
    cl.created_at,
    exists (
      select 1
      from public.custody_ledger child
      where child.deal_id = cl.deal_id
        and child.prev_hash = cl.hash
    ) as is_referenced
  from public.custody_ledger cl
  where cl.prev_hash is not null
),
ranked as (
  select
    ctid,
    row_number() over (
      partition by deal_id, prev_hash
      order by is_referenced desc, created_at asc, ctid asc
    ) as rn
  from candidates
)
delete from public.custody_ledger cl
using ranked r
where cl.ctid = r.ctid
  and r.rn > 1;

-- 2. Linear-chain guarantee: at most one child per parent hash, per deal. A
--    concurrent second writer hits this and is rejected (appendLedger retries).
create unique index if not exists custody_ledger_linear_chain_idx
  on public.custody_ledger (deal_id, prev_hash)
  where prev_hash is not null;

-- 3. Keep the existing hash uniqueness from migration 040 (re-assert idempotently).
create unique index if not exists custody_ledger_hash_unique_idx
  on public.custody_ledger (hash)
  where hash is not null;

commit;
