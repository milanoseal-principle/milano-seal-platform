begin;
-- Reuse the canonical state-event ledger as the durable notification input.
alter table public.messages add column if not exists notification_event_key text;
create unique index messages_notification_event on public.messages(deal_id,notification_event_key) where notification_event_key is not null;
create function public.notification_for_matter_state(p_state text) returns text language sql immutable set search_path='' as $$
 select case p_state when 'intake_received' then 'intake_received' when 'under_review' then 'review_started' when 'quoted' then 'quote_ready' when 'awaiting_payment' then 'payment_instructions_sent' when 'payment_confirmed' then 'payment_cleared' when 'scheduled' then 'execution_scheduled' when 'in_execution' then 'execution_started' when 'apostille_processing' then 'authentication_processing' when 'in_transit' then 'shipped' when 'delivered' then 'delivered' when 'completed' then 'completed' when 'dormant' then 'matter_paused' end
$$;
create function public.pending_matter_notification_events() returns jsonb language sql security definer set search_path='' as $$
 select coalesce(jsonb_agg(to_jsonb(e)),'[]'::jsonb) from (select state.id,state.matter_id,public.notification_for_matter_state(state.new_state) event from public.matter_state_events state where public.notification_for_matter_state(state.new_state) is not null and not exists(select 1 from public.messages m where m.deal_id=state.matter_id and m.notification_event_key=state.id::text) order by state.created_at,state.id limit 50) e
$$;
create function public.queue_matter_notification(p_matter uuid,p_event text,p_subject text,p_body text,p_state_event uuid default null) returns boolean
language plpgsql security definer set search_path='' as $$
declare d public.deals%rowtype;event_id uuid;event_key text;recipient text;kind text;
begin
 select * into d from public.deals where id=p_matter for update;if not found then raise exception 'MATTER_NOT_FOUND';end if;
 if length(p_subject)>200 or length(p_body)>2000 or p_event !~ '^[a-z_]{3,60}$' then raise exception 'INVALID_NOTIFICATION_COPY';end if;
 select id into event_id from public.matter_state_events where matter_id=p_matter and public.notification_for_matter_state(new_state)=p_event and (p_state_event is null or id=p_state_event) order by created_at desc,id desc limit 1;
 if p_state_event is not null and event_id is null then raise exception 'NOTIFICATION_EVENT_MATTER_MISMATCH';end if;
 event_key:=coalesce(event_id::text,'legacy:'||p_event);kind:='lifecycle_'||p_event||'_'||event_key;
 insert into public.messages(deal_id,direction,channel,content,sender_role,sender_name,status,notification_event_key) values(p_matter,'outbound','portal',p_body,'system','The Milano Seal','sent',event_key) on conflict(deal_id,notification_event_key) where notification_event_key is not null do nothing;
 recipient:=lower(btrim(d.email));
 if nullif(recipient,'') is not null then
  insert into public.notifications(deal_id,recipient_email,channel,type,template_id,template_version,subject,message,status,provider,delivery_status,delivery_attempts,idempotency_key,queued_at,metadata)
  values(p_matter,recipient,'email',kind,'canonical_matter_lifecycle_v1','1',p_subject,p_body,'pending','resend','pending',0,p_matter::text||':'||kind||':'||recipient,now(),jsonb_build_object('event',p_event,'state_event_id',event_id,'evidence_scope','provider_acceptance_only')) on conflict(idempotency_key) where idempotency_key is not null do nothing;
 end if;return true;
end $$;
revoke all on function public.pending_matter_notification_events(),public.queue_matter_notification(uuid,text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.pending_matter_notification_events(),public.queue_matter_notification(uuid,text,text,text,uuid) to service_role;
commit;
