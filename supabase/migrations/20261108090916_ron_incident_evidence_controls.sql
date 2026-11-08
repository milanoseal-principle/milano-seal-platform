begin;
-- Extend the canonical incident and audit records; no second incident authority.
alter table public.compliance_incidents
  add column ron_session_id uuid references public.ron_sessions(id) on delete restrict,
  add column ron_security_evidence jsonb;

create function public.guard_ron_security_incident() returns trigger
language plpgsql security invoker set search_path='' as $$
declare e jsonb; n jsonb; category text;
begin
 if tg_op='DELETE' then
   if old.ron_security_evidence is not null then raise exception 'RON_INCIDENT_HISTORY_IMMUTABLE'; end if;
   return old;
 end if;
 if tg_op='UPDATE' and old.ron_security_evidence is not null and
    (new.discovered_at is distinct from old.discovered_at or new.ron_session_id is distinct from old.ron_session_id
     or new.deal_id is distinct from old.deal_id or new.incident_type is distinct from old.incident_type
     or new.ron_security_evidence is null) then raise exception 'RON_INCIDENT_IDENTITY_IMMUTABLE'; end if;
 if new.ron_security_evidence is null then
  if new.incident_type='RON_SECURITY_COMPROMISE' then raise exception 'RON_INCIDENT_EVIDENCE_REQUIRED'; end if;
  return new;
 end if;
 if coalesce(current_setting('milano.ron_incident_actor',true),'')='' then raise exception 'USE_GOVERNED_RON_INCIDENT_WORKFLOW'; end if;
 e:=new.ron_security_evidence;
 if new.incident_type<>'RON_SECURITY_COMPROMISE' or new.ron_session_id is null or new.deal_id is null
 or not exists(select 1 from public.ron_sessions s where s.id=new.ron_session_id and s.matter_id=new.deal_id)
 or not exists(select 1 from public.deals m where m.id=new.deal_id and upper(m.execution_truth->>'notary_jurisdiction')='FL')
 or new.discovered_at is null or new.discovered_at>clock_timestamp()
 or jsonb_typeof(e)<>'object' or e - array['category','containment','responsible_operator','authority_basis_reference','required_authorities','notifications','remediation_reference','credential_action_reference','closure_reference']<>'{}'::jsonb
 then raise exception 'INVALID_RON_INCIDENT'; end if;
 category:=e->>'category';
 if category is null or category not in ('ELECTRONIC_SEAL','ELECTRONIC_SIGNATURE','RON_CREDENTIALS','JOURNAL','RECORDING','PROVIDER_CREDENTIALS')
 or e->>'containment' is null or e->>'containment' not in ('OPEN','CONTAINED','REMEDIATED')
 or not exists(select 1 from auth.users u where u.id::text=e->>'responsible_operator' and u.raw_app_meta_data->>'role' in ('founder','founder_admin','admin','admin_operator','superadmin','ops_manager') and coalesce(u.raw_app_meta_data->>'disabled','false')<>'true' and (u.banned_until is null or u.banned_until<=now())) or jsonb_typeof(e->'required_authorities') is distinct from 'array'
 or not public.p4_evidence_reference(e->'authority_basis_reference')
 or jsonb_array_length(e->'required_authorities')=0 or jsonb_typeof(e->'notifications') is distinct from 'object'
 then raise exception 'INVALID_RON_INCIDENT_EVIDENCE'; end if;
 if exists(select 1 from jsonb_array_elements(e->'required_authorities') a where jsonb_typeof(a) is distinct from 'string' or a#>>'{}' not in ('FLORIDA_DEPARTMENT_OF_STATE','LAW_ENFORCEMENT'))
 or (select count(distinct a) from jsonb_array_elements_text(e->'required_authorities') a)<>jsonb_array_length(e->'required_authorities')
 or (e->'notifications') - array['FLORIDA_DEPARTMENT_OF_STATE','LAW_ENFORCEMENT']<>'{}'::jsonb
 then raise exception 'INVALID_NOTIFICATION_AUTHORITY'; end if;
 for n in select value from jsonb_each(e->'notifications') loop
  if jsonb_typeof(n)<>'object' or n - array['reference','sent_at']<>'{}'::jsonb
  or not public.p4_evidence_reference(n->'reference')
  or coalesce(n->>'sent_at','')='' or (n->>'sent_at')::timestamptz>clock_timestamp()
  or (n->>'sent_at')::timestamptz<new.discovered_at then raise exception 'NOTIFICATION_EVIDENCE_REQUIRED'; end if;
 end loop;
 if tg_op='UPDATE' and old.ron_security_evidence is not null and
    ((e->'category') is distinct from (old.ron_security_evidence->'category')
     or not ((e->'required_authorities') @> (old.ron_security_evidence->'required_authorities'))
     or not ((e->'notifications') @> (old.ron_security_evidence->'notifications'))) then raise exception 'RON_INCIDENT_EVIDENCE_IMMUTABLE'; end if;
 if new.status in ('CLOSED','RESOLVED','MATTER_RESTORED_OR_CLOSED') then
  if e->>'containment'<>'REMEDIATED' or not public.p4_evidence_reference(e->'remediation_reference')
   or not public.p4_evidence_reference(e->'credential_action_reference') or not public.p4_evidence_reference(e->'closure_reference')
   or exists(select 1 from jsonb_array_elements_text(e->'required_authorities') a where not (e->'notifications' ? a))
  then raise exception 'RON_INCIDENT_CLOSURE_EVIDENCE_REQUIRED'; end if;
 end if;
 return new;
end $$;
create trigger ron_security_incident_guard before insert or update or delete on public.compliance_incidents
for each row execute function public.guard_ron_security_incident();

-- Existing trusted service RPC pattern: never callable by browser roles, actor
-- checked against current auth.users, and audit append is in the same transaction.
create function public.record_ron_security_incident(p_actor uuid,p_incident uuid,p_session uuid,p_detected timestamptz,p_summary text,p_status text,p_evidence jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare s public.ron_sessions%rowtype; prior public.compliance_incidents%rowtype; incident uuid; previous_actor text;
begin
 if not exists(select 1 from auth.users u where u.id=p_actor and u.raw_app_meta_data->>'role' in ('founder','founder_admin','admin','admin_operator','superadmin','ops_manager')
 and coalesce(u.raw_app_meta_data->>'disabled','false')<>'true' and (u.banned_until is null or u.banned_until<=now())) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 select * into s from public.ron_sessions where id=p_session for update;
 if not found then raise exception 'SESSION_NOT_FOUND'; end if;
 if p_summary is null or length(trim(p_summary)) not between 10 and 2000 or p_detected is null or p_status is null or p_status not in ('OPEN','INVESTIGATING','REMEDIATION_IN_PROGRESS','RESOLVED','CLOSED') then raise exception 'INVALID_INCIDENT'; end if;
 select * into prior from public.compliance_incidents where id=p_incident for update;
 if found then
  if prior.ron_session_id is distinct from p_session or prior.discovered_at is distinct from p_detected or prior.ron_security_evidence is null then raise exception 'INCIDENT_CONFLICT'; end if;
  if prior.status=p_status and prior.description=p_summary and prior.ron_security_evidence=p_evidence then return prior.id; end if;
  if prior.status in ('CLOSED','RESOLVED') then raise exception 'INCIDENT_CLOSED'; end if;
  previous_actor:=current_setting('milano.ron_incident_actor',true);
  perform set_config('milano.ron_incident_actor',p_actor::text,true);
  update public.compliance_incidents set status=p_status,description=p_summary,ron_security_evidence=p_evidence,
   resolved_at=case when p_status in ('CLOSED','RESOLVED') then now() end,resolved_by=case when p_status in ('CLOSED','RESOLVED') then p_actor::text end
   where id=p_incident returning id into incident;
 else
  if p_status<>'OPEN' then raise exception 'INCIDENT_MUST_START_OPEN'; end if;
  previous_actor:=current_setting('milano.ron_incident_actor',true);
  perform set_config('milano.ron_incident_actor',p_actor::text,true);
  insert into public.compliance_incidents(id,deal_id,incident_type,severity,status,title,description,discovered_by,discovered_at,freeze_triggered,ron_session_id,ron_security_evidence)
  values(p_incident,s.matter_id,'RON_SECURITY_COMPROMISE','critical','OPEN','RON security compromise',p_summary,p_actor::text,p_detected,true,p_session,p_evidence) returning id into incident;
 end if;
 insert into public.incident_audit_log(incident_id,actor,action,previous_status,new_status,metadata)
 values(incident,p_actor::text,'RON_SECURITY_EVIDENCE_RECORDED',prior.status,p_status,jsonb_build_object('evidence',p_evidence,'detected_at',p_detected,'notification_due_at',p_detected+interval '168 hours'));
 perform set_config('milano.ron_incident_actor',coalesce(previous_actor,''),true);
 return incident;
end $$;
revoke all on function public.record_ron_security_incident(uuid,uuid,uuid,timestamptz,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.record_ron_security_incident(uuid,uuid,uuid,timestamptz,text,text,jsonb) to service_role;
revoke all on function public.guard_ron_security_incident() from public,anon,authenticated;
create index ron_security_incident_deadline on public.compliance_incidents(discovered_at,id)
where ron_security_evidence is not null and status not in ('CLOSED','RESOLVED');
create function public.guard_ron_incident_audit() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if old.action='RON_SECURITY_EVIDENCE_RECORDED' then raise exception 'RON_INCIDENT_AUDIT_IMMUTABLE'; end if;
 if tg_op='DELETE' then return old; end if;
 return new;
end $$;
create trigger ron_incident_audit_immutable before update or delete on public.incident_audit_log
for each row execute function public.guard_ron_incident_audit();
revoke all on function public.guard_ron_incident_audit() from public,anon,authenticated;
commit;
