-- Source-verified receiving-authority requirements (B10).
--
-- public.receiving_authorities carries a few requirement booleans that default to false, so an
-- unverified requirement is indistinguishable from "not required". This child table records each
-- requirement of an existing receiving authority as its own sourced statement. It is not a second
-- authority directory: every row belongs to a receiving_authorities row.
--
-- A statement is REQUIRED, NOT_REQUIRED or CONDITIONAL only with an https source published by the
-- receiving authority or official guidance, the verifying operator and a review date. Anything
-- else is recorded as UNKNOWN. Rows are append-only: a statement is never edited or deleted, it
-- is superseded once and a new one is recorded. Two current statements that disagree are kept
-- and read as a conflict by the application.
--
-- Access is through the server role only. This migration seeds nothing and invents no source.

create table if not exists public.receiving_authority_requirements (
  id uuid primary key default gen_random_uuid(),
  authority_id uuid not null references public.receiving_authorities(id) on delete restrict,
  document_category text not null default '*',
  requirement text not null,
  status text not null,
  detail text,
  source_url text,
  source_type text,
  source_title text,
  verified_at timestamptz,
  verified_by uuid,
  review_due_at timestamptz,
  superseded_at timestamptz,
  superseded_by uuid,
  supersede_reason text,
  created_at timestamptz not null default now(),
  constraint receiving_authority_requirements_category_check check (length(trim(document_category)) > 0),
  constraint receiving_authority_requirements_requirement_check check (requirement in (
    'ORIGINAL_DOCUMENT', 'CERTIFIED_COPY', 'NOTARIAL_ACT', 'RON_ACCEPTANCE', 'WITNESSES',
    'TRANSLATION', 'RECENCY', 'ELECTRONIC_FORMAT', 'PHYSICAL_DELIVERY', 'DESTINATION_FORMALITIES'
  )),
  constraint receiving_authority_requirements_status_check check (status in ('REQUIRED', 'NOT_REQUIRED', 'CONDITIONAL', 'UNKNOWN')),
  constraint receiving_authority_requirements_source_type_check check (source_type is null or source_type in ('RECEIVING_AUTHORITY', 'OFFICIAL_GUIDANCE')),
  constraint receiving_authority_requirements_sourced_check check (
    status = 'UNKNOWN' or (
      source_url ~ '^https://[^[:space:]]+$' and source_type is not null
      and verified_at is not null and verified_by is not null
      and review_due_at is not null and review_due_at > verified_at
    )
  ),
  constraint receiving_authority_requirements_conditional_check check (status <> 'CONDITIONAL' or length(trim(coalesce(detail, ''))) > 0),
  constraint receiving_authority_requirements_supersede_check check (
    (superseded_at is null and superseded_by is null and supersede_reason is null)
    or (superseded_at is not null and superseded_by is not null and length(trim(coalesce(supersede_reason, ''))) > 0)
  )
);

create index if not exists receiving_authority_requirements_current_idx
  on public.receiving_authority_requirements(authority_id, document_category, requirement)
  where superseded_at is null;

create or replace function public.receiving_authority_requirements_append_only()
returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    raise exception using errcode = '42501', message = 'RECEIVING_REQUIREMENT_APPEND_ONLY';
  end if;
  if old.superseded_at is not null
    or new.superseded_at is null
    or (to_jsonb(new) - 'superseded_at' - 'superseded_by' - 'supersede_reason')
       is distinct from (to_jsonb(old) - 'superseded_at' - 'superseded_by' - 'supersede_reason') then
    raise exception using errcode = '42501', message = 'RECEIVING_REQUIREMENT_APPEND_ONLY';
  end if;
  return new;
end;
$$;

drop trigger if exists receiving_authority_requirements_append_only on public.receiving_authority_requirements;
create trigger receiving_authority_requirements_append_only
  before update or delete on public.receiving_authority_requirements
  for each row execute function public.receiving_authority_requirements_append_only();

alter table public.receiving_authority_requirements enable row level security;
revoke all on public.receiving_authority_requirements from public, anon, authenticated;
grant select, insert, update on public.receiving_authority_requirements to service_role;

comment on table public.receiving_authority_requirements is
  'Append-only, source-verified requirement statements for a receiving authority. Missing or UNKNOWN statements block the final route; legacy booleans on receiving_authorities are not evidence.';
