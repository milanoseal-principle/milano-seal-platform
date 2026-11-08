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
commit;
