-- Milano Seal OS operating spine foundation.
-- Adds compatible production tables without removing existing deal/payment logic.

create extension if not exists "pgcrypto";

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  last_name text,
  email text,
  phone text,
  whatsapp text,
  firm_name text,
  client_type text default 'client',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.matters (
  id uuid primary key default gen_random_uuid(),
  matter_reference text unique not null,
  portal_token text unique not null default encode(gen_random_bytes(24), 'hex'),
  client_id uuid references public.clients(id),
  status text not null default 'intake_received',
  payment_status text not null default 'unpaid',
  release_status text not null default 'locked',
  lane text,
  document_type text,
  document_description text,
  document_count integer default 1,
  signer_count integer default 1,
  notarized_signature_count integer default 1,
  destination_country text,
  origin_state text,
  signer_location text,
  execution_type text,
  apostille_required text,
  translation_required text,
  deadline_date date,
  urgency text,
  referral_source text,
  original_total numeric(12,2) default 0,
  discount_code text,
  discount_type text,
  discount_value numeric(12,2),
  discount_amount numeric(12,2) default 0,
  final_total numeric(12,2) default 0,
  deposit_required boolean default false,
  deposit_amount numeric(12,2) default 0,
  deposit_paid_amount numeric(12,2) default 0,
  balance_due numeric(12,2) default 0,
  amount_received numeric(12,2) default 0,
  payment_method text,
  payment_reference text,
  payment_confirmed_at timestamptz,
  payment_confirmed_by text,
  payment_mismatch_flag boolean default false,
  release_unlocked_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.matter_documents (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid references public.matters(id) on delete cascade,
  file_name text,
  file_url text,
  document_type text,
  status text default 'uploaded',
  uploaded_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.signers (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid references public.matters(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  location text,
  id_verified boolean default false,
  ron_completed boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  type text not null check (type in ('fixed', 'percentage')),
  value numeric(12,2) not null,
  active boolean default true,
  expires_at timestamptz,
  max_uses integer,
  current_use_count integer default 0,
  internal_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.discount_redemptions (
  id uuid primary key default gen_random_uuid(),
  discount_code_id uuid references public.discount_codes(id),
  matter_id uuid references public.matters(id) on delete cascade,
  client_id uuid references public.clients(id),
  original_total numeric(12,2),
  discount_amount numeric(12,2),
  final_total numeric(12,2),
  redeemed_at timestamptz not null default now(),
  redeemed_by text
);

create table if not exists public.payment_records (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid references public.matters(id) on delete cascade,
  payment_type text not null check (payment_type in ('deposit', 'final_balance', 'full_payment')),
  payment_method text default 'Wise',
  payment_reference text,
  amount_due numeric(12,2) not null default 0,
  amount_received numeric(12,2) not null default 0,
  currency text not null default 'USD',
  status text not null default 'pending',
  confirmed_by text,
  confirmed_at timestamptz,
  mismatch_flag boolean default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.execution_records (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid references public.matters(id) on delete cascade,
  execution_type text,
  provider text default 'BlueNotary',
  scheduled_at timestamptz,
  started_at timestamptz,
  ron_completed_at timestamptz,
  status text default 'manual_coordination_required',
  blue_notary_session_id text,
  blue_notary_session_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.apostille_records (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid references public.matters(id) on delete cascade,
  required boolean default false,
  destination_country text,
  origin_state text,
  submitted_at timestamptz,
  received_at timestamptz,
  status text default 'not_started',
  rejection_reason text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shipment_records (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid references public.matters(id) on delete cascade,
  courier text,
  tracking_number text,
  tracking_url text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  status text default 'not_started',
  destination_country text,
  recipient_name text,
  recipient_address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_ledger (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid references public.matters(id) on delete cascade,
  actor_user_id uuid,
  actor_email text,
  event_type text not null,
  status_before text,
  status_after text,
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid references public.matters(id) on delete cascade,
  terms_version text,
  accepted_by_email text,
  accepted_at timestamptz not null default now(),
  ip_address text,
  user_agent text
);

create table if not exists public.relationship_sources (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid references public.matters(id) on delete cascade,
  referral_source text,
  attorney_name text,
  firm_name text,
  country text,
  document_type text,
  conversion_path text,
  created_at timestamptz not null default now()
);

create index if not exists matters_portal_token_idx on public.matters(portal_token);
create index if not exists matters_reference_idx on public.matters(matter_reference);
create index if not exists event_ledger_matter_created_idx on public.event_ledger(matter_id, created_at desc);
