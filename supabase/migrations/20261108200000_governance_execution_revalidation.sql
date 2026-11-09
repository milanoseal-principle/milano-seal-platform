begin;
-- Forward repair: retain immutable history; revalidate queued authority at claim time.
create or replace function public.governance_claim(p_reservation integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.governance_settings%rowtype;t public.governance_tasks%rowtype;a public.governance_agents%rowtype;approval uuid;reserved integer;budget_blocked boolean:=false;
begin
 select * into s from public.governance_settings where id=true for update;
 if s.paused or s.mode='DISABLED' then return jsonb_build_object('status','PAUSED');end if;
 update public.governance_tasks set status='UNKNOWN',error_code='TIMEOUT_OUTCOME_UNKNOWN',claim_id=null where status='RUNNING' and timeout_at<=now();
 if (select count(*) from public.governance_tasks where status='RUNNING')>=s.concurrency_limit then return jsonb_build_object('status','CONCURRENCY_LIMIT');end if;
 for t in select q.* from public.governance_tasks q join public.governance_agents agent on agent.agent_id=q.agent_id
 where q.status='QUEUED' and q.next_attempt_at<=now() and q.attempt_count<q.max_attempts and agent.enabled
 and (agent.charter->>'charter_version')::int=q.charter_version
 and not exists(select 1 from public.governance_tasks running where running.agent_id=q.agent_id and running.status='RUNNING')
 and not exists(select 1 from unnest(q.dependency_ids) dep where not exists(select 1 from public.governance_tasks completed where completed.id=dep and completed.status='VERIFIED'))
 and ((q.permission=0 and q.agent_id in ('D05','D07')) or not exists(select 1 from public.governance_holds h where h.cleared_at is null and (h.decision_id is null or h.decision_id=q.decision_id)))
 order by q.created_at,q.id for update of q skip locked loop
   approval:=null;
   if not exists(select 1 from auth.users u where u.id=t.created_by and u.raw_app_meta_data->>'role' in ('founder','founder_admin','admin_operator','ops_manager') and coalesce(u.raw_app_meta_data->>'disabled','false')<>'true' and (u.banned_until is null or u.banned_until<=now())) then
     update public.governance_tasks set status='CANCELLED',error_code='CREATOR_AUTHORITY_REVOKED' where id=t.id;continue;
   end if;
   if exists(select 1 from unnest(t.source_ids) ref where (ref like 'report:%' and not exists(select 1 from public.governance_tasks producer where 'report:'||producer.id::text=ref and producer.status in ('COMPLETED','VERIFIED'))) or not exists(select 1 from public.governance_sources src where src.source_id=ref and src.expires_at>now() and src.observed_at<=now())) then
     update public.governance_tasks set status='FAILED',error_code='SOURCE_EXPIRED' where id=t.id;continue;
   end if;
   if t.permission=2 then
     if not public.governance_decision_ready(t.decision_id) then update public.governance_tasks set error_code='DECISION_REVIEW_REQUIRED' where id=t.id;continue;end if;
     if s.mode<>'BOUNDED' then continue;end if;
     select id into approval from public.governance_approvals where task_id=t.id and action_hash=t.action_hash and consumed_at is null and revoked_at is null and expires_at>now() and exists(select 1 from auth.users u where u.id=governance_approvals.actor_id and u.raw_app_meta_data->>'role' in ('founder','founder_admin') and coalesce(u.raw_app_meta_data->>'disabled','false')<>'true' and (u.banned_until is null or u.banned_until<=now())) order by created_at,id limit 1 for update;
     if approval is null then continue;end if;
   end if;
   reserved:=case when t.permission=0 or t.agent_id='B13' or t.payload->>'tool_id'='publish_internal_brief' then 0 else p_reservation end;
   if reserved is null then update public.governance_tasks set error_code='MODEL_UNCONFIGURED' where id=t.id;continue;end if;
   if reserved<0 or reserved>t.cost_limit or reserved+t.cost_reserved>t.cost_limit then update public.governance_tasks set status='DEAD_LETTER',error_code='TASK_BUDGET_EXHAUSTED' where id=t.id;continue;end if;
   if (select coalesce(sum(reservation),0) from public.governance_attempts where created_at>=date_trunc('day',now()))+reserved>s.daily_budget then budget_blocked:=true;continue;end if;
   if approval is not null then update public.governance_approvals set consumed_at=now() where id=approval;end if;
   select * into a from public.governance_agents where agent_id=t.agent_id;
   update public.governance_tasks set status='RUNNING',claim_id=gen_random_uuid(),attempt_count=attempt_count+1,cost_reserved=cost_reserved+reserved,timeout_at=now()+make_interval(secs=>(a.charter->>'timeout')::int) where id=t.id returning * into t;
   insert into public.governance_attempts(claim_id,task_id,reservation) values(t.claim_id,t.id,reserved);
   perform public.governance_audit(null,'CLAIM',t.id::text,jsonb_build_object('agent_id',t.agent_id,'attempt',t.attempt_count,'reservation',reserved,'claim_id',t.claim_id));
   return to_jsonb(t)||jsonb_build_object('reservation',reserved);
 end loop;
 return jsonb_build_object('status',case when budget_blocked then 'DAILY_BUDGET' else 'IDLE' end);
end $$;
create or replace function public.governance_finish(p_task uuid,p_claim uuid,p_output jsonb,p_error text,p_cost integer,p_usage jsonb default '{}'::jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare t public.governance_tasks%rowtype;paused boolean;h text;
begin
 if jsonb_typeof(p_usage) is distinct from 'object' or p_usage - array['provider','model','message_id','input_tokens','output_tokens'] <> '{}'::jsonb or length(p_usage::text)>1000 then raise exception 'INVALID_PROVIDER_USAGE';end if;
 select s.paused into paused from public.governance_settings s where id=true for update;
 select * into t from public.governance_tasks where id=p_task for update;
 if not found or t.status<>'RUNNING' or t.claim_id is distinct from p_claim then raise exception 'CLAIM_NOT_CURRENT';end if;
 if paused or t.timeout_at<=now() or (not(t.permission=0 and t.agent_id in ('D05','D07')) and exists(select 1 from public.governance_holds where cleared_at is null and (decision_id is null or decision_id=t.decision_id))) then p_error:='EXECUTION_INTERRUPTED_UNKNOWN';end if;
 if p_cost is null or p_cost<0 or p_cost>(select reservation from public.governance_attempts where claim_id=p_claim) then p_error:=coalesce(p_error,'COST_OUTCOME_UNKNOWN');if p_error not like '%UNKNOWN%' then p_error:='COST_OUTCOME_UNKNOWN';end if;end if;
 if p_error is not null then
   update public.governance_tasks set status=case when p_error like '%UNKNOWN%' then 'UNKNOWN' when attempt_count>=max_attempts then 'DEAD_LETTER' else 'FAILED' end,error_code=left(p_error,100),claim_id=null,cost_actual=case when p_cost is not null and p_cost>=0 and p_cost<=(select reservation from public.governance_attempts where claim_id=p_claim) then coalesce(cost_actual,0)+p_cost else cost_actual end where id=t.id;
 else
   if t.payload->>'tool_id'='publish_internal_brief' and exists(select 1 from unnest(t.source_ids) ref where ref not like 'report:%' or not exists(select 1 from public.governance_tasks producer where 'report:'||producer.id::text=ref and producer.status='VERIFIED')) then raise exception 'VERIFIED_PACKET_REPORTS_REQUIRED';end if;
   if jsonb_typeof(p_output)<>'object' or p_output->>'schema_version'<>'1' or length(p_output::text)>30000 or p_output - array['schema_version','summary','source_ids','claims','dissent','risks','missing_evidence','forecasts']<>'{}'::jsonb then raise exception 'INVALID_REPORT';end if;
   if exists(select 1 from jsonb_array_elements_text(p_output->'source_ids') src where not src=any(t.source_ids)) then raise exception 'UNSCOPED_REPORT';end if;
   h:=encode(sha256(convert_to(p_output::text,'utf8')),'hex');
   update public.governance_tasks set status='COMPLETED',output=p_output,output_hash=h,cost_actual=coalesce(cost_actual,0)+p_cost,completed_at=now(),claim_id=null where id=t.id;
   insert into public.governance_sources(source_id,sha256,observed_at,expires_at,classification,basis,approved_by,visibility)
   values('report:'||t.id::text,h,now(),now()+interval '30 days','CORPORATE','AGENT_REPORT',t.created_by,t.visibility);
   if t.payload->>'tool_id'='publish_internal_brief' then
     insert into public.governance_packets(task_id,period,report_ids,payload) values(t.id,coalesce(t.payload->>'period','daily'),array(select substring(x from 8)::uuid from unnest(t.source_ids) x where x like 'report:%'),p_output);
   end if;
 end if;
 update public.governance_attempts set actual=case when p_cost>=0 then p_cost else null end,finished_at=now(),error_code=p_error,provider_usage=p_usage where claim_id=p_claim;
 perform public.governance_audit(null,case when p_error is null then 'REPORT_COMPLETED' else 'TASK_FAILED' end,t.id::text,jsonb_build_object('agent_id',t.agent_id,'output_hash',h,'error_code',p_error));
 return jsonb_build_object('task_id',t.id,'recorded',true,'output_hash',h,'status',(select status from public.governance_tasks where id=t.id),'error_code',p_error);
end $$;
-- Finance is an aggregate over canonical settlement facts, never an agent-authored balance.

-- Shared across serverless instances. No IP addresses or request payloads retained.
create table public.governance_request_windows (
 actor_id uuid not null references auth.users(id), bucket text not null check(bucket in ('read','write','run','metrics')),
 window_at timestamptz not null, requests integer not null check(requests>0), primary key(actor_id,bucket)
);
alter table public.governance_request_windows enable row level security;
revoke all on public.governance_request_windows from public,anon,authenticated;
grant select,insert,update on public.governance_request_windows to service_role;
create function public.governance_request_limit(p_actor uuid,p_bucket text) returns boolean
language plpgsql security definer set search_path='' as $$
declare n integer; ceiling integer; window_start timestamptz:=date_trunc('minute',now());
begin
 perform public.governance_require_actor(p_actor,p_bucket in ('run','metrics'));
 ceiling:=case p_bucket when 'read' then 120 when 'write' then 30 when 'run' then 6 when 'metrics' then 6 end;
 if ceiling is null then raise exception 'INVALID_RATE_BUCKET';end if;
 insert into public.governance_request_windows(actor_id,bucket,window_at,requests) values(p_actor,p_bucket,window_start,1)
 on conflict(actor_id,bucket) do update set window_at=excluded.window_at,
 requests=case when governance_request_windows.window_at=excluded.window_at then governance_request_windows.requests+1 else 1 end
 returning requests into n;
 return n<=ceiling;
end $$;
revoke all on function public.governance_request_limit(uuid,text) from public,anon,authenticated;
grant execute on function public.governance_request_limit(uuid,text) to service_role;

commit;
