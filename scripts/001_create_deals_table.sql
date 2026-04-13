-- Milano Seal Deals Table
-- Stores all client intake submissions and execution tracking

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  email text not null,
  phone text,
  country text not null,
  document_type text,
  notes text,
  service_type text not null default 'ron',
  execution_lane text not null default 'signature',
  amount numeric not null default 750,
  status text not null default 'awaiting_payment',
  payment_status text not null default 'pending',
  payment_link text,
  wise_payment_id text,
  followup_24h boolean default false,
  followup_72h boolean default false,
  requires_apostille boolean default false,
  destination_country text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create index for status queries
create index if not exists idx_deals_status on public.deals(status);
create index if not exists idx_deals_created_at on public.deals(created_at);
create index if not exists idx_deals_email on public.deals(email);

-- Enable RLS
alter table public.deals enable row level security;

-- Allow service role full access (for API routes)
create policy "Service role full access" on public.deals
  for all
  using (true)
  with check (true);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_deals_updated on public.deals;

create trigger on_deals_updated
  before update on public.deals
  for each row
  execute function public.handle_updated_at();
