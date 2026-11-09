-- Reuse the P5/P7 retention registry; no retention policy durations are invented.
begin;
alter table public.retention_records
 add column if not exists deletion_claim uuid,
 add column if not exists deletion_claimed_at timestamptz,
 add column if not exists deletion_claim_outcome text;
alter table public.retention_records add constraint retention_claim_outcome_check
 check (deletion_claim_outcome is null or deletion_claim_outcome in ('pending','unknown','deleted','not_deleted'));

-- A hold and a deletion claim compete for the same Matter transaction lock.
-- A hold committed first always prevents the claim. After a claim commits,
-- preservation cannot be reported successful while destruction is in flight.
create or replace function public.retention_hold_scope_guard()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform pg_advisory_xact_lock(hashtextextended('retention-matter:'||NEW.matter_id::text,0));
 if NEW.ron_session_id is not null and not exists(select 1 from public.ron_sessions where id=NEW.ron_session_id and matter_id=NEW.matter_id) then raise exception 'HOLD_SESSION_SCOPE_MISMATCH';end if;
 if NEW.retention_record_id is not null and not exists(select 1 from public.retention_records where id=NEW.retention_record_id and matter_id=NEW.matter_id and (NEW.ron_session_id is null or ron_session_id=NEW.ron_session_id)) then raise exception 'HOLD_RECORD_SCOPE_MISMATCH';end if;
 if TG_OP='INSERT' and exists(select 1 from public.retention_records r where r.matter_id=NEW.matter_id and r.deletion_claim_outcome='pending'
   and (NEW.retention_record_id is null or NEW.retention_record_id=r.id)
   and (NEW.ron_session_id is null or NEW.ron_session_id=r.ron_session_id)) then raise exception 'RETENTION_DELETION_IN_PROGRESS';end if;
 if TG_OP='INSERT' and NEW.retention_record_id is not null and exists(select 1 from public.retention_records where id=NEW.retention_record_id and deletion_status='deleted') then raise exception 'RETENTION_RECORD_ALREADY_DELETED';end if;
 return NEW;
end;$$;
revoke all on function public.retention_hold_scope_guard() from public,anon,authenticated;
create trigger aaa_retention_hold_scope before insert or update on public.retention_holds for each row execute function public.retention_hold_scope_guard();

create or replace function public.audit_retention_hold()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 insert into public.audit_events(actor_id,event_type,metadata)
 values(case when TG_OP='INSERT' then NEW.placed_by else NEW.released_by end,
 case when TG_OP='INSERT' then 'RETENTION_HOLD_PLACED' else 'RETENTION_HOLD_RELEASED' end,
 jsonb_build_object('hold_id',NEW.id,'matter_id',NEW.matter_id,'record_id',NEW.retention_record_id,'reason',case when TG_OP='INSERT' then NEW.reason else NEW.release_reason end));
 return NEW;
end;$$;
revoke all on function public.audit_retention_hold() from public,anon,authenticated;
create trigger retention_hold_history after insert or update on public.retention_holds for each row execute function public.audit_retention_hold();

create or replace function public.enforce_retention_record()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  blockers text[];
begin
  if TG_OP = 'DELETE' then
    raise exception using errcode = '42501', message = 'RETENTION_EVIDENCE_IMMUTABLE';
  end if;
  if TG_OP = 'UPDATE' then
    if OLD.deletion_status = 'deleted' then
      raise exception using errcode = '42501', message = 'RETENTION_EVIDENCE_IMMUTABLE';
    end if;
    if OLD.policy_status = 'resolved' and (NEW.retention_class, NEW.record_type, NEW.record_reference, NEW.matter_id,
        NEW.ron_session_id, NEW.retention_start_event, NEW.retention_start_at, NEW.retention_rule, NEW.retention_until, NEW.policy_status)
        is distinct from (OLD.retention_class, OLD.record_type, OLD.record_reference, OLD.matter_id,
        OLD.ron_session_id, OLD.retention_start_event, OLD.retention_start_at, OLD.retention_rule, OLD.retention_until, OLD.policy_status) then
      raise exception using errcode = '42501', message = 'RESOLVED_RETENTION_POLICY_IMMUTABLE';
    end if;
    if NEW.deletion_status in ('authorized','deleted') and NEW.deletion_status is distinct from OLD.deletion_status then
      if NEW.deletion_status='deleted' and (OLD.deletion_claim is null or NEW.deletion_claim is distinct from OLD.deletion_claim
        or not coalesce(OLD.deletion_claim_outcome in ('pending','unknown'),false) or NEW.deletion_claim_outcome is distinct from 'deleted') then
        raise exception 'RETENTION_DELETION_CLAIM_REQUIRED';
      end if;
      blockers := public.retention_deletion_blockers(NEW.id);
      blockers := array_remove(blockers, 'ALREADY_DELETED');
      if NEW.deletion_status='deleted' and OLD.deletion_claim_outcome in ('pending','unknown')
        and OLD.deletion_status='authorized' and OLD.deletion_claim is not null
        and NEW.deletion_claim=OLD.deletion_claim and NEW.deletion_claim_outcome='deleted'
        and nullif(btrim(NEW.deletion_result->>'evidence_reference'),'') is not null then
        -- Persist the truthful outcome of the already-authorized destructive claim.
        -- Newly placed preservation holds remain recorded for remaining evidence.
        blockers:='{}';
      end if;
      if NEW.deletion_status = 'authorized' and (NEW.deletion_authorized_by is null or NEW.deletion_authorized_at is null
          or nullif(btrim(NEW.deletion_reason), '') is null) then
        blockers := blockers || 'DELETION_AUTHORIZATION_MISSING'::text;
      end if;
      if NEW.deletion_status = 'deleted' and (OLD.deletion_status <> 'authorized' or NEW.deleted_by is null
          or NEW.deleted_at is null or NEW.deletion_result is null) then
        blockers := blockers || 'DELETION_AUTHORIZATION_MISSING'::text;
      end if;
      if cardinality(blockers) > 0 then
        raise exception using errcode = '23514', message = 'RETENTION_DELETION_BLOCKED', detail = array_to_string(blockers, ',');
      end if;
    end if;
    NEW.updated_at := now();
  end if;
  return NEW;
end;
$$;
create or replace function public.retention_audit_immutable()
returns trigger language plpgsql set search_path='' as $$begin
 if OLD.event_type like 'RETENTION_%' then raise exception 'RETENTION_HISTORY_IMMUTABLE';end if;
 if TG_OP='DELETE' then return OLD;end if;return NEW;
end;$$;
revoke all on function public.retention_audit_immutable() from public,anon,authenticated;
create trigger retention_audit_immutable before update or delete on public.audit_events for each row execute function public.retention_audit_immutable();

create index if not exists retention_records_matter_keyset_idx on public.retention_records(matter_id,id);
create index if not exists retention_holds_matter_keyset_idx on public.retention_holds(matter_id,id);
create index if not exists retention_history_metadata_idx on public.audit_events using gin(metadata jsonb_path_ops) where event_type like 'RETENTION_HOLD_%';

create or replace function public.retention_command(p_actor uuid,p_operation text,p_id uuid,p_body jsonb default '{}')
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
<<retention_operation>>
declare actor_role text; r public.retention_records%rowtype; h public.retention_holds%rowtype;
 policy public.retention_classes%rowtype; start_at timestamptz;
 reason text:=nullif(btrim(p_body->>'reason'),''); blockers text[]; claim uuid; result jsonb; outcome text; mid uuid;
begin
 select raw_app_meta_data->>'role' into actor_role from auth.users where id=p_actor
   and coalesce(raw_app_meta_data->>'disabled','false')<>'true' and (banned_until is null or banned_until<=now());
 if actor_role is null or actor_role not in ('founder','founder_admin','admin','operator','admin_operator','ops_manager','execution_coordinator','apostille_coordinator','compliance_reviewer') then raise exception using errcode='42501',message='RETENTION_OPERATOR_REQUIRED';end if;
 if reason is null then raise exception 'RETENTION_REASON_REQUIRED';end if;
 if pg_column_size(p_body)>16384 then raise exception 'RETENTION_INPUT_TOO_LARGE';end if;
 if p_operation='approve_class' then
   if actor_role not in ('founder','founder_admin','admin') then raise exception using errcode='42501',message='RETENTION_FOUNDER_REQUIRED';end if;
   select * into policy from public.retention_classes where class_id=p_body->>'class_id' for update;
   if not found then raise exception 'RETENTION_CLASS_UNAVAILABLE';end if;
   if nullif(btrim(p_body->>'basis'),'') is null or nullif(btrim(p_body->>'evidence_reference'),'') is null
     or coalesce((p_body->>'duration_years')::int,0) not between 1 and 100 then raise exception 'RETENTION_APPROVED_POLICY_REQUIRED';end if;
   if policy.policy_status='resolved' then raise exception 'RESOLVED_RETENTION_CLASS_IMMUTABLE';end if;
   update public.retention_classes set duration_years=(p_body->>'duration_years')::int,duration_rule='OWNER_APPROVED',basis=p_body->>'basis',policy_status='resolved' where class_id=policy.class_id;
   insert into public.audit_events(actor_id,actor_role,event_type,metadata) values(p_actor,actor_role,'RETENTION_CLASS_POLICY_APPROVED',p_body||jsonb_build_object('reason',reason));
   return jsonb_build_object('ok',true,'class_id',policy.class_id);
 end if;
 if p_operation='place_hold' then mid:=p_id;
 elsif p_operation='release_hold' then select matter_id into mid from public.retention_holds where id=p_id;
 else select matter_id into mid from public.retention_records where id=p_id;end if;
 if mid is null then raise exception 'RETENTION_TARGET_NOT_FOUND';end if;
 perform pg_advisory_xact_lock(hashtextextended('retention-matter:'||mid::text,0));
 if p_operation='place_hold' then
   insert into public.retention_holds(id,matter_id,ron_session_id,retention_record_id,hold_type,reason,placed_by)
   values(coalesce((p_body->>'idempotency_key')::uuid,gen_random_uuid()),mid,(p_body->>'ron_session_id')::uuid,(p_body->>'retention_record_id')::uuid,coalesce(p_body->>'hold_type','legal'),reason,p_actor)
   on conflict(id) do nothing returning * into h;
   if not found then
     select * into h from public.retention_holds where id=(p_body->>'idempotency_key')::uuid;
     if h.matter_id is distinct from mid or h.placed_by is distinct from p_actor or h.reason is distinct from reason
       or h.ron_session_id is distinct from (p_body->>'ron_session_id')::uuid or h.retention_record_id is distinct from (p_body->>'retention_record_id')::uuid
       or h.hold_type is distinct from coalesce(p_body->>'hold_type','legal') or h.released_at is not null then raise exception 'RETENTION_HOLD_REPLAY_MISMATCH';end if;
   end if;
   return jsonb_build_object('ok',true,'hold_id',h.id);
 end if;
 if actor_role not in ('founder','founder_admin','admin') and p_operation<>'nominate' then raise exception using errcode='42501',message='RETENTION_FOUNDER_REQUIRED';end if;
 if p_operation='release_hold' then
   select * into h from public.retention_holds where id=p_id for update;
   if h.released_at is not null then
     if h.released_by=p_actor and h.release_reason=reason then return jsonb_build_object('ok',true,'duplicate',true);end if;
     raise exception 'HOLD_NOT_ACTIVE';
   end if;
   update public.retention_holds set released_at=clock_timestamp(),released_by=p_actor,release_reason=retention_operation.reason where id=h.id;
   return jsonb_build_object('ok',true);
 end if;
 select * into r from public.retention_records where id=p_id for update;
 if p_operation='resolve_record' then
   select * into policy from public.retention_classes where class_id=r.retention_class;
   if policy.policy_status<>'resolved' or r.policy_status='resolved' then raise exception 'RETENTION_APPROVED_POLICY_REQUIRED';end if;
   start_at:=(p_body->>'start_at')::timestamptz;
   if start_at is null or start_at>clock_timestamp() or nullif(btrim(p_body->>'evidence_reference'),'') is null then raise exception 'RETENTION_START_EVIDENCE_REQUIRED';end if;
   update public.retention_records set retention_start_at=start_at,retention_start_event=policy.start_event,
     retention_rule=policy.duration_rule,retention_until=start_at+make_interval(years=>policy.duration_years),policy_status='resolved' where id=r.id;
   insert into public.audit_events(actor_id,actor_role,event_type,metadata) values(p_actor,actor_role,'RETENTION_RECORD_POLICY_APPROVED',jsonb_build_object('matter_id',mid,'record_id',r.id,'policy_class',policy.class_id,'start_at',start_at,'evidence_reference',p_body->>'evidence_reference','reason',reason));
   return jsonb_build_object('ok',true);
 end if;
 if p_operation in ('nominate','authorize','claim') then
   if r.deletion_claim_outcome in ('pending','unknown') then raise exception 'RETENTION_OUTCOME_REQUIRES_RECONCILIATION';end if;
   blockers:=public.retention_deletion_blockers(r.id);
   if cardinality(blockers)>0 then
     insert into public.retention_deletion_events(retention_record_id,stage,actor_id,actor_role,reason,blockers) values(r.id,'denied',p_actor,actor_role,reason,blockers);
     return jsonb_build_object('ok',false,'code','RETENTION_DELETION_BLOCKED','blockers',blockers);end if;
   if not exists(select 1 from public.retention_classes where class_id=r.retention_class and policy_status='resolved' and deletion_eligible) then raise exception 'RETENTION_CLASS_NOT_DELETION_ELIGIBLE';end if;
   if p_operation='claim' then
     if r.record_reference not like 'storage:%' and nullif(btrim(p_body->>'provider_deletion_evidence_ref'),'') is null then raise exception 'PROVIDER_DELETION_EVIDENCE_REQUIRED';end if;
     if r.deletion_status<>'authorized' or r.deletion_authorized_by is null then raise exception 'DELETION_AUTHORIZATION_MISSING';end if;
     claim:=gen_random_uuid();
     update public.retention_records set deletion_claim=claim,deletion_claimed_at=clock_timestamp(),deletion_claim_outcome='pending' where id=r.id;
     insert into public.retention_deletion_events(retention_record_id,stage,actor_id,actor_role,reason,result)
     values(r.id,'authorized',p_actor,actor_role,reason,jsonb_build_object('claim_id',claim,'action','destruction_claimed'));
     return jsonb_build_object('ok',true,'claim_id',claim,'record_reference',r.record_reference);
   end if;
   update public.retention_records set deletion_status=case when p_operation='authorize' then 'authorized' else 'candidate' end,
     deletion_authorized_by=case when p_operation='authorize' then p_actor else null end,
     deletion_authorized_at=case when p_operation='authorize' then clock_timestamp() else null end,deletion_reason=reason where id=r.id;
   insert into public.retention_deletion_events(retention_record_id,stage,actor_id,actor_role,reason)
   values(r.id,case when p_operation='authorize' then 'authorized' else 'candidate' end,p_actor,actor_role,reason);
   return jsonb_build_object('ok',true,'deletion_status',case when p_operation='authorize' then 'authorized' else 'candidate' end);
 elsif p_operation in ('finish','reconcile') then
   claim:=(p_body->>'claim_id')::uuid;outcome:=p_body->>'outcome';result:=p_body->'result';
   if claim is null or r.deletion_claim is distinct from claim then raise exception 'RETENTION_CLAIM_MISMATCH';end if;
   if outcome is null or outcome not in ('deleted','unknown','not_deleted') or result is null or jsonb_typeof(result)<>'object' then raise exception 'RETENTION_OUTCOME_EVIDENCE_REQUIRED';end if;
   if r.deletion_claim_outcome=outcome and r.deletion_result=result then return jsonb_build_object('ok',true,'duplicate',true,'deletion_status',r.deletion_status);end if;
   if p_operation='finish' and r.deletion_claim_outcome is distinct from 'pending' then raise exception 'RETENTION_CLAIM_NOT_PENDING';end if;
   if p_operation='reconcile' and (not coalesce(r.deletion_claim_outcome in ('pending','unknown'),false) or nullif(btrim(result->>'evidence_reference'),'') is null) then raise exception 'RETENTION_RECONCILIATION_EVIDENCE_REQUIRED';end if;
   if outcome='not_deleted' and p_operation<>'reconcile' then raise exception 'RETENTION_RECONCILIATION_REQUIRED';end if;
   if outcome='deleted' and nullif(btrim(result->>'evidence_reference'),'') is null then raise exception 'DELETION_EVIDENCE_REQUIRED';end if;
   -- The already committed claim is the destructive boundary. A hold may be
   -- added while outcome is unknown; it must not erase truthful deletion evidence.
   update public.retention_records set deletion_claim_outcome=outcome,deletion_result=result,
     deletion_status=case when outcome='deleted' then 'deleted' when outcome='not_deleted' then 'failed' else deletion_status end,
     deleted_by=case when outcome='deleted' then p_actor else null end,
     deleted_at=case when outcome='deleted' then clock_timestamp() else null end where id=r.id;
   insert into public.retention_deletion_events(retention_record_id,stage,actor_id,actor_role,reason,result)
   values(r.id,case when outcome='deleted' then 'deleted' else 'failed' end,p_actor,actor_role,reason,result||jsonb_build_object('claim_id',claim,'outcome',outcome));
   return jsonb_build_object('ok',true,'deletion_status',case when outcome='deleted' then 'deleted' when outcome='not_deleted' then 'failed' else 'authorized' end,'outcome',outcome);
 end if;
 raise exception 'RETENTION_INVALID_ACTION';
end;$$;
revoke all on function public.retention_command(uuid,text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.retention_command(uuid,text,uuid,jsonb) to service_role;
-- Register new canonical evidence in the existing retention registry. Historical
-- rows are not backfilled and no unapproved duration or deletion right is inferred.
create or replace function public.register_canonical_retention_record()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare evidence jsonb:=to_jsonb(NEW);mid uuid;class_key text;reference text;policy public.retention_classes%rowtype;
begin
 mid:=case when TG_TABLE_NAME='deals' then (evidence->>'id')::uuid else coalesce(evidence->>'matter_id',evidence->>'deal_id')::uuid end;
 if mid is null then return NEW;end if;
 class_key:=case TG_TABLE_NAME when 'deals' then 'MATTER_RECORD' when 'files' then 'CLIENT_UPLOAD'
 when 'document_versions' then case when evidence->>'stage'='intake_upload' then 'CLIENT_UPLOAD' else 'EXECUTED_DOCUMENT' end
 when 'matter_financial_artifacts' then 'PAYMENT_RECORD' when 'notifications' then 'NOTIFICATION_RECORD' else 'CUSTODY_EVIDENCE' end;
 reference:=TG_TABLE_NAME||':'||coalesce(evidence->>'id',evidence->>'hash');
 select * into policy from public.retention_classes where class_id=class_key;
 if not found then raise exception 'RETENTION_CLASS_UNAVAILABLE';end if;
 insert into public.retention_records(retention_class,record_type,record_reference,matter_id,retention_start_event,retention_rule,policy_status)
 values(class_key,upper(TG_TABLE_NAME),reference,mid,policy.start_event,policy.duration_rule,'review_required')
 on conflict(retention_class,record_type,record_reference) do nothing;
 return NEW;
end;$$;
revoke all on function public.register_canonical_retention_record() from public,anon,authenticated;
create trigger register_matter_retention after insert on public.deals for each row execute function public.register_canonical_retention_record();
create trigger register_upload_retention after insert on public.files for each row execute function public.register_canonical_retention_record();
create trigger register_version_retention after insert on public.document_versions for each row execute function public.register_canonical_retention_record();
create trigger register_financial_retention after insert on public.matter_financial_artifacts for each row execute function public.register_canonical_retention_record();
create trigger register_notification_retention after insert on public.notifications for each row execute function public.register_canonical_retention_record();
create trigger register_custody_retention after insert on public.custody_ledger for each row execute function public.register_canonical_retention_record();
create trigger register_matter_evidence_retention after insert on public.matter_evidence_ledger for each row execute function public.register_canonical_retention_record();
commit;
