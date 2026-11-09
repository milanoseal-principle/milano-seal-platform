begin;
-- Observed counters only. No synthetic uptime, cash, delivery or agent operation.
create function public.governance_health_observation() returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.governance_settings%rowtype;unknown_count integer;overdue integer;reserved bigint;findings text[]:='{}';event_id uuid;recent boolean;
begin
 select * into s from public.governance_settings where id=true for update;
 select count(*) into unknown_count from public.governance_tasks where status in ('UNKNOWN','DEAD_LETTER');
 select count(*) into overdue from public.governance_tasks where status='QUEUED' and created_at<now()-interval '15 minutes';
 select coalesce(sum(reservation),0) into reserved from public.governance_attempts where created_at>=date_trunc('day',now());
 if unknown_count>0 then findings:=array_append(findings,'TASK_OUTCOME_REVIEW_REQUIRED');end if;
 if not s.paused and s.mode<>'DISABLED' and overdue>0 then findings:=array_append(findings,'QUEUE_OVERDUE');end if;
 if reserved>=s.daily_budget*0.8 then findings:=array_append(findings,'DAILY_BUDGET_THRESHOLD');end if;
 select exists(select 1 from public.audit_events where event_type='AI_GOV_HEALTH_OBSERVATION' and created_at>date_trunc('hour',now()) and metadata->'findings'=to_jsonb(findings)) into recent;
 if not recent then
  insert into public.audit_events(event_type,route,metadata) values('AI_GOV_HEALTH_OBSERVATION','governance',jsonb_build_object('findings',findings,'unknown_or_dead_letter',unknown_count,'overdue_queued',overdue,'reserved_micro_usd',reserved,'daily_budget_micro_usd',s.daily_budget,'paused',s.paused,'mode',s.mode)) returning id into event_id;
 end if;
 return jsonb_build_object('findings',findings,'observation_id',event_id,'unknown_or_dead_letter',unknown_count,'overdue_queued',overdue,'reserved_micro_usd',reserved,'daily_budget_micro_usd',s.daily_budget,'paused',s.paused,'mode',s.mode,'observed_at',now(),'notify',event_id is not null and cardinality(findings)>0);
end $$;
revoke all on function public.governance_health_observation() from public,anon,authenticated;
grant execute on function public.governance_health_observation() to service_role;
commit;
