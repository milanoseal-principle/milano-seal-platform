-- Milano Seal — Verification Records
-- Phase B: Public custody verification layer
-- DO NOT APPLY until operator clears in Supabase dashboard.

create table if not exists public.verification_records (
  id uuid primary key default gen_random_uuid(),
  verification_id text unique not null,     -- public-facing slug e.g. "MS-2026-ABCD1234"
  matter_id uuid,                            -- internal reference only, never exposed publicly
  custody_ledger_hash text not null,         -- SHA-256 of matter_id + released_at + document_count
  document_count integer not null default 1,
  destination_country text,
  document_type text,
  release_status text not null default 'VALID'
    check (release_status in ('VALID', 'REVOKED', 'EXPIRED')),
  released_at timestamptz,
  generated_by text,                         -- operator email or "system"
  expires_at timestamptz,                    -- null = no expiry
  revoked_at timestamptz,
  revocation_reason text,
  public_summary text,                       -- client-safe summary shown on verification page
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Fast public lookup by verification_id
create index if not exists idx_verification_records_vid
  on public.verification_records(verification_id);

-- Fast lookup by hash
create index if not exists idx_verification_records_hash
  on public.verification_records(custody_ledger_hash);

-- Verification access log (anonymized)
create table if not exists public.verification_logs (
  id uuid primary key default gen_random_uuid(),
  verification_id text not null,
  accessed_at timestamptz not null default now(),
  viewer_type text default 'public',        -- 'public', 'partner', 'operator'
  access_context text                       -- 'web', 'api', 'qr_scan'
  -- No IP, no PII stored
);

create index if not exists idx_verification_logs_vid
  on public.verification_logs(verification_id);

-- RLS
alter table public.verification_records enable row level security;
alter table public.verification_logs enable row level security;

-- Public can read VALID records (not REVOKED)
create policy "public_read_valid_verification"
  on public.verification_records for select
  using (release_status = 'VALID');

-- Service role has full access
create policy "service_role_full_access_verification"
  on public.verification_records for all
  to service_role using (true);

create policy "service_role_full_access_logs"
  on public.verification_logs for all
  to service_role using (true);

-- Operator note for applying this migration:
-- Run in Supabase SQL Editor AFTER smoke test confirms production deploy is stable.
-- This table requires no foreign key to matters table (intentional — public isolation).
