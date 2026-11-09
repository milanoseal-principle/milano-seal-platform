begin;
-- Historical versions are retained; new versions must reference the canonical Matter.
alter table public.document_versions add constraint document_version_canonical_matter foreign key(matter_id) references public.deals(id) on delete restrict not valid;
revoke all on public.document_versions from anon,authenticated;
grant select,insert,update on public.document_versions to service_role;
create function public.document_version_custody_event() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='INSERT' then
  perform public.append_custody_event(jsonb_build_object('deal_id',new.matter_id,'event','DOC_CREATED','actor_type','operator','actor_id',new.actor,'location',null,'method',null,'status','pending_review','notes','Immutable document version captured; this is not execution or authority verification','metadata',jsonb_build_object('document_version_id',new.id,'parent_version_id',new.parent_version_id,'sha256',new.file_hash,'stage',new.stage)),'version:'||new.id::text);
 elsif (new.approval_status,new.approved_at,new.approved_by) is distinct from (old.approval_status,old.approved_at,old.approved_by) then
  insert into public.audit_events(event_type,route,metadata) values('SECURITY_DOCUMENT_VERSION_REVIEW',new.matter_id::text,jsonb_build_object('visibility','AUDIT','version_id',new.id,'sha256',new.file_hash,'prior_status',old.approval_status,'new_status',new.approval_status,'reviewed_by',new.approved_by,'reason',new.notes));
 end if;return new;
end $$;
create trigger document_version_custody after insert or update on public.document_versions for each row execute function public.document_version_custody_event();
-- Existing permissive storage policies cannot authorize overwriting or deleting
-- bytes already bound to a version. Service-side captures always use upsert:false.
create function public.document_object_mutation_allowed(p_bucket text,p_name text) returns boolean language sql stable security definer set search_path='' as $$
 select not exists(select 1 from public.document_versions where coalesce(metadata->>'storage_bucket','documents')=p_bucket and (storage_path=p_name or source_file=p_name))
$$;
revoke all on function public.document_object_mutation_allowed(text,text) from public,anon;
grant execute on function public.document_object_mutation_allowed(text,text) to authenticated,service_role;
create policy versioned_document_no_overwrite on storage.objects as restrictive for update to authenticated using(public.document_object_mutation_allowed(bucket_id,name)) with check(public.document_object_mutation_allowed(bucket_id,name));
create policy versioned_document_no_delete on storage.objects as restrictive for delete to authenticated using(public.document_object_mutation_allowed(bucket_id,name));
alter table public.document_versions add column if not exists superseded_by uuid references public.document_versions(id);
create function public.approve_document_version(p_actor uuid,p_version uuid,p_expected_hash text,p_reason text) returns uuid language plpgsql security definer set search_path='' as $$
declare v public.document_versions%rowtype;
begin
 perform public.governance_require_actor(p_actor,true);
 select * into v from public.document_versions where id=p_version;
 if not found then raise exception 'VERSION_NOT_FOUND';end if;
 perform 1 from public.deals where id=v.matter_id for update;
 select * into v from public.document_versions where id=p_version for update;
 if v.file_hash is distinct from p_expected_hash or v.approval_status<>'pending_review' or length(trim(p_reason))<20 then raise exception 'VERSION_REVIEW_TARGET_MISMATCH';end if;
 update public.document_versions set approval_status='superseded',superseded_by=v.id
 where matter_id=v.matter_id and stage=v.stage and id<>v.id and approval_status in ('approved','release_ready') and
 (id=v.parent_version_id or (metadata->>'document_id' is not null and metadata->>'document_id'=v.metadata->>'document_id'));
 update public.document_versions set approval_status=case when stage='final_packet' then 'release_ready' else 'approved' end,approved_at=now(),approved_by=p_actor::text,notes=p_reason where id=v.id;
 insert into public.audit_events(actor_id,event_type,route,metadata) values(p_actor,'SECURITY_DOCUMENT_VERSION_APPROVED',v.matter_id::text,jsonb_build_object('visibility','AUDIT','version_id',v.id,'sha256',v.file_hash,'reason',p_reason));
 return v.id;
end $$;
revoke all on function public.approve_document_version(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.approve_document_version(uuid,uuid,text,text) to service_role;
commit;
