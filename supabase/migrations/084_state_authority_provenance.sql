begin;

-- 084_state_authority_provenance.sql
-- Source-backed U.S. state (issuing-side) authority provenance and the official
-- authority asset registry. Additive and idempotent.
--
-- This is NOT a hardcoded 50-state legal matrix. No rule facts are seeded:
-- every rule field defaults to 'unknown' and every seeded record starts as
-- REVIEW_REQUIRED. Only an official government source, recorded by an
-- operator, may carry status VERIFIED (enforced by constraint below).
-- Destination-side receiving authorities remain in public.receiving_authorities.

create table if not exists public.state_authorities (
  id uuid primary key default gen_random_uuid(),
  state_code text not null,
  authority_name text not null,
  authority_type text not null,
  official_source_url text,
  official_source_title text,
  ron_supported_by_state_notary text not null default 'unknown',
  electronic_document_submission_status text not null default 'unknown',
  papering_out_rule text not null default 'unknown',
  county_clerk_pre_authentication text not null default 'unknown',
  competent_authority text,
  apostille_submission_method text not null default 'unknown',
  state_fee numeric(10,2),
  state_fee_currency text not null default 'USD',
  source_verified_at timestamptz,
  next_review_at timestamptz,
  confidence text not null default 'UNVERIFIED',
  status text not null default 'REVIEW_REQUIRED',
  review_notes text,
  verified_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint state_authorities_state_code_check check (state_code ~ '^[A-Z]{2}$'),
  constraint state_authorities_authority_type_check check (
    authority_type in ('secretary_of_state', 'state_notary_commission', 'county_clerk', 'other')
  ),
  constraint state_authorities_ron_check check (
    ron_supported_by_state_notary in ('supported', 'not_supported', 'unknown')
  ),
  constraint state_authorities_electronic_submission_check check (
    electronic_document_submission_status in ('accepted', 'not_accepted', 'unknown')
  ),
  constraint state_authorities_papering_out_check check (
    papering_out_rule in ('permitted', 'not_permitted', 'unknown')
  ),
  constraint state_authorities_county_clerk_check check (
    county_clerk_pre_authentication in ('required', 'not_required', 'unknown')
  ),
  constraint state_authorities_submission_method_check check (
    apostille_submission_method in ('mail', 'in_person', 'mail_or_in_person', 'electronic', 'unknown')
  ),
  constraint state_authorities_state_fee_check check (state_fee is null or state_fee >= 0),
  constraint state_authorities_confidence_check check (
    confidence in ('OFFICIAL_SOURCE', 'OPERATOR_CONFIRMED', 'THIRD_PARTY', 'MODEL_GENERATED', 'UNVERIFIED')
  ),
  constraint state_authorities_status_check check (
    status in ('VERIFIED', 'REVIEW_REQUIRED', 'STALE', 'INSUFFICIENT_EVIDENCE')
  ),
  -- Only an official government source, verified by an operator with a review
  -- window, may be VERIFIED. Third-party and model-generated facts never are.
  constraint state_authorities_verified_requires_official_source check (
    status <> 'VERIFIED' or (
      confidence in ('OFFICIAL_SOURCE', 'OPERATOR_CONFIRMED')
      and official_source_url is not null
      and lower(official_source_url) ~ '^https://([a-z0-9-]+\.)*([a-z0-9-]+\.gov|state\.[a-z]{2}\.us)(/.*)?$'
      and source_verified_at is not null
      and next_review_at is not null
      and next_review_at > source_verified_at
      and verified_by is not null
    )
  )
);

create unique index if not exists state_authorities_state_type_name_uidx
  on public.state_authorities(state_code, authority_type, authority_name);
create index if not exists state_authorities_status_idx
  on public.state_authorities(status);

create table if not exists public.authority_source_assets (
  id uuid primary key default gen_random_uuid(),
  authority_id uuid not null references public.state_authorities(id) on delete restrict,
  state_code text not null,
  asset_type text not null,
  title text not null,
  purpose text,
  repository_path text,
  official_source_url text,
  source_version text,
  source_date date,
  verified_at timestamptz,
  verified_by uuid,
  status text not null default 'REVIEW_REQUIRED',
  sha256 text,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint authority_source_assets_state_code_check check (state_code ~ '^[A-Z]{2}$'),
  constraint authority_source_assets_asset_type_check check (
    asset_type in ('official_form', 'instruction_sheet', 'fee_schedule', 'submission_guide', 'authority_notice', 'other')
  ),
  constraint authority_source_assets_status_check check (
    status in ('ACTIVE', 'SUPERSEDED', 'REVIEW_REQUIRED')
  ),
  constraint authority_source_assets_sha256_check check (sha256 is null or sha256 ~ '^[0-9a-f]{64}$'),
  -- An official form must be the unmodified official file: it needs its
  -- official source and a content hash. Milano never generates a substitute.
  constraint authority_source_assets_official_form_provenance check (
    asset_type <> 'official_form' or (
      official_source_url is not null
      and lower(official_source_url) ~ '^https://([a-z0-9-]+\.)*([a-z0-9-]+\.gov|state\.[a-z]{2}\.us)(/.*)?$'
      and sha256 is not null
    )
  )
);

-- At most one ACTIVE asset per authority, type and purpose.
create unique index if not exists authority_source_assets_active_uidx
  on public.authority_source_assets(authority_id, asset_type, coalesce(purpose, ''))
  where status = 'ACTIVE';
create index if not exists authority_source_assets_state_idx
  on public.authority_source_assets(state_code, asset_type, status);

alter table public.state_authorities enable row level security;
alter table public.authority_source_assets enable row level security;

drop policy if exists state_authorities_operator_read on public.state_authorities;
create policy state_authorities_operator_read on public.state_authorities
  for select to authenticated
  using (
    (auth.jwt() -> 'app_metadata' ->> 'role') in
      ('founder','founder_admin','admin','admin_operator','operator','superadmin','ops_manager','execution_coordinator','apostille_coordinator')
  );
drop policy if exists state_authorities_service_all on public.state_authorities;
create policy state_authorities_service_all on public.state_authorities
  for all to service_role using (true) with check (true);

drop policy if exists authority_source_assets_operator_read on public.authority_source_assets;
create policy authority_source_assets_operator_read on public.authority_source_assets
  for select to authenticated
  using (
    (auth.jwt() -> 'app_metadata' ->> 'role') in
      ('founder','founder_admin','admin','admin_operator','operator','superadmin','ops_manager','execution_coordinator','apostille_coordinator')
  );
drop policy if exists authority_source_assets_service_all on public.authority_source_assets;
create policy authority_source_assets_service_all on public.authority_source_assets
  for all to service_role using (true) with check (true);

-- Registration of the Florida Department of State authority and its official
-- Apostille / Notarial Certificate Request form, committed unmodified at the
-- repository root. No rule facts are asserted: the authority remains
-- REVIEW_REQUIRED until an operator verifies current Florida DOS sources, and
-- the asset carries no verified_at until an operator confirms the hash
-- against the official file.
insert into public.state_authorities (
  state_code, authority_name, authority_type, official_source_url, official_source_title,
  competent_authority, confidence, status, review_notes
) values (
  'FL',
  'Florida Department of State, Division of Corporations',
  'secretary_of_state',
  'https://files.floridados.gov/media/702388/1-apostille_and_notarial_certificate_request_form-10-19-2023.pdf',
  'Apostille and Notarial Certificate Request Form',
  'Florida Department of State, Division of Corporations',
  'UNVERIFIED',
  'REVIEW_REQUIRED',
  'Registered from the official request-form URL. Rule fields (RON, electronic submission, papering out, submission method, fee) require operator verification against current Florida DOS sources.'
)
on conflict (state_code, authority_type, authority_name) do nothing;

insert into public.authority_source_assets (
  authority_id, state_code, asset_type, title, purpose, repository_path,
  official_source_url, source_version, source_date, status, sha256
)
select
  sa.id,
  'FL',
  'official_form',
  'Apostille and Notarial Certificate Request Form',
  'Apostille / Notarial Certificate Request',
  '1-apostille_and_notarial_certificate_request_form-10-19-2023.pdf',
  'https://files.floridados.gov/media/702388/1-apostille_and_notarial_certificate_request_form-10-19-2023.pdf',
  '10-19-2023',
  date '2023-10-19',
  'ACTIVE',
  '403aedc99dfea348f8392709f5ea63aa2af7d5836d91f498c354f70f3d3a9752'
from public.state_authorities sa
where sa.state_code = 'FL'
  and sa.authority_type = 'secretary_of_state'
  and sa.authority_name = 'Florida Department of State, Division of Corporations'
  and not exists (
    select 1 from public.authority_source_assets a
    where a.authority_id = sa.id and a.sha256 = '403aedc99dfea348f8392709f5ea63aa2af7d5836d91f498c354f70f3d3a9752'
  );

-- Florida paper-out control: operator checklist recorded atomically in
-- canonical execution truth (execution_truth.paper_out) with evidence-ledger
-- entries. The checklist never asserts Florida DOS acceptance.
create or replace function public.record_matter_paper_out(
  p_matter_id uuid,
  p_expected_updated_at timestamptz,
  p_action text,
  p_items jsonb,
  p_actor_id uuid,
  p_occurred_at timestamptz,
  p_reason text
)
returns table (matter jsonb, evidence_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_matter public.deals%rowtype;
  v_truth jsonb;
  v_paper jsonb;
  v_prior jsonb;
  v_items jsonb;
  v_key text;
  v_value text;
  v_event text;
  v_evidence_id uuid;
  v_required text[] := array[
    'original_electronic_record_retained',
    'tamper_evidence_reviewed',
    'executed_electronic_record_confirmed',
    'paper_conversion_procedure_confirmed',
    'statutory_certificate_completed',
    'destination_confirmed',
    'receiving_authority_reviewed',
    'florida_dos_requirements_reviewed'
  ];
begin
  if p_action not in ('generate', 'confirm', 'approve') then
    raise exception using errcode = '22023', message = 'INVALID_PAPER_OUT_ACTION';
  end if;

  select * into v_matter from public.deals where id = p_matter_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'MATTER_NOT_FOUND'; end if;
  if v_matter.updated_at is distinct from p_expected_updated_at then
    raise exception using errcode = '40001', message = 'STALE_MATTER_STATE';
  end if;

  v_truth := coalesce(v_matter.execution_truth, '{}'::jsonb);
  v_prior := v_truth->'paper_out';
  v_paper := coalesce(v_prior, '{}'::jsonb);

  if p_action = 'generate' then
    if v_prior is not null then
      raise exception using errcode = '22023', message = 'PAPER_OUT_ALREADY_GENERATED';
    end if;
    v_paper := jsonb_build_object(
      'generated_at', p_occurred_at,
      'generated_by', p_actor_id,
      'items', '{}'::jsonb
    );
    v_event := 'PAPER_OUT_CHECKLIST_GENERATED';
  elsif p_action = 'confirm' then
    if v_prior is null then
      raise exception using errcode = '22023', message = 'PAPER_OUT_NOT_GENERATED';
    end if;
    if v_paper ? 'operator_approved_at' then
      raise exception using errcode = '22023', message = 'PAPER_OUT_ALREADY_APPROVED';
    end if;
    if p_items is null or jsonb_typeof(p_items) <> 'object' or p_items = '{}'::jsonb then
      raise exception using errcode = '22023', message = 'EMPTY_PAPER_OUT_ITEMS';
    end if;
    v_items := coalesce(v_paper->'items', '{}'::jsonb);
    for v_key, v_value in select key, value #>> '{}' from jsonb_each(p_items) loop
      if not (v_key = any(v_required)) then
        raise exception using errcode = '22023', message = 'INVALID_PAPER_OUT_ITEM';
      end if;
      if v_value = 'not_applicable' and v_key <> 'statutory_certificate_completed' then
        raise exception using errcode = '22023', message = 'PAPER_OUT_ITEM_NOT_OPTIONAL';
      end if;
      if v_value not in ('confirmed', 'not_applicable') then
        raise exception using errcode = '22023', message = 'INVALID_PAPER_OUT_VALUE';
      end if;
      v_items := v_items || jsonb_build_object(v_key, jsonb_build_object(
        'status', v_value, 'recorded_at', p_occurred_at, 'recorded_by', p_actor_id
      ));
    end loop;
    v_paper := v_paper || jsonb_build_object('items', v_items);
    v_event := 'PAPER_OUT_ITEMS_CONFIRMED';
  else
    if v_prior is null then
      raise exception using errcode = '22023', message = 'PAPER_OUT_NOT_GENERATED';
    end if;
    if v_paper ? 'operator_approved_at' then
      raise exception using errcode = '22023', message = 'PAPER_OUT_ALREADY_APPROVED';
    end if;
    foreach v_key in array v_required loop
      if coalesce(v_paper->'items'->v_key->>'status', '') not in ('confirmed', 'not_applicable') then
        raise exception using errcode = '22023', message = 'PAPER_OUT_INCOMPLETE';
      end if;
    end loop;
    v_paper := v_paper || jsonb_build_object(
      'operator_approved_at', p_occurred_at,
      'operator_approved_by', p_actor_id
    );
    v_event := 'PAPER_OUT_OPERATOR_APPROVED';
  end if;

  update public.deals
  set execution_truth = v_truth || jsonb_build_object('paper_out', v_paper),
      last_activity = p_occurred_at,
      updated_at = p_occurred_at
  where id = p_matter_id
  returning * into v_matter;

  insert into public.matter_evidence_ledger (
    matter_id, event_type, domain, actor_type, actor_id, occurred_at, source,
    source_reference, prior_value, new_value, reason, metadata
  ) values (
    p_matter_id, v_event, 'apostille_authentication', 'operator', p_actor_id,
    p_occurred_at, 'operator_paper_out_checklist', coalesce(v_matter.deal_id, p_matter_id::text),
    coalesce(v_prior, '{}'::jsonb), v_paper, p_reason,
    jsonb_build_object('action', p_action)
  ) returning id into v_evidence_id;

  return query select to_jsonb(v_matter), v_evidence_id;
end;
$$;

revoke all on function public.record_matter_paper_out(uuid, timestamptz, text, jsonb, uuid, timestamptz, text) from public, anon, authenticated;
grant execute on function public.record_matter_paper_out(uuid, timestamptz, text, jsonb, uuid, timestamptz, text) to service_role;

comment on table public.state_authorities is
  'Source-backed U.S. state authority provenance. VERIFIED only from an official government source recorded by an operator.';
comment on table public.authority_source_assets is
  'Official authority assets (unmodified official files) tracked by source URL, version, and SHA-256. Milano never generates substitutes.';

commit;
