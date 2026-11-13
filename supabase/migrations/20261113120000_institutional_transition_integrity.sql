-- B09/B10 forward integrity guard. No row rewrite and no second evidence store.
-- The B08 evaluator still decides the route. This verifies its recorded approval
-- against current canonical event IDs under the Matter row lock at mutation time.
begin;
create or replace function public.institutional_route_is_verified(p_matter uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare r public.matter_evidence_ledger%rowtype; e record; a record;
 required text[]; ids jsonb:='{}'; latest integer; n integer; body jsonb;
begin
 if exists(select 1 from public.matter_evidence_ledger where matter_id=p_matter and source='institutional-evidence-ledger'
 and event_type='INSTITUTIONAL_REVIEW_RECORDED' and (jsonb_typeof(new_value->'version') is distinct from 'number' or coalesce(new_value->>'version','') !~ '^[1-9][0-9]{0,8}$')) then return false;end if;
 select max((new_value->>'version')::integer) into latest from public.matter_evidence_ledger
 where matter_id=p_matter and source='institutional-evidence-ledger' and event_type='INSTITUTIONAL_REVIEW_RECORDED';
 if not exists(select 1 from public.matter_evidence_ledger where matter_id=p_matter and source='institutional-evidence-ledger' and event_type='INSTITUTIONAL_REVIEW_RECORDED') then return true;end if;
 if latest is null or latest<1 then return false;end if;
 select count(*) into n from public.matter_evidence_ledger where matter_id=p_matter and source='institutional-evidence-ledger'
 and event_type='INSTITUTIONAL_REVIEW_RECORDED' and (new_value->>'version')::integer=latest;
 if n<>1 then return false;end if;
 select * into r from public.matter_evidence_ledger where matter_id=p_matter and source='institutional-evidence-ledger'
 and event_type='INSTITUTIONAL_REVIEW_RECORDED' and (new_value->>'version')::integer=latest;
 if not exists(select 1 from public.document_versions d where d.id::text=r.new_value->>'documentVersionId'
   and d.matter_id=p_matter and lower(d.file_hash)=r.new_value->>'documentSha256' and lower(d.file_hash) ~ '^[a-f0-9]{64}$') then return false;end if;
 required:=case r.new_value->>'pathway'
 when 'DIRECT_COMPETENT_AUTHORITY' then array['issuerIdentity','issuerOfficialCapacity','documentEligibility','competentAuthority','receivingAuthority','signatureSealSpecimen']
 when 'HOST_STATE_NOTARIAL_AUTHENTICATION' then array['issuerIdentity','issuerOfficialCapacity','documentEligibility','competentAuthority','receivingAuthority','hostStateNotary']
 when 'DESIGNATED_GOVERNMENT_INTERMEDIARY' then array['issuerIdentity','issuerOfficialCapacity','documentEligibility','competentAuthority','receivingAuthority','designatedIntermediary','signatureSealSpecimen']
 else null end;
 if required is null or exists(select 1 from public.matter_evidence_ledger where matter_id=p_matter and source='institutional-evidence-ledger'
 and event_type='INSTITUTIONAL_ROUTE_REJECTED' and new_value->>'reviewEventId'=r.id::text) then return false;end if;
 for e in select distinct on (new_value->>'key') id,new_value from public.matter_evidence_ledger
 where matter_id=p_matter and source='institutional-evidence-ledger' and event_type='INSTITUTIONAL_EVIDENCE_RECORDED'
 and new_value->>'reviewEventId'=r.id::text order by new_value->>'key',(new_value->>'version')::integer desc loop
   body:=e.new_value;
   if jsonb_typeof(body->'version') is distinct from 'number' or coalesce(body->>'version','') !~ '^[1-9][0-9]{0,8}$' then return false;end if;
   select count(*) into n from public.matter_evidence_ledger where matter_id=p_matter and source='institutional-evidence-ledger'
   and event_type='INSTITUTIONAL_EVIDENCE_RECORDED' and new_value->>'reviewEventId'=r.id::text
   and new_value->>'key'=body->>'key' and (new_value->>'version')::integer=(body->>'version')::integer;
   if n<>1 or (body->>'key'=any(required)) is distinct from true or body->>'state' is distinct from 'verified'
     or nullif(btrim(body->>'source'),'') is null or nullif(body->>'verifiedAt','') is null
     or ((body->>'verifiedAt')::timestamptz at time zone 'UTC')::date>(now() at time zone 'UTC')::date or ((body->>'verifiedAt')::timestamptz at time zone 'UTC')::date<(now() at time zone 'UTC')::date-365
     or (nullif(body->>'expiresAt','') is not null and ((body->>'expiresAt')::timestamptz at time zone 'UTC')::date<(now() at time zone 'UTC')::date) then return false;end if;
   if nullif(body->>'documentVersionId','') is not null and not exists(select 1 from public.document_versions d
     where d.id::text=body->>'documentVersionId' and d.matter_id=p_matter and d.file_hash=body->>'sha256') then return false;end if;
   ids:=ids||jsonb_build_object(body->>'key',e.id::text);
 end loop;
 if (select count(*) from jsonb_object_keys(ids))<>cardinality(required) then return false;end if;
 for a in select l.* from public.matter_evidence_ledger l join auth.users u on u.id=l.actor_id
 where l.matter_id=p_matter and l.source='institutional-evidence-ledger' and l.event_type='INSTITUTIONAL_ROUTE_APPROVED'
 and l.new_value->>'reviewEventId'=r.id::text and l.new_value->'coveredEvidence'=ids
 and coalesce(u.raw_app_meta_data->>'disabled','false')<>'true' and (u.banned_until is null or u.banned_until<=now())
 and u.raw_app_meta_data->>'role' in ('founder','founder_admin','admin','admin_operator','ops_manager','execution_coordinator','apostille_coordinator') for share of u loop
   return true;
 end loop;
 return false;
exception when invalid_text_representation or datetime_field_overflow or invalid_datetime_format or numeric_value_out_of_range then return false;
end;$$;
revoke all on function public.institutional_route_is_verified(uuid) from public,anon,authenticated;
grant execute on function public.institutional_route_is_verified(uuid) to service_role;

create or replace function public.lock_institutional_evidence_matter()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.source='institutional-evidence-ledger' then
   perform 1 from public.deals where id=new.matter_id for update;
 end if;return new;
end;$$;
create trigger lock_institutional_evidence_matter before insert on public.matter_evidence_ledger
for each row execute function public.lock_institutional_evidence_matter();
revoke all on function public.lock_institutional_evidence_matter() from public,anon,authenticated;

create or replace function public.enforce_institutional_progression()
returns trigger language plpgsql security definer set search_path='' as $$
declare protected boolean;
begin
 protected:=(new.status is distinct from old.status or new.deal_status is distinct from old.deal_status)
 and (new.status in ('scheduled','in_execution','apostille_processing','in_transit','delivered','completed')
 or new.deal_status in ('scheduled','in_execution','apostille_processing','in_transit','delivered','completed'));
 protected:=protected or (new.is_paid_and_released is true and old.is_paid_and_released is distinct from true)
 or ((new.execution_truth->'authority_packet'->'assembled_at' is distinct from old.execution_truth->'authority_packet'->'assembled_at') and new.execution_truth->'authority_packet'->>'assembled_at' is not null)
 or ((new.execution_truth->'authority_packet'->'qa' is distinct from old.execution_truth->'authority_packet'->'qa') and new.execution_truth->'authority_packet'->'qa' is not null)
 or ((new.execution_truth->'authority_packet'->'dispatch_ready_at' is distinct from old.execution_truth->'authority_packet'->'dispatch_ready_at') and new.execution_truth->'authority_packet'->>'dispatch_ready_at' is not null);
 if protected and not public.institutional_route_is_verified(new.id) then
   raise exception using errcode='23514',message='INSTITUTIONAL_ROUTE_NOT_VERIFIED';
 end if;return new;
end;$$;
create trigger enforce_institutional_progression before update on public.deals
for each row execute function public.enforce_institutional_progression();
revoke all on function public.enforce_institutional_progression() from public,anon,authenticated;

-- CHECK accepts NULL unless explicitly excluded. Preserve old rows for review;
-- new inserts/updates must actually provide the claimed official source.
alter table public.receiving_authority_requirements drop constraint receiving_authority_requirements_sourced_check;
alter table public.receiving_authority_requirements add constraint receiving_authority_requirements_sourced_check check (
 status='UNKNOWN' or (source_url is not null and source_url ~ '^https://[^[:space:]]+$' and source_type is not null
 and verified_at is not null and verified_by is not null and review_due_at is not null and review_due_at>verified_at)
) not valid;
commit;
