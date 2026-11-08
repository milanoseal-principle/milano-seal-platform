begin;
alter table public.document_versions add column if not exists parent_version_id uuid references public.document_versions(id);
create function public.document_version_integrity_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='DELETE' then raise exception 'DOCUMENT_VERSION_HISTORY_IMMUTABLE';end if;
 if TG_OP='UPDATE' and (new.id,new.matter_id,new.file_hash,new.stage,new.source_file,new.actor,new.created_at,new.storage_path,new.file_size_bytes,new.mime_type,new.parent_version_id) is distinct from (old.id,old.matter_id,old.file_hash,old.stage,old.source_file,old.actor,old.created_at,old.storage_path,old.file_size_bytes,old.mime_type,old.parent_version_id) then raise exception 'DOCUMENT_VERSION_BYTES_IMMUTABLE';end if;
 if new.parent_version_id is not null and not exists(select 1 from public.document_versions parent where parent.id=new.parent_version_id and parent.matter_id=new.matter_id and parent.id<>new.id) then raise exception 'DOCUMENT_LINEAGE_MATTER_MISMATCH';end if;
 return new;
end $$;
create trigger document_version_integrity before insert or update or delete on public.document_versions for each row execute function public.document_version_integrity_guard();
create function public.record_document_release(p_actor uuid,p_matter uuid,p_versions uuid[]) returns jsonb
language plpgsql security definer set search_path='' as $$
declare d public.deals%rowtype;version_hashes jsonb;result jsonb;
begin
 perform public.governance_require_actor(p_actor,true);
 select * into d from public.deals where id=p_matter for update;
 if not found then raise exception 'MATTER_NOT_FOUND';end if;
 if d.payment_confirmed is distinct from true or d.payment_status is distinct from 'paid' or d.payment_settlement_status is distinct from 'cleared' or d.amount_due is null or d.amount_due<=0 or d.amount_paid is null or round(d.amount_paid*100)<>round(d.amount_due*100) or (d.final_total is not null and d.final_total>0 and d.amount_paid+case when d.balance_payment_status='paid' and d.balance_paid_at is not null then coalesce(d.balance_amount_received,0) else 0 end=d.final_total) is distinct from true then raise exception 'VERIFIED_SETTLEMENT_AND_ZERO_BALANCE_REQUIRED';end if;
 if exists(select 1 from public.compliance_incidents where matter_id=p_matter and status not in ('CLOSED','MATTER_RESTORED_OR_CLOSED') and (release_frozen or severity in ('HIGH','CRITICAL'))) then raise exception 'RELEASE_FROZEN';end if;
 if p_versions is null or cardinality(p_versions)=0 or cardinality(p_versions)>100 then raise exception 'EXACT_RELEASE_VERSIONS_REQUIRED';end if;
 perform 1 from public.document_versions where id=any(p_versions) for share;
 if (select count(*) from public.document_versions where matter_id=p_matter and stage='final_packet' and approval_status='release_ready')<>cardinality(p_versions) then raise exception 'COMPLETE_RELEASE_VERSION_SET_REQUIRED';end if;
 if (select count(*) from public.document_versions where id=any(p_versions) and matter_id=p_matter and stage='final_packet' and approval_status='release_ready' and file_hash ~ '^[a-f0-9]{64}$' and nullif(coalesce(storage_path,source_file),'') is not null)<>cardinality(p_versions) then raise exception 'RELEASE_VERSION_NOT_APPROVED';end if;
 if lower(coalesce(d.destination_country,'')) like '%italy%' and not exists(select 1 from public.identifier_locks where matter_id=p_matter::text and identifier_type='codice_fiscale' and match_status in ('confirmed','exact_match')) then raise exception 'IDENTIFIER_LOCK_REQUIRED';end if;
 select jsonb_agg(jsonb_build_object('version_id',id,'sha256',file_hash) order by id) into version_hashes from public.document_versions where id=any(p_versions);
 result:=public.append_custody_event(jsonb_build_object('deal_id',p_matter,'event','DOC_RELEASE_CONFIRMED','actor_type','operator','actor_id',p_actor::text,'location',null,'method',null,'status','release_authorized','notes','Exact approved document versions released after canonical gates','metadata',jsonb_build_object('document_versions',version_hashes)),encode(sha256(convert_to(p_matter::text||version_hashes::text,'utf8')),'hex'));
 return result;
end $$;
revoke all on function public.record_document_release(uuid,uuid,uuid[]) from public,anon,authenticated;
grant execute on function public.record_document_release(uuid,uuid,uuid[]) to service_role;
-- Existing courier optimizer: recheck canonical truth in the same transaction
-- as its persisted shipment claim, after rate lookup and before spending.
create function public.claim_final_delivery_label(p_actor uuid,p_matter uuid,p_shipment uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare d public.deals%rowtype;claimed uuid;
begin
 perform public.governance_require_actor(p_actor,false);
 select * into d from public.deals where id=p_matter for update;
 if d.id is null or d.payment_confirmed is distinct from true or d.payment_status is distinct from 'paid' or d.payment_settlement_status is distinct from 'cleared' or d.amount_due is null or d.amount_due<=0 or d.amount_paid is null or round(d.amount_paid*100)<>round(d.amount_due*100) or d.final_total is null or d.final_total<=0 or (d.amount_paid+case when d.balance_payment_status='paid' and d.balance_paid_at is not null then coalesce(d.balance_amount_received,0) else 0 end)<>d.final_total then raise exception 'VERIFIED_FULL_PAYMENT_REQUIRED';end if;
 if exists(select 1 from public.compliance_incidents where matter_id=p_matter and status not in ('CLOSED','MATTER_RESTORED_OR_CLOSED') and (release_frozen or severity in ('HIGH','CRITICAL'))) then raise exception 'RELEASE_FROZEN';end if;
 if not exists(select 1 from public.custody_ledger where deal_id=p_matter and event='DOC_RELEASE_CONFIRMED' and jsonb_typeof(metadata->'document_versions')='array') then raise exception 'EXACT_DOCUMENT_RELEASE_REQUIRED';end if;
 update public.shippo_shipments set rate_status='SHIPPING_READY_FOR_LABEL',updated_at=now() where id=p_shipment and matter_id=p_matter and rate_status='SHIPPING_RATE_SELECTED' and shippo_transaction_id is null returning id into claimed;
 if claimed is null then raise exception 'SHIPMENT_LABEL_NOT_CLAIMABLE';end if;
 return claimed;
end $$;
revoke all on function public.claim_final_delivery_label(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.claim_final_delivery_label(uuid,uuid,uuid) to service_role;

-- Serialize incident/hold changes with the same canonical Matter release lock.
create function public.lock_incident_matter() returns trigger language plpgsql set search_path='' as $$begin if new.matter_id is not null then perform 1 from public.deals where id=new.matter_id for update;end if;return new;end $$;
create trigger serialize_incident_matter before insert or update on public.compliance_incidents for each row execute function public.lock_incident_matter();
commit;
