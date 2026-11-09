-- P22: bind authority artifacts to existing immutable versions and release owner.
begin;
create function public.bind_authority_document_evidence() returns trigger
language plpgsql security definer set search_path='' as $$
declare d public.deals%rowtype;p public.document_versions%rowtype;packet jsonb;snapshot jsonb;
begin
 if TG_OP='UPDATE' then
  if new.metadata is distinct from old.metadata then raise exception 'DOCUMENT_VERSION_METADATA_IMMUTABLE';end if;
  return new;
 end if;
 if new.stage not in ('apostille_packet','apostilled') then return new;end if;
 select * into d from public.deals where id=new.matter_id for share;
 select * into p from public.document_versions where id=new.parent_version_id and matter_id=new.matter_id for share;
 if p.id is null or p.approval_status<>'approved' or p.superseded_by is not null or p.file_hash !~ '^[a-f0-9]{64}$' then raise exception 'APPROVED_CURRENT_AUTHORITY_SOURCE_REQUIRED';end if;
 if new.stage='apostille_packet' then
  packet:=d.execution_truth->'authority_packet';
  if nullif(btrim(d.origin_state),'') is null or lower(d.origin_state) in ('unknown','unsure') or nullif(btrim(d.destination_country),'') is null or nullif(btrim(d.document_type),'') is null or lower(d.document_type) in ('unknown','unsure') or lower(d.destination_country) in ('unknown','unsure') then raise exception 'AUTHORITY_MATTER_FACTS_REQUIRED';end if;
  if p.stage not in ('executed','intake_upload') then raise exception 'AUTHORITY_SOURCE_STAGE_REQUIRED';end if;
  if nullif(packet->>'authority_id','') is null or coalesce(packet->>'route_type','') not in ('florida_dos_apostille','florida_dos_notarial_certificate') or nullif(packet->>'dispatch_ready_at','') is null or nullif(packet->>'dispatch_approved_by','') is null
    or not exists(select 1 from public.state_authorities a where a.id::text=packet->>'authority_id' and a.status='VERIFIED' and a.source_verified_at is not null and a.next_review_at>now()) then raise exception 'GOVERNED_AUTHORITY_PACKET_REQUIRED';end if;
  if exists(select 1 from unnest(array['document_count_confirmed','official_form_confirmed','authority_confirmed','fees_confirmed','payment_instrument_confirmed','return_shipping_confirmed','destination_confirmed','paper_out_confirmed']) k where coalesce(packet->'qa'->k,'false'::jsonb)<>'true'::jsonb) then raise exception 'GOVERNED_AUTHORITY_QC_REQUIRED';end if;
  if length(btrim(coalesce(new.metadata->>'submission_reference',''))) not between 3 and 200 then raise exception 'AUTHORITY_SUBMISSION_REFERENCE_REQUIRED';end if;
  snapshot:=jsonb_build_object('matter_id',d.id,'origin',d.origin_state,'destination',d.destination_country,'document_type',d.document_type,'authority_id',packet->>'authority_id','route_type',packet->>'route_type','source_version_id',p.id,'source_sha256',p.file_hash,'submission_reference',new.metadata->>'submission_reference');
 else
  if p.stage<>'apostille_packet' or jsonb_typeof(p.metadata->'authority_evidence') is distinct from 'object' then raise exception 'SUBMITTED_AUTHORITY_VERSION_REQUIRED';end if;
  snapshot:=p.metadata->'authority_evidence';
  if snapshot->>'destination' is distinct from d.destination_country or snapshot->>'origin' is distinct from d.origin_state or snapshot->>'document_type' is distinct from d.document_type then raise exception 'AUTHORITY_FACTS_CHANGED_REVIEW_REQUIRED';end if;
  snapshot:=snapshot||jsonb_build_object('submitted_version_id',p.id,'submitted_sha256',p.file_hash);
 end if;
 new.metadata:=coalesce(new.metadata,'{}')||jsonb_build_object('authority_evidence',snapshot);
 return new;
end $$;
revoke all on function public.bind_authority_document_evidence() from public,anon,authenticated;
create trigger bind_authority_document_evidence before insert or update on public.document_versions for each row execute function public.bind_authority_document_evidence();
create or replace function public.record_document_release(p_actor uuid,p_matter uuid,p_versions uuid[]) returns jsonb
language plpgsql security definer set search_path='' as $$
declare d public.deals%rowtype;version_hashes jsonb;result jsonb;
begin
 perform public.governance_require_actor(p_actor,true);
 select * into d from public.deals where id=p_matter for update;
 if not found then raise exception 'MATTER_NOT_FOUND';end if;
 if d.status not in ('apostille_processing','in_transit','delivered','completed') then raise exception 'EXECUTION_AND_AUTHENTICATION_REVIEW_REQUIRED';end if;
 if d.payment_confirmed is distinct from true or d.payment_status is distinct from 'paid' or d.payment_settlement_status is distinct from 'cleared' or d.amount_due is null or d.amount_due<=0 or d.amount_paid is null or round(d.amount_paid*100)<>round(d.amount_due*100) or (d.final_total is not null and d.final_total>0 and d.amount_paid+case when d.balance_payment_status='paid' and d.balance_paid_at is not null then coalesce(d.balance_amount_received,0) else 0 end=d.final_total) is distinct from true then raise exception 'VERIFIED_SETTLEMENT_AND_ZERO_BALANCE_REQUIRED';end if;
 if exists(select 1 from public.compliance_incidents where matter_id=p_matter and status not in ('CLOSED','MATTER_RESTORED_OR_CLOSED') and (release_frozen or severity in ('HIGH','CRITICAL'))) then raise exception 'RELEASE_FROZEN';end if;
 if p_versions is null or cardinality(p_versions)=0 or cardinality(p_versions)>100 then raise exception 'EXACT_RELEASE_VERSIONS_REQUIRED';end if;
 perform 1 from public.document_versions where id=any(p_versions) for share;
 if (select count(*) from public.document_versions where matter_id=p_matter and stage='final_packet' and approval_status='release_ready')<>cardinality(p_versions) then raise exception 'COMPLETE_RELEASE_VERSION_SET_REQUIRED';end if;
 if (select count(*) from public.document_versions where id=any(p_versions) and matter_id=p_matter and stage='final_packet' and approval_status='release_ready' and file_hash ~ '^[a-f0-9]{64}$' and nullif(coalesce(storage_path,source_file),'') is not null)<>cardinality(p_versions) then raise exception 'RELEASE_VERSION_NOT_APPROVED';end if;
 if lower(coalesce(d.destination_country,'')) like '%italy%' and not exists(select 1 from public.identifier_locks where matter_id=p_matter::text and identifier_type='codice_fiscale' and match_status in ('confirmed','exact_match')) then raise exception 'IDENTIFIER_LOCK_REQUIRED';end if;
 if d.apostille_required is true and exists(
  with recursive lineage(root,id,parent_version_id,stage,approval_status,depth) as (
   select v.id,v.id,v.parent_version_id,v.stage,v.approval_status,0 from public.document_versions v where v.id=any(p_versions)
   union all select child.root,parent.id,parent.parent_version_id,parent.stage,parent.approval_status,child.depth+1 from lineage child join public.document_versions parent on parent.id=child.parent_version_id and parent.matter_id=p_matter where child.depth<50
  ) select 1 from unnest(p_versions) root_id where not exists(select 1 from lineage where root=root_id and stage='apostilled' and approval_status='approved')
 ) then raise exception 'APPROVED_AUTHENTICATION_VERSION_REQUIRED';end if;
 if exists(select 1 from public.document_versions where id=any(p_versions) and superseded_by is not null) then raise exception 'CURRENT_RELEASE_VERSION_REQUIRED';end if;
 perform 1 from public.document_versions where matter_id=p_matter for share;
 if d.apostille_required is true and exists(
  select 1 from public.document_versions final
  left join public.document_versions returned on returned.id=final.parent_version_id
  left join public.document_versions submitted on submitted.id=returned.parent_version_id
  left join public.document_versions source on source.id=submitted.parent_version_id
  where final.id=any(p_versions) and (
   returned.id is null or returned.stage is distinct from 'apostilled' or returned.approval_status is distinct from 'approved' or returned.superseded_by is not null
   or submitted.id is null or submitted.stage is distinct from 'apostille_packet' or submitted.approval_status is distinct from 'approved' or submitted.superseded_by is not null
   or source.id is null or source.approval_status is distinct from 'approved' or source.superseded_by is not null
   or returned.matter_id is distinct from p_matter or submitted.matter_id is distinct from p_matter or source.matter_id is distinct from p_matter
   or returned.metadata->'authority_evidence'->>'matter_id' is distinct from p_matter::text
   or returned.metadata->'authority_evidence'->>'destination' is distinct from d.destination_country
   or returned.metadata->'authority_evidence'->>'origin' is distinct from d.origin_state
   or returned.metadata->'authority_evidence'->>'document_type' is distinct from d.document_type
   or returned.metadata->'authority_evidence'->>'source_version_id' is distinct from source.id::text
   or returned.metadata->'authority_evidence'->>'source_sha256' is distinct from source.file_hash
   or returned.metadata->'authority_evidence'->>'submitted_version_id' is distinct from submitted.id::text
   or returned.metadata->'authority_evidence'->>'submitted_sha256' is distinct from submitted.file_hash
   or nullif(returned.metadata->'authority_evidence'->>'submission_reference','') is null
   or returned.metadata->'authority_evidence'->>'authority_id' is distinct from d.execution_truth->'authority_packet'->>'authority_id'
   or returned.metadata->'authority_evidence'->>'route_type' is distinct from d.execution_truth->'authority_packet'->>'route_type'
  )
 ) then raise exception 'VERIFIED_AUTHORITY_RETURN_LINEAGE_REQUIRED';end if;
 select jsonb_agg(jsonb_build_object('version_id',id,'sha256',file_hash) order by id) into version_hashes from public.document_versions where id=any(p_versions);
 result:=public.append_custody_event(jsonb_build_object('deal_id',p_matter,'event','DOC_RELEASE_CONFIRMED','actor_type','operator','actor_id',p_actor::text,'location',null,'method',null,'status','release_authorized','notes','Exact approved document versions released after canonical gates','metadata',jsonb_build_object('document_versions',version_hashes)),encode(sha256(convert_to(p_matter::text||version_hashes::text,'utf8')),'hex'));
 update public.deals set is_paid_and_released=true where id=p_matter;
 return result;
end $$;
revoke all on function public.record_document_release(uuid,uuid,uuid[]) from public,anon,authenticated;
grant execute on function public.record_document_release(uuid,uuid,uuid[]) to service_role;

commit;
