begin;
create or replace function public.require_matter_delivery_release_evidence()
returns trigger language plpgsql security definer set search_path='' as $$
declare release_versions jsonb;
begin
 if not ((new.status is distinct from old.status and new.status in ('in_transit','delivered','completed'))
   or (new.deal_status is distinct from old.deal_status and new.deal_status in ('in_transit','delivered','completed'))) then return new;end if;
 if exists(select 1 from public.compliance_incidents where matter_id=new.id and status not in ('CLOSED','MATTER_RESTORED_OR_CLOSED') and (release_frozen or severity in ('HIGH','CRITICAL'))) then raise exception 'RELEASE_FROZEN';end if;
 select metadata->'document_versions' into release_versions from public.custody_ledger
  where deal_id=new.id and event='DOC_RELEASE_CONFIRMED' and jsonb_typeof(metadata->'document_versions')='array'
  order by created_at desc,id desc limit 1;
 if new.is_paid_and_released is distinct from true or release_versions is null or jsonb_array_length(release_versions)=0
  or exists(select 1 from jsonb_array_elements(release_versions) item
    where not exists(select 1 from public.document_versions v where v.id::text=item->>'version_id' and v.matter_id=new.id
      and v.stage='final_packet' and v.approval_status='release_ready' and v.superseded_by is null and v.file_hash=item->>'sha256'))
  or (select count(*) from public.document_versions where matter_id=new.id and stage='final_packet' and approval_status='release_ready' and superseded_by is null)<>jsonb_array_length(release_versions)
 then raise exception 'CURRENT_EXACT_DOCUMENT_RELEASE_REQUIRED';end if;
 if (new.status in ('delivered','completed') or new.deal_status in ('delivered','completed'))
  and not exists(select 1 from public.custody_ledger where deal_id=new.id and event='DOC_DELIVERED')
 then raise exception 'DELIVERY_CUSTODY_EVIDENCE_REQUIRED';end if;
 return new;
end $$;
revoke all on function public.require_matter_delivery_release_evidence() from public,anon,authenticated;
create trigger require_matter_delivery_release_evidence before update on public.deals
 for each row execute function public.require_matter_delivery_release_evidence();
commit;
