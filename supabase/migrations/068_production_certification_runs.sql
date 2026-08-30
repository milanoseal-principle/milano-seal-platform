create table if not exists public.production_certification_runs (
  id uuid primary key default gen_random_uuid(), production_sha text not null check (length(btrim(production_sha)) > 0), environment text not null default 'production' check (environment = 'production'),
  status text not null default 'OPEN' check (status in ('OPEN','IN_PROGRESS','BLOCKED','READY_FOR_FINAL_REVIEW','CERTIFIED','FAILED')),
  created_by uuid null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), completed_at timestamptz null,
  phase_1_status text not null default 'PENDING', phase_2_status text not null default 'PENDING', phase_2a_status text not null default 'PENDING', phase_3_status text not null default 'PENDING', phase_4_status text not null default 'PENDING', phase_5_status text not null default 'PENDING',
  final_decision text null check (final_decision in ('GO','NO_GO')), notes text null
);

create table if not exists public.production_certification_evidence (
  id uuid primary key default gen_random_uuid(), run_id uuid not null references public.production_certification_runs(id) on delete restrict,
  phase text not null, step_key text not null, result text not null default 'PENDING' check (result in ('PASS','FAIL','PENDING')),
  matter_id uuid null references public.deals(id) on delete restrict, evidence_reference text null, route text null, authoritative_source text null, operator_note text null,
  observed_value jsonb null check (observed_value is null or jsonb_typeof(observed_value) = 'object'), observed_at timestamptz null,
  recorded_by uuid null, recorded_at timestamptz not null default now(), unique (run_id, step_key)
);

alter table public.production_certification_runs enable row level security;
alter table public.production_certification_evidence enable row level security;
revoke all on public.production_certification_runs, public.production_certification_evidence from anon, authenticated;
grant select, insert, update on public.production_certification_runs, public.production_certification_evidence to service_role;

create or replace function public.prevent_certification_evidence_delete() returns trigger language plpgsql security invoker set search_path = public, pg_temp as $$ begin raise exception 'production certification evidence cannot be deleted'; end; $$;
drop trigger if exists production_certification_evidence_no_delete on public.production_certification_evidence;
create trigger production_certification_evidence_no_delete before delete on public.production_certification_evidence for each row execute function public.prevent_certification_evidence_delete();
