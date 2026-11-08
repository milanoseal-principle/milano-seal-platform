begin;
alter table public.production_certification_runs drop constraint if exists production_certification_runs_environment_check;
alter table public.production_certification_runs add constraint production_certification_runs_environment_check check(environment in ('production','preview'));
create function public.certification_preserve_review() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_TABLE_NAME='production_certification_runs' then
  if TG_OP='DELETE' or (new.id,new.production_sha,new.environment,new.created_by,new.created_at) is distinct from (old.id,old.production_sha,old.environment,old.created_by,old.created_at) or (old.final_decision is not null and to_jsonb(new)<>to_jsonb(old)) then raise exception 'CERTIFICATION_RUN_BINDING_IMMUTABLE';end if;
 else
  if exists(select 1 from public.production_certification_runs where id=new.run_id and final_decision is not null) then raise exception 'FINAL_CERTIFICATION_EVIDENCE_IMMUTABLE';end if;
 end if;
 insert into public.audit_events(actor_id,event_type,route,metadata) values(null,'CERTIFICATION_REVIEW_CHANGE',coalesce(to_jsonb(new)->>'run_id',to_jsonb(new)->>'id'),jsonb_build_object('visibility','AUDIT','prior_sha256',encode(sha256(convert_to(to_jsonb(old)::text,'utf8')),'hex'),'prior_evidence',case when TG_TABLE_NAME='production_certification_evidence' then to_jsonb(old) else null end,'new_sha256',encode(sha256(convert_to(to_jsonb(new)::text,'utf8')),'hex')));
 return new;
end $$;
create trigger certification_run_binding before update or delete on public.production_certification_runs for each row execute function public.certification_preserve_review();
create trigger certification_evidence_history before update on public.production_certification_evidence for each row execute function public.certification_preserve_review();
create function public.finalize_production_certification(p_actor uuid,p_run uuid,p_sha text,p_decision text,p_reason text,p_checks jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r public.production_certification_runs%rowtype;check_item jsonb;e public.production_certification_evidence%rowtype;matter uuid;
begin
 perform public.governance_require_actor(p_actor,true);
 select * into r from public.production_certification_runs where id=p_run for update;
 if not found or r.production_sha is distinct from p_sha or p_sha !~ '^[a-f0-9]{40}$' or p_decision not in ('GO','NO_GO') or length(trim(p_reason))<10 then raise exception 'CERTIFICATION_BINDING_REQUIRED';end if;
 if r.final_decision is not null then if r.final_decision=p_decision then return to_jsonb(r);end if;raise exception 'FINAL_DECISION_IMMUTABLE';end if;
 if p_decision='GO' then
  if jsonb_typeof(p_checks) is distinct from 'array' or jsonb_array_length(p_checks)<100 or (select count(distinct item->>'key') from jsonb_array_elements(p_checks) item)<>jsonb_array_length(p_checks) then raise exception 'COMPLETE_CHECK_CONTRACT_REQUIRED';end if;
  for check_item in select * from jsonb_array_elements(p_checks) loop
   select * into e from public.production_certification_evidence where run_id=p_run and step_key=check_item->>'key' for share;
   if not found or e.result<>'PASS' or nullif(trim(e.evidence_reference),'') is null or nullif(trim(e.authoritative_source),'') is null or e.observed_at is null or e.recorded_by is null then raise exception 'COMPLETE_OBSERVED_EVIDENCE_REQUIRED';end if;
   if check_item->>'matter_continuity'='true' then
    if e.matter_id is null then raise exception 'MATTER_EVIDENCE_REQUIRED';end if;
    if matter is not null and matter<>e.matter_id then raise exception 'MATTER_CONTINUITY_BROKEN';end if;matter:=e.matter_id;
   end if;
  end loop;
 end if;
 update public.production_certification_runs set final_decision=p_decision,status=case p_decision when 'GO' then 'CERTIFIED' else 'FAILED' end,completed_at=now(),updated_at=now() where id=p_run returning * into r;
 insert into public.audit_events(actor_id,event_type,route,metadata) values(p_actor,'CERTIFICATION_HUMAN_FINAL_DECISION',p_run::text,jsonb_build_object('visibility','AUDIT','sha',p_sha,'decision',p_decision,'reason',p_reason));return to_jsonb(r);
end $$;
revoke all on function public.finalize_production_certification(uuid,uuid,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.finalize_production_certification(uuid,uuid,text,text,text,jsonb) to service_role;
create function public.certification_audit_immutable() returns trigger language plpgsql set search_path='' as $$begin if (old.event_type like 'CERTIFICATION_%' or old.event_type like 'SECURITY_%') then raise exception 'CERTIFICATION_AUDIT_IMMUTABLE';end if;if TG_OP='DELETE' then return old;end if;return new;end $$;
create trigger certification_audit_immutable before update or delete on public.audit_events for each row execute function public.certification_audit_immutable();
commit;
