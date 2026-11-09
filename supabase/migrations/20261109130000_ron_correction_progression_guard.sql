-- Forward-only P21 correction: the earlier lifecycle migration is already on main.
begin;
-- Historical completion remains immutable after correction; it is not current authority.
create or replace function public.guard_matter_ron_completion() returns trigger
language plpgsql security definer set search_path='' as $$
declare sid uuid;
begin
 if new.execution_truth->>'execution_method'='ron'
  and (new.status in ('execution_qa','apostille_processing','in_transit','delivered','completed')
       or new.deal_status in ('execution_qa','apostille_processing','in_transit','delivered','completed'))
  and (old.status is distinct from new.status or old.deal_status is distinct from new.deal_status) then
  select id into sid from public.ron_sessions where matter_id=new.id order by created_at desc,id desc limit 1;
  if sid is null or not exists(select 1 from public.ron_sessions s where s.id=sid
    and s.ron_lifecycle_state='COMPLETED'
    and s.milano_ron_status in ('RON_COMPLETED','SIGNED_DOCS_RETRIEVED','READY_FOR_APOSTILLE'))
    or not public.ron_statutory_evidence_verified(sid) then raise exception 'RON_CURRENT_COMPLETION_AND_EVIDENCE_REQUIRED';end if;
 end if;return new;
end $$;
revoke all on function public.guard_matter_ron_completion() from public,anon,authenticated;

commit;
