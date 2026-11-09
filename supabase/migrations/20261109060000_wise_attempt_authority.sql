-- Additive attempt binding; no historical/customer data rewritten.
-- Apply only after hosted provenance review and explicit migration approval.
begin;
alter table public.deals
  add column if not exists payment_attempt_id uuid,
  add column if not exists payment_attempt_started_at timestamptz,
  add column if not exists wise_provider_evidence jsonb;
create index if not exists matter_evidence_wise_resource_idx
 on public.matter_evidence_ledger(source_reference, event_type)
 where source='wise-attempt-authority';

-- Canonical evidence projection is populated only by the service RPC below.
create or replace function public.current_wise_attempt_evidence(d public.deals)
returns boolean language sql stable set search_path='' as $$
 select coalesce(d.payment_attempt_id is not null and d.payment_attempt_started_at is not null
 and d.wise_provider_evidence->>'attempt_id'=d.payment_attempt_id::text
 and d.wise_provider_evidence->>'matter_id'=d.id::text
 and nullif(btrim(d.wise_transaction_reference),'') is not null
 and d.wise_provider_evidence->>'resource_id'=d.wise_transaction_reference
 and d.payment_funding_method='wise_acquiring_payment'
 and d.wise_provider_evidence->>'status' in ('IN_PROGRESS','UPCOMING','COMPLETED','SETTLED')
 and (d.wise_provider_evidence->>'occurred_at')::timestamptz>=d.payment_attempt_started_at
 and d.amount_due>0 and d.amount_due::text not in ('NaN','Infinity','-Infinity')
 and (d.wise_provider_evidence->>'amount')::numeric=d.amount_due
 and nullif(btrim(d.currency),'') is not null
 and upper(btrim(d.wise_provider_evidence->>'currency'))=upper(btrim(d.currency))
 and nullif(btrim(d.wise_provider_evidence->>'reference'),'') is not null
 and d.wise_provider_evidence->>'reference'=coalesce(nullif(btrim(d.wise_reference),''),d.deal_id)
 and not exists(select 1 from public.matter_evidence_ledger l where l.source='wise-attempt-authority'
   and l.matter_id=d.id and l.event_type='WISE_ATTEMPT_INVALIDATED'
   and l.metadata->>'attempt_id'=d.payment_attempt_id::text),false);
$$;
revoke all on function public.current_wise_attempt_evidence(public.deals) from public,anon,authenticated;
grant execute on function public.current_wise_attempt_evidence(public.deals) to service_role;

-- Invalidation from any existing writer revokes authority atomically and keeps
-- historical references in the existing append-only ledger, including legacy rows.
create or replace function public.invalidate_wise_attempt_authority()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare resource text; attempt uuid;
begin
 if lower(coalesce(NEW.payment_settlement_status,'')) in ('failed','cancelled','expired','reversed','voided','refunded','rejected','revoked','superseded')
 or lower(coalesce(NEW.payment_status,'')) in ('failed','refunded') then
   resource:=coalesce(nullif(NEW.wise_transaction_reference,''),OLD.wise_transaction_reference,NEW.wise_provider_evidence->>'resource_id');
   attempt:=coalesce(NEW.payment_attempt_id,OLD.payment_attempt_id);
   if resource is not null and not exists(select 1 from public.matter_evidence_ledger where source='wise-attempt-authority' and event_type='WISE_ATTEMPT_INVALIDATED' and source_reference=resource and matter_id=NEW.id and metadata->>'attempt_id' is not distinct from attempt::text) then
     insert into public.matter_evidence_ledger(matter_id,event_type,domain,actor_type,source,source_reference,prior_value,new_value,metadata)
     values(NEW.id,'WISE_ATTEMPT_INVALIDATED','payment','system','wise-attempt-authority',resource,OLD.wise_provider_evidence,NEW.wise_provider_evidence,
       jsonb_build_object('attempt_id',attempt,'status',NEW.payment_settlement_status));
   end if;
   NEW.wise_transaction_reference:=null;NEW.payment_funding_method:=null;NEW.payment_confirmed:=false;
   NEW.wise_provider_evidence:=null;
 elsif NEW.payment_observed_at is distinct from OLD.payment_observed_at and NEW.payment_attempt_id is not distinct from OLD.payment_attempt_id then
   NEW.wise_transaction_reference:=null;NEW.payment_funding_method:=null;NEW.wise_provider_evidence:=null;
 end if;
 return NEW;
end;$$;
revoke all on function public.invalidate_wise_attempt_authority() from public,anon,authenticated;
create trigger aaa_wise_attempt_invalidation before update on public.deals
 for each row execute function public.invalidate_wise_attempt_authority();

create or replace function public.begin_wise_payment_attempt(p_deal_id uuid,p_handoff_id uuid,p_actor_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare d public.deals%rowtype; h public.matter_evidence_ledger%rowtype; a uuid; t timestamptz:=clock_timestamp();
begin
 select * into d from public.deals where id=p_deal_id for update;
 if not found then raise exception 'MATTER_NOT_FOUND';end if;
 if not exists(select 1 from auth.users u where u.id=p_actor_id and lower(btrim(u.email))=lower(btrim(d.email)) and (u.banned_until is null or u.banned_until<=now())) then raise exception 'MATTER_OWNER_REQUIRED';end if;
 if cardinality(public.missing_required_policy_acceptances(d.id,'wise_payment_submission'))>0 then raise exception 'POLICY_ACCEPTANCE_REQUIRED';end if;
 if d.payment_confirmed is true then raise exception 'PAYMENT_ALREADY_CONFIRMED';end if;
 if coalesce(d.amount_paid,0)<>0 then raise exception 'PAYMENT_REVIEW_REQUIRED';end if;
 select * into h from public.matter_evidence_ledger where id=p_handoff_id and matter_id=d.id
   and actor_id=p_actor_id and event_type='WISE_PAYMENT_HANDOFF_OPENED';
 if not found or h.occurred_at<t-interval '4 hours' or h.occurred_at>t then raise exception 'CURRENT_HANDOFF_REQUIRED';end if;
 -- Replays return the original observation, never rotate an invalidated attempt.
 if exists(select 1 from public.matter_evidence_ledger where provider_event_id='wise-submission:'||h.id::text) then
   if d.payment_attempt_id=h.id and d.payment_settlement_status='observed_pending' then return to_jsonb(d);end if;
   raise exception 'HANDOFF_ALREADY_CONSUMED';
 end if;
 if d.payment_attempt_id is not null and d.payment_settlement_status='observed_pending'
   and d.payment_observed_amount=d.amount_due and upper(d.payment_observed_currency)=upper(d.currency)
   and d.payment_observed_reference=coalesce(nullif(btrim(d.wise_reference),''),d.deal_id) then return to_jsonb(d);end if;
 if d.payment_link is null or d.payment_link !~ '^https://([A-Za-z0-9-]+\.)*(wise\.com|transferwise\.com)/' then raise exception 'SECURE_WISE_LINK_REQUIRED';end if;
 if d.amount_due is null or d.amount_due<=0 or d.amount_due::text in ('NaN','Infinity','-Infinity')
 or (h.metadata->>'amountDue')::numeric is distinct from d.amount_due
 or upper(h.metadata->>'currency') is distinct from upper(btrim(d.currency))
 or h.metadata->>'wiseReference' is distinct from coalesce(nullif(btrim(d.wise_reference),''),d.deal_id)
 or h.metadata->>'paymentUrlFingerprint' is distinct from encode(sha256(convert_to(d.payment_link,'UTF8')),'hex')
 then raise exception 'HANDOFF_SNAPSHOT_MISMATCH';end if;
 if exists(select 1 from public.matter_evidence_ledger where matter_id=d.id and event_type='WISE_ATTEMPT_INVALIDATED' and occurred_at>=h.occurred_at)
 then raise exception 'FRESH_HANDOFF_REQUIRED';end if;
 a:=h.id;
 -- Retain pre-hardening invalid resource evidence without retaining its authority.
 if nullif(btrim(d.wise_transaction_reference),'') is not null then
   insert into public.matter_evidence_ledger(matter_id,event_type,domain,actor_type,source,source_reference,prior_value,metadata)
   values(d.id,'WISE_ATTEMPT_INVALIDATED','payment','system','wise-attempt-authority',d.wise_transaction_reference,jsonb_build_object('resource_id',d.wise_transaction_reference,'funding_method',d.payment_funding_method),jsonb_build_object('attempt_id',d.payment_attempt_id,'status','SUPERSEDED'));
 end if;
 update public.deals set payment_attempt_id=a,payment_attempt_started_at=h.occurred_at,
 wise_provider_evidence=null,wise_transaction_reference=null,payment_funding_method=null,
 payment_status='unpaid',payment_confirmed=false,payment_settlement_status='observed_pending',payment_observed_at=t,
 payment_observed_amount=d.amount_due,payment_observed_currency=d.currency,
 payment_observed_reference=coalesce(nullif(btrim(d.wise_reference),''),d.deal_id),updated_at=t
 where id=d.id returning * into d;
 insert into public.matter_evidence_ledger(matter_id,event_type,domain,actor_type,actor_id,occurred_at,source,evidence_reference,correlation_id,provider_event_id,metadata)
 values(d.id,'WISE_PAYMENT_SUBMISSION_CONFIRMED_BY_CLIENT','payment','client',p_actor_id,t,'portal-payment-confirmation',h.id::text,h.correlation_id,'wise-submission:'||h.id::text,
 jsonb_build_object('attempt_id',a,'amountDue',d.amount_due,'currency',d.currency,'wiseReference',d.wise_reference));
 return to_jsonb(d);
end;$$;
revoke all on function public.begin_wise_payment_attempt(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.begin_wise_payment_attempt(uuid,uuid,uuid) to service_role;

create or replace function public.record_wise_attempt_evidence(
 p_deal_id uuid,p_attempt_id uuid,p_resource_id text,p_status text,p_occurred_at timestamptz,
 p_amount numeric,p_currency text,p_reference text,p_source text default 'wise-activity',p_event_id text default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare d public.deals%rowtype; e jsonb; terminal boolean; prior public.matter_evidence_ledger%rowtype; event_key text;
begin
 if nullif(btrim(p_resource_id),'') is null then raise exception 'PROVIDER_RESOURCE_REQUIRED';end if;
 -- Serializes cross-Matter resource claims as well as same-Matter retries.
 perform pg_advisory_xact_lock(hashtextextended('wise-resource:'||p_resource_id,0));
 select * into d from public.deals where id=p_deal_id for update;
 if not found or p_attempt_id is null or d.payment_attempt_id is distinct from p_attempt_id then raise exception 'CURRENT_ATTEMPT_REQUIRED';end if;
 if p_occurred_at is null or p_occurred_at<d.payment_attempt_started_at or p_occurred_at>clock_timestamp() then raise exception 'STALE_PROVIDER_EVENT';end if;
 if p_amount is null or p_amount<=0 or p_amount::text in ('NaN','Infinity','-Infinity') or p_amount is distinct from d.amount_due
 or nullif(btrim(p_currency),'') is null or upper(btrim(p_currency)) is distinct from upper(btrim(d.currency))
 or nullif(btrim(p_reference),'') is null or p_reference is distinct from coalesce(nullif(btrim(d.wise_reference),''),d.deal_id)
 then raise exception 'PROVIDER_SCOPE_MISMATCH';end if;
 if p_status is null or p_source is null or p_status not in ('IN_PROGRESS','UPCOMING','COMPLETED','SETTLED','REQUIRES_ATTENTION','UNKNOWN','CANCELLED','FAILED','VOIDED','EXPIRED','REVERSED','REFUNDED','REJECTED','REVOKED','SUPERSEDED')
 or p_source not in ('wise-activity','wise-statement','wise-webhook')
 or (p_status='SETTLED' and p_source='wise-activity') then raise exception 'INVALID_PROVIDER_STATUS_OR_SOURCE';end if;
 terminal:=p_status in ('CANCELLED','FAILED','VOIDED','EXPIRED','REVERSED','REFUNDED','REJECTED','REVOKED','SUPERSEDED');
 if exists(select 1 from public.matter_evidence_ledger l where l.source='wise-attempt-authority' and l.source_reference=p_resource_id
   and (l.matter_id<>d.id or l.metadata->>'attempt_id' is distinct from p_attempt_id::text)) then raise exception 'PROVIDER_RESOURCE_ALREADY_BOUND';end if;
 if exists(select 1 from public.matter_evidence_ledger l where l.source='wise-attempt-authority' and l.source_reference=p_resource_id and l.event_type='WISE_ATTEMPT_INVALIDATED') then
   if terminal then return jsonb_build_object('accepted',false,'duplicate',true);end if;
   raise exception 'PROVIDER_RESOURCE_INVALIDATED';
 end if;
 -- An attempt invalidation is sticky, even if a later event names another resource.
 if exists(select 1 from public.matter_evidence_ledger where matter_id=d.id and source='wise-attempt-authority' and event_type='WISE_ATTEMPT_INVALIDATED' and metadata->>'attempt_id'=p_attempt_id::text) then raise exception 'ATTEMPT_INVALIDATED';end if;
 e:=jsonb_build_object('attempt_id',p_attempt_id,'matter_id',d.id,'resource_id',p_resource_id,'status',p_status,'occurred_at',p_occurred_at,'amount',p_amount,'currency',upper(btrim(p_currency)),'reference',p_reference,'source',p_source);
 event_key:=case when p_source='wise-webhook' and nullif(p_event_id,'') is not null
   then 'wise-attempt-webhook:'||p_event_id else 'wise-attempt:'||encode(sha256(convert_to(e::text,'UTF8')),'hex') end;
 select * into prior from public.matter_evidence_ledger where provider_event_id=event_key;
 if found then
   if prior.new_value is distinct from e or prior.matter_id<>d.id then raise exception 'PROVIDER_EVENT_REPLAY_MISMATCH';end if;
   return jsonb_build_object('accepted',true,'duplicate',true);
 end if;
 -- Terminal invalidation wins over an older positive event; positives never regress.
 if not terminal and d.wise_provider_evidence is not null and
 ((d.wise_provider_evidence->>'occurred_at')::timestamptz>p_occurred_at or d.wise_provider_evidence->>'status'='SETTLED')
 then return jsonb_build_object('accepted',false,'stale',true);end if;
 if not terminal and d.payment_settlement_status in ('failed','refunded') then raise exception 'ATTEMPT_INVALIDATED';end if;
 insert into public.matter_evidence_ledger(matter_id,event_type,domain,actor_type,occurred_at,source,source_reference,provider_event_id,prior_value,new_value,metadata)
 values(d.id,case when terminal then 'WISE_ATTEMPT_INVALIDATED' else 'WISE_ATTEMPT_PROVIDER_EVIDENCE' end,'payment','provider',p_occurred_at,'wise-attempt-authority',p_resource_id,event_key,d.wise_provider_evidence,e,e||jsonb_build_object('provider_event_id',p_event_id));
 update public.deals set wise_provider_evidence=e,
 wise_transaction_reference=case when terminal then null else p_resource_id end,
 payment_funding_method=case when terminal then null else 'wise_acquiring_payment' end,
 payment_settlement_status=case when terminal then 'failed' when p_status in ('REQUIRES_ATTENTION','UNKNOWN') then 'mismatch_review' when payment_confirmed then payment_settlement_status else 'observed_pending' end,
 payment_confirmed=case when terminal then false else payment_confirmed end,
 payment_status=case when terminal then case when p_status in ('REFUNDED','REVERSED') then 'refunded' else 'failed' end else payment_status end,
 updated_at=clock_timestamp() where id=d.id;
 return jsonb_build_object('accepted',true,'duplicate',false);
end;$$;
revoke all on function public.record_wise_attempt_evidence(uuid,uuid,text,text,timestamptz,numeric,text,text,text,text) from public,anon,authenticated;
grant execute on function public.record_wise_attempt_evidence(uuid,uuid,text,text,timestamptz,numeric,text,text,text,text) to service_role;

create or replace function public.check_payment_gate()
returns trigger language plpgsql set search_path=public,pg_temp as $$
declare
 settlement_verified boolean;
 observed_valid boolean;
 provider_valid boolean;
 target text;
begin
 settlement_verified := NEW.payment_confirmed is true
   and NEW.payment_status = 'paid' and NEW.payment_settlement_status = 'cleared'
   and NEW.amount_due > 0 and NEW.amount_paid > 0
   and NEW.amount_due::text not in ('NaN', 'Infinity', '-Infinity')
   and NEW.amount_paid::text not in ('NaN', 'Infinity', '-Infinity')
   and round(NEW.amount_paid * 100) = round(NEW.amount_due * 100);
 observed_valid := NEW.payment_confirmed is false and NEW.payment_status in ('unpaid','pending')
   and coalesce(NEW.amount_paid,0)=0 and NEW.payment_settlement_status='observed_pending'
   and NEW.payment_observed_at is not null and NEW.amount_due>0
   and NEW.amount_due::text not in ('NaN', 'Infinity', '-Infinity')
   and NEW.payment_observed_amount is not null and NEW.payment_observed_amount=NEW.amount_due
   and nullif(btrim(NEW.currency),'') is not null
   and nullif(btrim(NEW.payment_observed_currency),'') is not null
   and upper(btrim(NEW.payment_observed_currency))=upper(btrim(NEW.currency))
   and nullif(btrim(NEW.payment_observed_reference),'') is not null
   and btrim(NEW.payment_observed_reference)=coalesce(nullif(btrim(NEW.wise_reference),''),NEW.deal_id);
 provider_valid := observed_valid and public.current_wise_attempt_evidence(NEW);
 -- Exact settlement advances an awaiting-payment Matter once; never regress
 -- an already scheduled/executing Matter when the later settlement arrives.
 if TG_OP='UPDATE' and settlement_verified and NEW.status='awaiting_payment' then
   NEW.status:='payment_confirmed'; NEW.deal_status:='payment_confirmed';
 end if;
 -- Financial failures/refunds must remain recordable without forcing a stage.
 if TG_OP='UPDATE' and NEW.status is not distinct from OLD.status
   and NEW.deal_status is not distinct from OLD.deal_status then return NEW;end if;
 foreach target in array array[NEW.status,NEW.deal_status] loop
   if target='scheduled' then
     if not coalesce(settlement_verified or observed_valid,false) then raise exception 'PAYMENT_REQUIRED: canonical Wise scheduling authority required';end if;
   elsif target in ('in_execution','apostille_processing') then
     if not coalesce(settlement_verified or provider_valid,false) then raise exception 'WISE_PROVIDER_EVIDENCE_REQUIRED: execution authority required';end if;
   elsif target in ('payment_confirmed','in_transit','delivered','completed','apostille','shipped','complete') then
     if not coalesce(settlement_verified,false) then raise exception 'PAYMENT_REQUIRED: verified Wise settlement required';end if;
   end if;
 end loop;
 return NEW;
end;
$$;

create or replace function public.confirm_wise_payment_for_deal(
  p_deal_id uuid,
  p_payment_reference text,
  p_wise_transaction_reference text,
  p_amount numeric,
  p_currency text,
  p_actor text default 'wise-webhook'
) returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_deal public.deals%rowtype;
  v_discount_id uuid;
  v_redemption_id uuid;
  v_expected_currency text;
begin
  if p_amount is null or p_amount<=0 or p_amount::text in ('NaN','Infinity','-Infinity') then raise exception 'invalid_payment_amount'; end if;
  if p_currency is null or upper(trim(p_currency)) !~ '^[A-Z]{3}$' then raise exception 'invalid_payment_currency'; end if;

  perform pg_advisory_xact_lock(hashtextextended('wise-resource:'||p_wise_transaction_reference,0));
  select * into v_deal from public.deals where id=p_deal_id for update;
  if not found then raise exception 'matter_not_found'; end if;

  if v_deal.payment_attempt_id is null and (v_deal.payment_status in ('failed','refunded') or v_deal.payment_settlement_status in ('failed','refunded','cancelled','expired','reversed','voided')) then raise exception 'fresh_attempt_required';end if;
  if nullif(btrim(p_wise_transaction_reference),'') is null then raise exception 'provider_resource_required';end if;
  if exists(select 1 from public.matter_evidence_ledger where source='wise-attempt-authority' and source_reference=p_wise_transaction_reference and
    (event_type='WISE_ATTEMPT_INVALIDATED' or matter_id<>v_deal.id or (v_deal.payment_attempt_id is not null and metadata->>'attempt_id' is distinct from v_deal.payment_attempt_id::text)))
  then raise exception 'provider_resource_invalidated_or_mismatched';end if;
  if v_deal.amount_due is null or v_deal.amount_due<=0 then raise exception 'amount_due_missing'; end if;
  if round(p_amount*100) <> round(v_deal.amount_due*100) then raise exception 'payment_amount_mismatch'; end if;

  v_expected_currency:=upper(coalesce(nullif(trim(v_deal.currency),''),'USD'));
  if upper(trim(p_currency)) <> v_expected_currency then raise exception 'payment_currency_mismatch'; end if;
  if p_payment_reference is null or trim(p_payment_reference)='' then raise exception 'payment_reference_missing'; end if;
  if coalesce(v_deal.wise_reference,v_deal.deal_id) <> trim(p_payment_reference) then raise exception 'payment_reference_mismatch'; end if;

  if v_deal.payment_status='paid' and v_deal.payment_confirmed=true
    and v_deal.payment_settlement_status='cleared' and round(v_deal.amount_paid*100)=round(p_amount*100)
    and v_deal.wise_transaction_reference=p_wise_transaction_reference then
    return jsonb_build_object('confirmed',true,'already_confirmed',true,'redemption_id',null);
  end if;
  if v_deal.payment_attempt_id is not null and not coalesce(public.current_wise_attempt_evidence(v_deal)
    and v_deal.wise_provider_evidence->>'status'='SETTLED'
    and v_deal.wise_provider_evidence->>'resource_id'=p_wise_transaction_reference,false)
  then raise exception 'current_attempt_settlement_required';end if;

  if nullif(trim(coalesce(v_deal.discount_code,'')),'') is not null then
    select id into v_discount_id
    from public.discount_codes
    where upper(code)=upper(v_deal.discount_code)
    limit 1;
    if v_discount_id is null then raise exception 'attached_discount_not_found'; end if;

    v_redemption_id:=public.redeem_discount_for_matter(
      v_discount_id,v_deal.id,trim(p_payment_reference),p_wise_transaction_reference,
      upper(trim(p_currency)),p_actor
    );
  end if;

  insert into public.matter_evidence_ledger(matter_id,event_type,domain,actor_type,source,source_reference,metadata)
  values(v_deal.id,'WISE_ATTEMPT_SETTLEMENT_CONFIRMED','payment','provider','wise-attempt-authority',p_wise_transaction_reference,
    jsonb_build_object('attempt_id',v_deal.payment_attempt_id,'amount',p_amount,'currency',p_currency,'reference',p_payment_reference));
  update public.deals
  set payment_status='paid',
      payment_confirmed=true,
      payment_method='wise',
      payment_reference=trim(p_payment_reference),
      wise_transaction_reference=p_wise_transaction_reference,
      payment_amount_received=p_amount,
      amount_paid=p_amount,
      payment_confirmed_at=now(),
      payment_settlement_status='cleared',
      payment_cleared_at=now(),
      payment_funding_method='wise',
      updated_at=now()
  where id=v_deal.id;

  return jsonb_build_object('confirmed',true,'already_confirmed',false,'redemption_id',v_redemption_id);
end;
$$;

revoke all on function public.confirm_wise_payment_for_deal(uuid,text,text,numeric,text,text) from public,anon,authenticated;
grant execute on function public.confirm_wise_payment_for_deal(uuid,text,text,numeric,text,text) to service_role;


create index if not exists ron_signers_released_matter_idx on public.ron_signers(matter_id) where signing_url_released is true;

-- Current Wise authority, never the cached RON payment_gate_status, controls links.
create or replace function public.wise_execution_authorized(d public.deals)
returns boolean language sql stable set search_path='' as $$
 select coalesce((d.payment_confirmed is true and d.payment_status='paid' and d.payment_settlement_status='cleared'
   and d.amount_due>0 and d.amount_paid>0 and d.amount_due::text not in ('NaN','Infinity','-Infinity')
   and d.amount_paid::text not in ('NaN','Infinity','-Infinity') and round(d.amount_paid*100)=round(d.amount_due*100))
 or (d.payment_confirmed is false and d.payment_status in ('unpaid','pending') and coalesce(d.amount_paid,0)=0
   and d.payment_settlement_status='observed_pending' and d.payment_observed_at is not null
   and d.payment_observed_amount=d.amount_due
   and upper(btrim(d.payment_observed_currency))=upper(btrim(d.currency))
   and d.payment_observed_reference=coalesce(nullif(btrim(d.wise_reference),''),d.deal_id)
   and public.current_wise_attempt_evidence(d)),false);
$$;
revoke all on function public.wise_execution_authorized(public.deals) from public,anon,authenticated;
grant execute on function public.wise_execution_authorized(public.deals) to service_role;
create or replace function public.guard_ron_signing_authority()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare s public.ron_sessions%rowtype;d public.deals%rowtype;
begin
 if NEW.signing_url_released is not true then return NEW;end if;
 select * into s from public.ron_sessions where id=NEW.ron_session_id;
 if not found or s.matter_id is distinct from NEW.matter_id
   or not coalesce(s.ron_lifecycle_state in ('REQUESTED','STARTED','PROVIDER_ACCEPTED'),false)
   or not coalesce(s.milano_ron_status in ('RON_SESSION_CREATED','SIGNER_INVITED','SIGNING_LINK_RELEASED','IDENTITY_STARTED','PHOTO_ID_PASSED','BIOMETRICS_PASSED','KBA_STARTED','KBA_PASSED','NOTARY_ACCEPTED','SESSION_JOINED','SESSION_STARTED','SESSION_PROCESSING'),false)
   or (s.expired_at is not null and s.expired_at<=clock_timestamp()) then raise exception 'RON_SESSION_ACCESS_INVALID';end if;
 select * into d from public.deals where id=s.matter_id;
 if not found or not public.wise_execution_authorized(d) then raise exception 'WISE_PROVIDER_EVIDENCE_REQUIRED';end if;
 return NEW;
end;$$;
revoke all on function public.guard_ron_signing_authority() from public,anon,authenticated;
create trigger guard_ron_signing_authority before insert or update of signing_url_released,signing_url_encrypted on public.ron_signers
 for each row execute function public.guard_ron_signing_authority();
create or replace function public.revoke_ron_signing_authority()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if TG_TABLE_NAME='deals' then
   if not public.wise_execution_authorized(NEW) then
     with revoked as (update public.ron_signers set signing_url_released=false where matter_id=NEW.id and signing_url_released is true returning id,ron_session_id,matter_id)
     insert into public.matter_evidence_ledger(matter_id,event_type,domain,actor_type,source,source_reference,metadata)
     select matter_id,'RON_SIGNING_ACCESS_REVOKED','ron','system','wise-ron-authority',ron_session_id::text,jsonb_build_object('signer_id',id,'cause','current_payment_authority_invalid') from revoked;
   end if;
 else
   if not coalesce(NEW.ron_lifecycle_state in ('REQUESTED','STARTED','PROVIDER_ACCEPTED'),false) or NEW.milano_ron_status='RON_EXPIRED'
     or (NEW.expired_at is not null and NEW.expired_at<=clock_timestamp()) then
     with revoked as (update public.ron_signers set signing_url_released=false where ron_session_id=NEW.id and signing_url_released is true returning id,ron_session_id,matter_id)
     insert into public.matter_evidence_ledger(matter_id,event_type,domain,actor_type,source,source_reference,metadata)
     select matter_id,'RON_SIGNING_ACCESS_REVOKED','ron','system','wise-ron-authority',ron_session_id::text,jsonb_build_object('signer_id',id,'cause','session_authority_invalid') from revoked;
   end if;
 end if;
 return NEW;
end;$$;
revoke all on function public.revoke_ron_signing_authority() from public,anon,authenticated;
create trigger revoke_ron_signing_on_payment after update on public.deals for each row execute function public.revoke_ron_signing_authority();
create trigger revoke_ron_signing_on_session after update of ron_lifecycle_state,milano_ron_status,expired_at on public.ron_sessions for each row execute function public.revoke_ron_signing_authority();

commit;
