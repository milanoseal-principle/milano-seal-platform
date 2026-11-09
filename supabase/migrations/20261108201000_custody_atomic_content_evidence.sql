begin;
alter table public.custody_ledger add column if not exists payload_canonical text,add column if not exists idempotency_key text;
create unique index custody_event_idempotency on public.custody_ledger(deal_id,idempotency_key) where idempotency_key is not null;
create index if not exists custody_deal_id_page on public.custody_ledger(deal_id,id);
create function public.append_custody_event(p_input jsonb,p_idempotency_key text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare previous text;canonical text;recorded public.custody_ledger%rowtype;existing public.custody_ledger%rowtype;payload jsonb;
begin
 if p_input - array['deal_id','event','actor_type','actor_id','location','method','status','notes','metadata']<>'{}'::jsonb or jsonb_typeof(p_input->'metadata') is distinct from 'object' or length(p_input::text)>30000 or nullif(p_input->>'event','') is null then raise exception 'INVALID_CUSTODY_EVENT';end if;
 perform 1 from public.deals where id=(p_input->>'deal_id')::uuid for update;
 if not found then raise exception 'MATTER_NOT_FOUND';end if;
 if p_idempotency_key is not null then
   if length(p_idempotency_key) not between 1 and 200 then raise exception 'INVALID_IDEMPOTENCY_KEY';end if;
   select * into existing from public.custody_ledger where deal_id=(p_input->>'deal_id')::uuid and idempotency_key=p_idempotency_key;
   if found then
     if existing.payload_canonical::jsonb - array['prev_hash','ts'] <> p_input then raise exception 'CUSTODY_IDEMPOTENCY_CONFLICT';end if;
     return jsonb_build_object('hash',existing.hash,'prev_hash',existing.prev_hash,'duplicate',true);
   end if;
 end if;
 select parent.hash into previous from public.custody_ledger parent where parent.deal_id=(p_input->>'deal_id')::uuid and not exists(select 1 from public.custody_ledger child where child.deal_id=parent.deal_id and child.prev_hash=parent.hash) order by parent.id limit 1;
 if (select count(*) from public.custody_ledger parent where parent.deal_id=(p_input->>'deal_id')::uuid and not exists(select 1 from public.custody_ledger child where child.deal_id=parent.deal_id and child.prev_hash=parent.hash))>1 then raise exception 'CUSTODY_CHAIN_FORK';end if;
 previous:=coalesce(previous,'GENESIS');payload:=p_input||jsonb_build_object('prev_hash',previous,'ts',clock_timestamp());canonical:=payload::text;
 insert into public.custody_ledger(deal_id,event,actor_type,actor_id,location,method,status,notes,metadata,prev_hash,hash,payload_canonical,idempotency_key)
 values((p_input->>'deal_id')::uuid,p_input->>'event',p_input->>'actor_type',p_input->>'actor_id',p_input->>'location',p_input->>'method',p_input->>'status',p_input->>'notes',p_input->'metadata',previous,encode(sha256(convert_to(canonical,'utf8')),'hex'),canonical,p_idempotency_key) returning * into recorded;
 return jsonb_build_object('hash',recorded.hash,'prev_hash',recorded.prev_hash,'id',recorded.id);
end $$;
revoke all on function public.append_custody_event(jsonb,text) from public,anon,authenticated;
grant execute on function public.append_custody_event(jsonb,text) to service_role;
create function public.custody_preserve_history() returns trigger language plpgsql set search_path='' as $$begin raise exception 'CUSTODY_HISTORY_IMMUTABLE';end $$;
create trigger custody_preserve_history before update or delete on public.custody_ledger for each row execute function public.custody_preserve_history();
commit;
